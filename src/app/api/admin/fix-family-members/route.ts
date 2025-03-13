import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // Step 1: Check if email column exists
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'family_members')
      .eq('column_name', 'email');

    if (columnsError) {
      console.error('Error checking columns:', columnsError);
      return NextResponse.json({ error: 'Failed to check columns' }, { status: 500 });
    }

    let emailColumnAdded = false;
    
    // Step 2: Add email column if it doesn't exist
    if (!columns || columns.length === 0) {
      const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: 'ALTER TABLE family_members ADD COLUMN email TEXT;'
      });

      if (alterError) {
        console.error('Error adding email column:', alterError);
        return NextResponse.json({ error: 'Failed to add email column' }, { status: 500 });
      }
      
      emailColumnAdded = true;
    }

    // Step 3: Update family_members with emails from auth.users
    const { error: updateError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        UPDATE family_members fm
        SET email = u.email
        FROM auth.users u
        WHERE fm.user_id = u.id
        AND (fm.email IS NULL OR fm.email = '');
      `
    });

    if (updateError) {
      console.error('Error updating family_members:', updateError);
      return NextResponse.json({ error: 'Failed to update family members' }, { status: 500 });
    }

    // Step 4: Get statistics on the update
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('family_members')
      .select('id, email')
      .is('email', null);

    if (statsError) {
      console.error('Error getting stats:', statsError);
      return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      emailColumnAdded,
      membersWithoutEmail: stats?.length || 0,
      message: 'Family members email field has been fixed'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 