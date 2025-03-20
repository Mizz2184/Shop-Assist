import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Get all family groups for the current user
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid auth header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    console.log('Token present:', !!token);

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
          persistSession: false,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      }
    );

    // Get the user with the token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError) {
      console.log('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError }, { status: 401 });
    }
    if (!user) {
      console.log('No user found with token');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    console.log('User found:', user.id);

    // Implement retry logic for fetching family memberships
    let retries = 0;
    const maxRetries = 3;
    let memberData: any[] = [];
    let memberError: any = null;

    while (retries < maxRetries) {
      try {
        // Get family groups where user is a member
        const result = await supabaseClient
          .from('family_members')
          .select('family_id')
          .eq('user_id', user.id)
          .limit(20);

        memberData = result.data || [];
        memberError = result.error;

        if (!memberError) {
          break;
        }

        console.log(`Retry ${retries + 1}/${maxRetries} failed:`, memberError);
        retries++;
        
        if (retries < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        }
      } catch (error) {
        console.error(`Error on retry ${retries + 1}:`, error);
        retries++;
        
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        }
      }
    }

    if (memberError) {
      console.log('Error fetching family memberships:', memberError);
      return NextResponse.json({ 
        error: 'Failed to fetch family groups', 
        details: memberError 
      }, { status: 500 });
    }
    console.log('Member data found:', memberData?.length || 0, 'memberships');

    const familyIds = memberData?.map(member => member.family_id) || [];
    
    if (familyIds.length === 0) {
      // Return empty array early if no memberships
      return NextResponse.json([]);
    }

    // Implement retry logic for fetching family groups
    retries = 0;
    let familyGroups: any[] = [];
    let familyError: any = null;

    while (retries < maxRetries) {
      try {
        // Get the family groups
        const result = await supabaseClient
          .from('family_groups')
          .select('*')
          .in('id', familyIds)
          .limit(20); // Limit to 20 groups to reduce memory usage

        familyGroups = result.data || [];
        familyError = result.error;

        if (!familyError) {
          break;
        }

        console.log(`Retry ${retries + 1}/${maxRetries} failed:`, familyError);
        retries++;
        
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        }
      } catch (error) {
        console.error(`Error on retry ${retries + 1}:`, error);
        retries++;
        
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        }
      }
    }

    if (familyError) {
      console.log('Error fetching family groups:', familyError);
      return NextResponse.json({ 
        error: 'Failed to fetch family groups', 
        details: familyError 
      }, { status: 500 });
    }
    console.log('Family groups found:', familyGroups?.length || 0, 'groups');

    return NextResponse.json(familyGroups || []);
  } catch (error) {
    console.error('Unexpected error in family GET route:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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