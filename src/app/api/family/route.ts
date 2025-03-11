import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Get all family groups for the current user
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Set the session in Supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get family groups where user is a member
    const { data: memberData, error: memberError } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id);

    if (memberError) {
      console.error('Error fetching family memberships:', memberError);
      return NextResponse.json({ error: 'Failed to fetch family groups' }, { status: 500 });
    }

    const familyIds = memberData.map(member => member.family_id);

    // Get the family groups
    const { data: familyGroups, error: familyError } = await supabase
      .from('family_groups')
      .select('*')
      .in('id', familyIds);

    if (familyError) {
      console.error('Error fetching family groups:', familyError);
      return NextResponse.json({ error: 'Failed to fetch family groups' }, { status: 500 });
    }

    return NextResponse.json(familyGroups);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new family group
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Create a new Supabase client with the user's token
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false
        }
      }
    );

    // Get the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create the family group
    const { data: familyGroup, error: createError } = await supabaseClient
      .from('family_groups')
      .insert([
        {
          name,
          created_by: user.id
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating family group:', createError);
      return NextResponse.json({ 
        error: 'Failed to create family group',
        details: createError.message
      }, { status: 500 });
    }

    // Add the creator as an admin member
    const { error: memberError } = await supabaseClient
      .from('family_members')
      .insert([
        {
          family_id: familyGroup.id,
          user_id: user.id,
          role: 'admin'
        }
      ]);

    if (memberError) {
      console.error('Error adding creator as member:', memberError);
      // Delete the family group if we couldn't add the creator as a member
      await supabaseClient.from('family_groups').delete().eq('id', familyGroup.id);
      return NextResponse.json({ 
        error: 'Failed to create family group',
        details: memberError.message
      }, { status: 500 });
    }

    return NextResponse.json(familyGroup);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update a family group
export async function PUT(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Create a new Supabase client with the user's token
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false
        }
      }
    );

    // Get the user with the token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
    }

    // Update the family group directly - no need to check for admin role since our policies handle that
    const { data: familyGroup, error: updateError } = await supabaseClient
      .from('family_groups')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating family group:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update family group',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json(familyGroup);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete a family group
export async function DELETE(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Create a new Supabase client with the user's token
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false
        }
      }
    );

    // Get the user with the token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Delete the family group directly - no need to check for admin role since our policies handle that
    const { error: deleteError } = await supabaseClient
      .from('family_groups')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting family group:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete family group',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 