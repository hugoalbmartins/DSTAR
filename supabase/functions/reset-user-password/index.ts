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
    console.log('Reset password function called');

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
    console.log('Auth header present:', !!authHeader);

    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser(token);

    console.log('Requesting user:', requestingUser?.id, 'Auth error:', authError);

    if (authError || !requestingUser) {
      throw new Error('Unauthorized');
    }

    const { data: requestingUserProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', requestingUser.id)
      .maybeSingle();

    console.log('User profile:', requestingUserProfile, 'Profile error:', profileError);

    if (profileError || !requestingUserProfile || requestingUserProfile.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const { userId, newPassword } = await req.json();

    console.log('Request data:', { userId, passwordLength: newPassword?.length });

    if (!userId || !newPassword) {
      throw new Error('Missing required fields: userId, newPassword');
    }

    // Validar password
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    console.log('Updating password for user:', userId);

    // Atualizar password do utilizador usando admin API
    const { data: updateData, error: updateError } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    console.log('Update result:', { updateData, updateError });

    if (updateError) {
      console.error('Error updating user password:', updateError);
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    // Atualizar flag must_change_password na tabela users
    const { error: profileUpdateError } = await supabaseClient
      .from('users')
      .update({ must_change_password: false })
      .eq('id', userId);

    console.log('Profile update error:', profileUpdateError);

    if (profileUpdateError) {
      console.error('Error updating user profile:', profileUpdateError);
      throw new Error(`Failed to update user profile: ${profileUpdateError.message}`);
    }

    console.log('Password reset successful');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password updated successfully'
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in reset-user-password function:', error);

    let errorMessage = error.message || 'Internal server error';
    let statusCode = 400;

    if (error.message === 'Unauthorized' || error.message === 'Unauthorized: Admin access required') {
      statusCode = 401;
    } else if (error.message === 'Missing authorization header') {
      statusCode = 401;
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error.toString()
      }),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
