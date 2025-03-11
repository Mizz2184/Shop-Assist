import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Create a new shared grocery list
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

    const { familyId, name } = await request.json();

    // Get the current user's ID
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a member of the family group
    const { data: member, error: memberError } = await supabaseClient
      .from('family_members')
      .select('role')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !member || member.role === 'viewer') {
      return NextResponse.json(
        { error: 'Unauthorized - Editor or admin access required' },
        { status: 403 }
      );
    }

    // Create the shared list
    const { data: list, error: listError } = await supabaseClient
      .from('shared_grocery_lists')
      .insert({
        id: uuidv4(),
        family_id: familyId,
        name,
        created_by: user.id
      })
      .select()
      .single();

    if (listError) {
      console.error('Error creating shared list:', listError);
      return NextResponse.json(
        { error: 'Failed to create shared list' },
        { status: 500 }
      );
    }

    // Log the activity
    await supabaseClient
      .from('list_activity_log')
      .insert({
        list_id: list.id,
        user_id: user.id,
        action: 'created',
        details: `Created shared list "${name}"`
      });

    return NextResponse.json(list);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Get shared grocery lists for a family
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');

    if (!familyId) {
      return NextResponse.json(
        { error: 'Family group ID is required' },
        { status: 400 }
      );
    }

    // Get the current user's ID
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a member of the family group
    const { data: member, error: memberError } = await supabaseClient
      .from('family_members')
      .select('role')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Unauthorized - Family member access required' },
        { status: 403 }
      );
    }

    // Get all shared lists for the family group
    const { data: lists, error: listError } = await supabaseClient
      .from('shared_grocery_lists')
      .select(`
        *,
        items:shared_list_items(*)
      `)
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });

    if (listError) {
      console.error('Error fetching shared lists:', listError);
      return NextResponse.json(
        { error: 'Failed to fetch shared lists' },
        { status: 500 }
      );
    }

    return NextResponse.json(lists);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Update a shared grocery list
export async function PUT(request: NextRequest) {
  try {
    const { listId, name } = await request.json();

    // Get the current user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the list and check permissions
    const { data: list, error: listError } = await supabase
      .from('shared_grocery_lists')
      .select('family_id')
      .eq('id', listId)
      .single();

    if (listError || !list) {
      return NextResponse.json(
        { error: 'Invalid list' },
        { status: 404 }
      );
    }

    // Check if user is a member with appropriate permissions
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', list.family_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !member || member.role === 'viewer') {
      return NextResponse.json(
        { error: 'Unauthorized - Editor or admin access required' },
        { status: 403 }
      );
    }

    // Update the list
    const { data: updatedList, error: updateError } = await supabase
      .from('shared_grocery_lists')
      .update({
        name,
        updated_at: new Date().toISOString()
      })
      .eq('id', listId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating shared list:', updateError);
      return NextResponse.json(
        { error: 'Failed to update shared list' },
        { status: 500 }
      );
    }

    // Log the activity
    await supabase
      .from('list_activity_log')
      .insert({
        list_id: listId,
        user_id: user.id,
        action: 'updated',
        details: `Updated shared list name to "${name}"`
      });

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Delete a shared grocery list
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('id');

    if (!listId) {
      return NextResponse.json(
        { error: 'List ID is required' },
        { status: 400 }
      );
    }

    // Get the current user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the list and check permissions
    const { data: list, error: listError } = await supabase
      .from('shared_grocery_lists')
      .select('family_id, name')
      .eq('id', listId)
      .single();

    if (listError || !list) {
      return NextResponse.json(
        { error: 'Invalid list' },
        { status: 404 }
      );
    }

    // Check if user is an admin of the family group
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', list.family_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !member || member.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Delete the list (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('shared_grocery_lists')
      .delete()
      .eq('id', listId);

    if (deleteError) {
      console.error('Error deleting shared list:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete shared list' },
        { status: 500 }
      );
    }

    // Log the activity
    await supabase
      .from('list_activity_log')
      .insert({
        list_id: listId,
        user_id: user.id,
        action: 'deleted',
        details: `Deleted shared list "${list.name}"`
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 