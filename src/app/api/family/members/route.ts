import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET family members for a specific family
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

    // Get the user with the token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the family ID from the query parameters
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');

    if (!familyId) {
      return NextResponse.json({ error: 'Family ID is required' }, { status: 400 });
    }

    // Fetch family members
    const { data: members, error: membersError } = await supabaseClient
      .from('family_members')
      .select(`
        *,
        profile:profiles(name, avatar_url)
      `)
      .eq('family_id', familyId);

    if (membersError) {
      console.error('Error fetching family members:', membersError);
      return NextResponse.json({ 
        error: 'Failed to fetch family members',
        details: membersError.message
      }, { status: 500 });
    }

    return NextResponse.json(members);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update a family member's role
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
    const { familyId, userId, role } = body;

    if (!familyId || !userId || !role) {
      return NextResponse.json({ error: 'Family ID, user ID, and role are required' }, { status: 400 });
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be admin, editor, or viewer' }, { status: 400 });
    }

    // Update the member's role
    const { data: updatedMember, error: updateError } = await supabaseClient
      .from('family_members')
      .update({ 
        role,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('family_id', familyId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating family member:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update family member',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Remove a member from a family
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

    // Get the parameters from the URL
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const userId = searchParams.get('userId');

    if (!familyId || !userId) {
      return NextResponse.json({ error: 'Family ID and user ID are required' }, { status: 400 });
    }

    // Delete the family member
    const { error: deleteError } = await supabaseClient
      .from('family_members')
      .delete()
      .eq('family_id', familyId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error removing family member:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to remove family member',
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