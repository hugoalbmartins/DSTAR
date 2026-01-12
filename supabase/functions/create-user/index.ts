import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !requestingUser) {
      throw new Error('Unauthorized');
    }

    const { data: requestingUserProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', requestingUser.id)
      .maybeSingle();

    if (profileError || !requestingUserProfile || requestingUserProfile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const { email, password, name, role, commission_percentage, commission_threshold } = await req.json();

    if (!email || !password || !name) {
      throw new Error('Missing required fields: email, password, name');
    }

    const { data: authData, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
      },
    });

    if (createError) {
      console.error('Error creating auth user:', createError);
      throw createError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    const insertData: any = {
      id: authData.user.id,
      email,
      name,
      role: role || 'vendedor',
      active: true,
      must_change_password: true,
    };

    if (commission_percentage !== undefined) {
      insertData.commission_percentage = commission_percentage;
    }
    if (commission_threshold !== undefined) {
      insertData.commission_threshold = commission_threshold;
    }

    const { data: profileData, error: profileInsertError } = await supabaseClient
      .from('users')
      .insert([insertData])
      .select()
      .single();

    if (profileInsertError) {
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      console.error('Error creating user profile:', profileInsertError);
      throw profileInsertError;
    }

    return new Response(
      JSON.stringify({ user: profileData }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in create-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: error.message === 'Unauthorized' || error.message === 'Unauthorized: Admin access required' ? 401 : 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});