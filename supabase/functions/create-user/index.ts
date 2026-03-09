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
    // Create admin client
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

    // Get the JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[CREATE-USER] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !requestingUser) {
      console.error('[CREATE-USER] Auth error:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[CREATE-USER] Request from:', requestingUser.email);

    // Check if requesting user is admin
    const { data: requestingUserProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', requestingUser.id)
      .maybeSingle();

    if (profileError) {
      console.error('[CREATE-USER] Profile error:', profileError.message);
      return new Response(
        JSON.stringify({ error: 'Error checking permissions' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!requestingUserProfile || requestingUserProfile.role !== 'admin') {
      console.error('[CREATE-USER] User is not admin:', requestingUserProfile?.role);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[CREATE-USER] Admin verified, processing request...');

    const body = await req.json();
    console.log('[CREATE-USER] Request body received:', {
      hasEmail: !!body.email,
      hasPassword: !!body.password,
      hasName: !!body.name,
      role: body.role
    });

    const { email, password, name, role, commission_percentage, commission_threshold } = body;

    if (!email || !password || !name) {
      console.error('[CREATE-USER] Missing required fields:', { email: !!email, password: !!password, name: !!name });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, name' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar se o email já existe em auth.users
    console.log('[CREATE-USER] Checking if email exists...');
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const emailExists = existingUsers?.users.some(u => u.email?.toLowerCase() === email.toLowerCase());

    if (emailExists) {
      console.log('[CREATE-USER] Email already exists in auth.users');
      return new Response(
        JSON.stringify({ error: 'Um utilizador com este email já existe' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar também na tabela users (caso haja inconsistência)
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      console.log('[CREATE-USER] Email already exists in users table');
      return new Response(
        JSON.stringify({ error: 'Um utilizador com este email já existe na base de dados' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[CREATE-USER] Creating auth user with email:', email);

    const { data: authData, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
      },
    });

    if (createError) {
      console.error('[CREATE-USER] Error creating auth user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message || 'Erro ao criar utilizador no sistema de autenticação' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!authData.user) {
      console.error('[CREATE-USER] No user data returned');
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[CREATE-USER] Auth user created with ID:', authData.user.id);

    const insertData: any = {
      id: authData.user.id,
      email,
      name,
      role: role || 'vendedor',
      active: true,
      must_change_password: true,
    };

    if (commission_percentage !== undefined && commission_percentage !== null) {
      insertData.commission_percentage = commission_percentage;
    }
    if (commission_threshold !== undefined && commission_threshold !== null) {
      insertData.commission_threshold = commission_threshold;
    }

    console.log('[CREATE-USER] Inserting user profile data:', insertData);

    const { data: profileData, error: profileInsertError } = await supabaseClient
      .from('users')
      .insert([insertData])
      .select()
      .single();

    if (profileInsertError) {
      console.error('[CREATE-USER] Error creating user profile:', {
        message: profileInsertError.message,
        details: profileInsertError.details,
        hint: profileInsertError.hint,
        code: profileInsertError.code,
      });
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({
          error: `Erro ao criar perfil: ${profileInsertError.message}`,
          details: profileInsertError.details,
          hint: profileInsertError.hint
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[CREATE-USER] User profile created successfully');

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
    console.error('[CREATE-USER] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});