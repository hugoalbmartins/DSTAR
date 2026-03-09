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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Client para validar o token do utilizador (usa anon key)
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user: requestingUser }, error: authError } = await userClient.auth.getUser();

    if (authError || !requestingUser) {
      console.error('Auth validation failed:', authError);
      throw new Error('Unauthorized');
    }

    console.log('Request from user:', requestingUser.email);

    // Client admin para operações privilegiadas
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

    const { data: requestingUserProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', requestingUser.id)
      .maybeSingle();

    if (profileError || !requestingUserProfile || requestingUserProfile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const body = await req.json();
    console.log('Request body received:', {
      hasEmail: !!body.email,
      hasPassword: !!body.password,
      hasName: !!body.name,
      role: body.role
    });

    const { email, password, name, role, commission_percentage, commission_threshold } = body;

    if (!email || !password || !name) {
      console.error('Missing required fields:', { email: !!email, password: !!password, name: !!name });
      throw new Error('Missing required fields: email, password, name');
    }

    // Verificar se o email já existe em auth.users
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const emailExists = existingUsers?.users.some(u => u.email?.toLowerCase() === email.toLowerCase());

    if (emailExists) {
      throw new Error('Um utilizador com este email já existe');
    }

    // Verificar também na tabela users (caso haja inconsistência)
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new Error('Um utilizador com este email já existe na base de dados');
    }

    console.log('Creating auth user with email:', email);

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
      throw new Error(createError.message || 'Erro ao criar utilizador no sistema de autenticação');
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    console.log('Auth user created with ID:', authData.user.id);

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

    console.log('Inserting user profile data:', insertData);

    const { data: profileData, error: profileInsertError } = await supabaseClient
      .from('users')
      .insert([insertData])
      .select()
      .single();

    if (profileInsertError) {
      console.error('Error creating user profile:', {
        message: profileInsertError.message,
        details: profileInsertError.details,
        hint: profileInsertError.hint,
        code: profileInsertError.code,
      });
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Erro ao criar perfil: ${profileInsertError.message} ${profileInsertError.details || ''} ${profileInsertError.hint || ''}`);
    }

    console.log('User profile created successfully');

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