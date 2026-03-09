import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user already exists in auth.users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === 'test@tester.pt');

    if (existingUser) {
      // Update password if user exists
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: 'Crm2026*' }
      );

      if (updateError) {
        throw new Error(`Failed to update password: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'User test@tester.pt password updated',
          userId: existingUser.id,
          alreadyExists: true
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'test@tester.pt',
      password: 'Crm2026*',
      email_confirm: true,
      user_metadata: {
        name: 'Test Admin'
      },
      app_metadata: {
        role: 'admin'
      }
    });

    if (createError) {
      console.error('Error creating auth user:', createError);
      throw new Error(`Failed to create auth user: ${createError.message}`);
    }

    if (!authData.user) {
      throw new Error('Failed to create user - no user data returned');
    }

    // Update public.users with the correct auth user ID
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        id: authData.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('email', 'test@tester.pt');

    if (updateError) {
      console.error('Error updating public.users:', updateError);
      // Try to delete the auth user since we couldn't link it
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to link user in public.users: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test admin user created successfully',
        userId: authData.user.id,
        email: 'test@tester.pt'
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
    console.error('Error in create-test-admin:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
