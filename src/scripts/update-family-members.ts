import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function updateFamilyMembers() {
  // Create a Supabase client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  console.log('Checking if email column exists in family_members table...');
  
  try {
    // First, check if the email column exists
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'family_members')
      .eq('column_name', 'email');

    if (columnsError) {
      console.error('Error checking columns:', columnsError);
      return;
    }

    // If email column doesn't exist, add it
    if (!columns || columns.length === 0) {
      console.log('Adding email column to family_members table...');
      const { error: alterError } = await supabase.rpc('exec', {
        query: 'ALTER TABLE family_members ADD COLUMN email TEXT;'
      });

      if (alterError) {
        console.error('Error adding email column:', alterError);
        return;
      }
      console.log('Email column added successfully.');
    } else {
      console.log('Email column already exists.');
    }

    // Update family_members with emails from auth.users
    console.log('Updating family_members with emails from auth.users...');
    const { error: updateError } = await supabase.rpc('exec', {
      query: `
        UPDATE family_members fm
        SET email = u.email
        FROM auth.users u
        WHERE fm.user_id = u.id
        AND (fm.email IS NULL OR fm.email = '');
      `
    });

    if (updateError) {
      console.error('Error updating family_members:', updateError);
      return;
    }

    console.log('Family members updated successfully with emails.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
updateFamilyMembers()
  .then(() => console.log('Done'))
  .catch(err => console.error('Script error:', err)); 