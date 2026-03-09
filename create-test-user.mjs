import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Read .env file manually
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env file');
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? 'Present' : 'Missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    console.log('Creating test@tester.pt user...');

    // First check if user exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const existingUser = existingUsers.users.find(u => u.email === 'test@tester.pt');

    if (existingUser) {
      console.log('User already exists, updating password...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: 'Crm2026*' }
      );

      if (updateError) {
        console.error('Error updating password:', updateError);
        throw updateError;
      }

      console.log('✓ Password updated successfully!');
      console.log('User ID:', existingUser.id);

      // Update public.users with correct ID
      const { error: publicUpdateError } = await supabase
        .from('users')
        .update({ id: existingUser.id })
        .eq('email', 'test@tester.pt');

      if (publicUpdateError) {
        console.error('Error updating public.users:', publicUpdateError);
      } else {
        console.log('✓ Public users table updated');
      }

      return;
    }

    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@tester.pt',
      password: 'Crm2026*',
      email_confirm: true,
      user_metadata: {
        name: 'Test Admin'
      }
    });

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    console.log('✓ User created successfully!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);

    // Update public.users with the auth user ID
    const { error: updateError } = await supabase
      .from('users')
      .update({ id: data.user.id })
      .eq('email', 'test@tester.pt');

    if (updateError) {
      console.error('Error updating public.users:', updateError);
      console.log('You may need to manually update the users table');
    } else {
      console.log('✓ Public users table updated');
    }

    console.log('\n✓ Test user is ready!');
    console.log('Email: test@tester.pt');
    console.log('Password: Crm2026*');

  } catch (error) {
    console.error('Failed to create test user:', error.message);
    process.exit(1);
  }
}

createTestUser();
