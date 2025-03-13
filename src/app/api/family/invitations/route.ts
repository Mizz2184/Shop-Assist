import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { sendFamilyInvitationEmail } from '@/lib/emailService';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { FamilyRole } from '@/types/family';

// Create a new invitation
export async function POST(request: NextRequest) {
  try {
    console.log('Received invitation request');
    
    // Get request body
    const { familyId, email, role } = await request.json();
    
    console.log('Request body:', { familyId, email, role });
    
    // Validate required fields
    if (!familyId || !email || !role) {
      console.error('Missing required fields:', { familyId, email, role });
      return NextResponse.json(
        { error: 'Missing required fields: familyId, email, role' },
        { status: 400 }
      );
    }
    
    // Validate role
    if (!Object.values(FamilyRole).includes(role as FamilyRole)) {
      console.error('Invalid role:', role);
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: admin, editor, viewer' },
        { status: 400 }
      );
    }
    
    // Log authentication method
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    // Create a Supabase client using cookies
    const cookieSupabase = createRouteHandlerClient({ cookies });
    
    // Try to get user from cookies first
    let { data: { user: cookieUser }, error: cookieUserError } = await cookieSupabase.auth.getUser();
    console.log('Cookie auth result:', { userFound: !!cookieUser, errorOccurred: !!cookieUserError });
    
    // Try to get user from Authorization header if cookie auth failed
    let tokenUser = null;
    let tokenUserError = null;
    let tokenSupabase = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('Attempting token authentication with token:', token.substring(0, 10) + '...');
      
      // Create a new Supabase client with the user's token
      tokenSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
      
      const tokenUserResult = await tokenSupabase.auth.getUser();
      tokenUser = tokenUserResult.data.user;
      tokenUserError = tokenUserResult.error;
      
      console.log('Token auth result:', { 
        userFound: !!tokenUser, 
        errorOccurred: !!tokenUserError,
        errorMessage: tokenUserError?.message
      });
    }
    
    // Determine which authentication method succeeded
    let user = cookieUser || tokenUser;
    let authError = cookieUserError || tokenUserError;
    let supabase = user === cookieUser ? cookieSupabase : (tokenSupabase || cookieSupabase);
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: `Authentication error: ${authError.message}` },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error('No authenticated user found');
      return NextResponse.json(
        { error: 'User not authenticated. Please log in and try again.' },
        { status: 401 }
      );
    }
    
    console.log('Authenticated user:', user.id);
    
    // Check if the user is an admin of the family group
    const { data: membership, error: membershipError } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .single();
    
    if (membershipError) {
      console.error('Membership error:', membershipError);
      return NextResponse.json(
        { error: `Failed to check membership: ${membershipError.message}` },
        { status: 500 }
      );
    }
    
    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this family group' },
        { status: 403 }
      );
    }
    
    if (membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only family admins can send invitations' },
        { status: 403 }
      );
    }
    
    // Check if the user is already a member
    const { data: existingMember, error: existingMemberError } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .eq('email', email.toLowerCase())
      .maybeSingle();
    
    if (existingMemberError) {
      console.error('Error checking existing member:', existingMemberError);
    }
    
    if (existingMember) {
      return NextResponse.json(
        { error: 'This user is already a member of the family group' },
        { status: 400 }
      );
    }
    
    // Check if there's already a pending invitation for this email
    const { data: existingInvitation, error: existingInvitationError } = await supabase
      .from('family_invitations')
      .select('id, status')
      .eq('family_id', familyId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle();
    
    if (existingInvitationError) {
      console.error('Error checking existing invitation:', existingInvitationError);
    }
    
    if (existingInvitation) {
      return NextResponse.json(
        { error: 'There is already a pending invitation for this email' },
        { status: 400 }
      );
    }
    
    // Get the user's profile for the email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }
    
    const inviterName = profile?.name || user.email || 'A family member';
    
    // Get the family name
    const { data: family, error: familyError } = await supabase
      .from('family_groups')
      .select('name')
      .eq('id', familyId)
      .single();
    
    if (familyError) {
      console.error('Error fetching family:', familyError);
      return NextResponse.json(
        { error: `Failed to fetch family details: ${familyError.message}` },
        { status: 500 }
      );
    }
    
    if (!family) {
      return NextResponse.json(
        { error: 'Family group not found' },
        { status: 404 }
      );
    }
    
    // Create a new invitation
    const invitationId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days
    
    console.log('Creating invitation:', {
      id: invitationId,
      family_id: familyId,
      email: email.toLowerCase(),
      role,
      invited_by: user.id
    });
    
    const { data: invitation, error: invitationError } = await supabase
      .from('family_invitations')
      .insert({
        id: invitationId,
        family_id: familyId,
        email: email.toLowerCase(),
        role,
        status: 'pending',
        invited_by: user.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();
    
    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      return NextResponse.json(
        { error: `Failed to create invitation: ${invitationError.message}` },
        { status: 500 }
      );
    }
    
    // Send email notification
    try {
      console.log('Attempting to send invitation email to:', email);
      
      const emailSent = await sendFamilyInvitationEmail(
        invitation,
        family.name,
        inviterName
      );
      
      console.log('Email sending result:', emailSent);
      
      if (!emailSent) {
        console.warn(`Warning: Failed to send invitation email to ${email}`);
        // Continue even if email fails - the invitation is still created
      } else {
        console.log(`Successfully sent invitation email to ${email}`);
      }
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Continue even if email fails - the invitation is still created
    }
    
    console.log('Invitation created successfully:', invitation);
    
    return NextResponse.json({
      message: 'Invitation created successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expires_at
      }
    });
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}

// Get invitations for a family group
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

    // Get all pending invitations for the family group
    const { data: invitations, error: inviteError } = await supabaseClient
      .from('family_invitations')
      .select('*')
      .eq('family_id', familyId)
      .eq('status', 'pending');

    if (inviteError) {
      console.error('Error fetching invitations:', inviteError);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Accept or reject an invitation
export async function PUT(request: NextRequest) {
  try {
    const { invitationId, action } = await request.json();

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Get the current user's ID and email
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('family_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('email', user.email)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      // Add user as a family member
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: invitation.family_id,
          user_id: user.id,
          email: user.email,
          role: invitation.role
        });

      if (memberError) {
        console.error('Error adding family member:', memberError);
        return NextResponse.json(
          { error: 'Failed to add family member' },
          { status: 500 }
        );
      }
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('family_invitations')
      .update({
        status: action === 'accept' ? 'accepted' : 'rejected',
        responded_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Cancel an invitation (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
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

    // Get the invitation and check if user is admin of the family group
    const { data: invitation, error: inviteError } = await supabase
      .from('family_invitations')
      .select('family_id')
      .eq('id', invitationId)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation' },
        { status: 404 }
      );
    }

    // Check if user is an admin of the family group
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', invitation.family_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !member || member.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from('family_invitations')
      .delete()
      .eq('id', invitationId);

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 