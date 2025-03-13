import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET family members for a specific family
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/family/members - Start');
    
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
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
          persistSession: false
        }
      }
    );

    // Get the user with the token
    console.log('Getting user with token');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('User found:', user.id);

    // Get the family ID from the query parameters
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    console.log('Family ID:', familyId);

    if (!familyId) {
      return NextResponse.json({ error: 'Family ID is required' }, { status: 400 });
    }

    // Check if user is a member of the family group
    console.log('Checking if user is a member of the family group');
    try {
      const { data: member, error: memberError } = await supabaseClient
        .from('family_members')
        .select('role')
        .eq('family_id', familyId)
        .eq('user_id', user.id)
        .single();

      console.log('Member check result:', { member, error: memberError });

      if (memberError) {
        if (memberError.code === 'PGRST116') {
          console.log('User is not a member of this family group');
          return NextResponse.json(
            { error: 'Unauthorized - Family member access required' },
            { status: 403 }
          );
        } else {
          console.error('Error checking membership:', memberError);
          return NextResponse.json({ 
            error: 'Failed to check family membership',
            details: memberError
          }, { status: 500 });
        }
      }

      if (!member) {
        console.log('No member record found');
        return NextResponse.json(
          { error: 'Unauthorized - Family member access required' },
          { status: 403 }
        );
      }
      
      console.log('User is a member with role:', member.role);
    } catch (memberCheckError) {
      console.error('Unexpected error checking membership:', memberCheckError);
      return NextResponse.json({ 
        error: 'Failed to check family membership',
        details: memberCheckError instanceof Error ? memberCheckError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Fetch family members
    console.log('Fetching family members');
    try {
      const { data: membersData, error: membersError } = await supabaseClient
        .from('family_members')
        .select(`
          id,
          family_id,
          user_id,
          role,
          joined_at,
          invited_by,
          email
        `)
        .eq('family_id', familyId);

      if (membersError) {
        console.error('Error fetching family members:', membersError);
        return NextResponse.json({ 
          error: 'Failed to fetch family members',
          details: membersError
        }, { status: 500 });
      }

      console.log(`Found ${membersData?.length || 0} family members`);
      
      // Create a mutable copy of the members data
      let members = [...membersData];

      // Now fetch profiles separately to avoid join issues
      const userIds = members.map(member => member.user_id);
      console.log('Fetching profiles for user IDs:', userIds);
      
      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return NextResponse.json({ 
          error: 'Failed to fetch profiles',
          details: profilesError
        }, { status: 500 });
      }

      console.log(`Found ${profiles?.length || 0} profiles`);

      // Map profiles to members
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Get user emails for any members missing email
      const membersWithoutEmail = members.filter(m => !m.email);
      if (membersWithoutEmail.length > 0) {
        console.log(`Found ${membersWithoutEmail.length} members without email, fetching from auth.users`);
        const userIds = membersWithoutEmail.map(m => m.user_id);
        
        try {
          // Fetch user emails directly from auth.users
          const { data: users, error: usersError } = await supabaseClient
            .from('auth.users')
            .select('id, email')
            .in('id', userIds);
          
          if (!usersError && users && users.length > 0) {
            console.log(`Found ${users.length} users with emails`);
            
            const userMap = new Map();
            users.forEach(user => {
              if (user.email) {
                userMap.set(user.id, user.email);
              }
            });
            
            // Update members with emails
            members = members.map(member => {
              if (!member.email && userMap.has(member.user_id)) {
                return {
                  ...member,
                  email: userMap.get(member.user_id)
                };
              }
              return member;
            });
            
            // Also update the database for future requests
            for (const member of membersWithoutEmail) {
              if (userMap.has(member.user_id)) {
                await supabaseClient
                  .from('family_members')
                  .update({ email: userMap.get(member.user_id) })
                  .eq('id', member.id);
              }
            }
          } else {
            console.log('No user emails found or error occurred:', usersError);
          }
        } catch (authError) {
          console.error('Error fetching user emails:', authError);
          // Continue without emails, don't fail the request
        }
      }

      const transformedMembers = members.map(member => {
        const profile = profileMap.get(member.user_id) || { name: null, avatar_url: null };
        return {
          ...member,
          profile
        };
      });

      return NextResponse.json(transformedMembers);
    } catch (fetchError) {
      console.error('Unexpected error fetching data:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch family members',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in GET /api/family/members:', error);
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