import { FamilyInvitation } from '@/types/family';
import axios from 'axios';

/**
 * Email service for sending notifications
 * 
 * This is a mock implementation that simulates sending emails.
 * In a production environment, you would integrate with an actual email service.
 */

// Loops.so API configuration
const LOOPS_API_KEY = process.env.NEXT_PUBLIC_LOOPS_API_KEY || process.env.LOOPS_API_KEY;
const LOOPS_API_URL = 'https://app.loops.so/api/v1/transactional';
const LOOPS_INVITATION_TEMPLATE_ID = process.env.NEXT_PUBLIC_LOOPS_INVITATION_TRANSACTIONAL_ID || process.env.LOOPS_INVITATION_TRANSACTIONAL_ID;

/**
 * Send a family invitation email using Loops.so
 */
export async function sendFamilyInvitationEmail(
  invitation: FamilyInvitation,
  familyName: string,
  inviterName: string
): Promise<boolean> {
  try {
    console.log('Starting sendFamilyInvitationEmail with:', {
      invitationId: invitation.id,
      email: invitation.email,
      familyName,
      inviterName,
      apiKey: LOOPS_API_KEY ? 'Present' : 'Missing',
      templateId: LOOPS_INVITATION_TEMPLATE_ID ? 'Present' : 'Missing'
    });
    
    // Generate the invitation link
    const invitationLink = generateInvitationLink(invitation.id);
    console.log('Generated invitation link:', invitationLink);
    
    // Send email using Loops.so
    console.log('Sending email via Loops.so...');
    const response = await axios.post(
      LOOPS_API_URL,
      {
        transactionalId: LOOPS_INVITATION_TEMPLATE_ID,
        email: invitation.email,
        dataVariables: {
          inviteName: inviterName,
          familyName: familyName,
          invitationLink: invitationLink,
          role: invitation.role,
          expiresAt: invitation.expires_at
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${LOOPS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Received response from Loops.so:', response.data);

    if (response.data.success) {
      console.log('Invitation email sent successfully to:', invitation.email);
      return true;
    } else {
      console.error('Failed to send invitation email:', response.data.error);
      return false;
    }
  } catch (error: any) {
    console.error('Error sending invitation email:', {
      error: error.message,
      response: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      }
    });
    return false;
  }
}

/**
 * Generate an invitation link
 */
export function generateInvitationLink(invitationId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shop-assist.vercel.app';
  console.log('Generating invitation link with:', { baseUrl, invitationId });
  return `${baseUrl}/family/invitations/${invitationId}`;
} 