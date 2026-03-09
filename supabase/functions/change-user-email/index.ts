import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChangeEmailRequest {
  userId: string;
  newEmail: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client with service role for admin operations
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

    // Create regular client to verify user permissions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Verify the requesting user is authenticated and is admin
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !requestingUser) {
      throw new Error('Unauthorized');
    }

    // Check if requesting user is admin
    const { data: requestingUserProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', requestingUser.id)
      .maybeSingle();

    if (profileError || !requestingUserProfile || requestingUserProfile.role !== 'admin') {
      throw new Error('Only administrators can change user emails');
    }

    // Parse request body
    const { userId, newEmail }: ChangeEmailRequest = await req.json();

    if (!userId || !newEmail) {
      throw new Error('userId and newEmail are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      throw new Error('Invalid email format');
    }

    // Check if the new email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUser?.users.some(u => u.email === newEmail && u.id !== userId);

    if (emailExists) {
      throw new Error('Email already in use by another user');
    }

    // Update email in auth.users using admin API
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email: newEmail,
        email_confirm: true
      }
    );

    if (updateError) {
      console.error('Error updating auth.users:', updateError);
      throw new Error(`Failed to update email in auth system: ${updateError.message}`);
    }

    // Update email in public.users table
    const { error: publicUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        email: newEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (publicUpdateError) {
      console.error('Error updating public.users:', publicUpdateError);
      throw new Error(`Failed to update email in public users: ${publicUpdateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email updated successfully',
        user: updateData.user
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
    console.error('Error in change-user-email:', error);

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
