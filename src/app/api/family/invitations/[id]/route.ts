import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest
) {
  // Extract the ID from the URL path
  const pathParts = request.nextUrl.pathname.split('/');
  const invitationId = pathParts[pathParts.length - 1];
  
  try {
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('family_invitations')
      .select('*, family:family_id(name), inviter:inviter_id(profile:profiles(name))')
      .eq('id', invitationId)
      .single();
    
    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }
    
    // Check if the invitation has expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }
    
    // Return the invitation details
    return NextResponse.json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      familyId: invitation.family_id,
      familyName: invitation.family?.name,
      inviterId: invitation.inviter_id,
      inviterName: invitation.inviter?.profile?.name,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest
) {
  // Extract the ID from the URL path
  const pathParts = request.nextUrl.pathname.split('/');
  const invitationId = pathParts[pathParts.length - 1];
  
  try {
    // Parse the request body
    const { action } = await request.json();
    
    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "reject"' },
        { status: 400 }
      );
    }
    
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('family_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();
    
    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }
    
    // Check if the invitation is for the current user
    if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation is not for you' },
        { status: 403 }
      );
    }
    
    // Check if the invitation has expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }
    
    // Check if the invitation is already accepted or rejected
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation has already been ${invitation.status}` },
        { status: 400 }
      );
    }
    
    // Handle the action
    if (action === 'accept') {
      // Start a transaction
      const { error: transactionError } = await supabase.rpc('handle_invitation_acceptance', {
        p_invitation_id: invitationId,
        p_user_id: user.id
      });
      
      if (transactionError) {
        console.error('Error accepting invitation:', transactionError);
        return NextResponse.json(
          { error: 'Failed to accept invitation' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        message: 'Invitation accepted successfully',
        familyId: invitation.family_id
      });
    } else {
      // Reject the invitation
      const { error: updateError } = await supabase
        .from('family_invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId);
      
      if (updateError) {
        console.error('Error rejecting invitation:', updateError);
        return NextResponse.json(
          { error: 'Failed to reject invitation' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        message: 'Invitation rejected successfully'
      });
    }
  } catch (error) {
    console.error('Error processing invitation:', error);
    return NextResponse.json(
      { error: 'Failed to process invitation' },
      { status: 500 }
    );
  }
} 