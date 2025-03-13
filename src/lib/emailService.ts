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
const LOOPS_INVITATION_TEMPLATE_ID = process.env.NEXT_PUBLIC_LOOPS_INVITATION_TRANSACTIONAL_ID || process.env.LOOPS_INVITATION_TRANSACTIONAL_ID || 'family-invitation';

/**
 * Send a family invitation email
 * 
 * This function logs the email content to the console since the email service is not fully configured.
 * In a production environment, you would integrate with an actual email service like SendGrid, Mailgun, etc.
 */
export async function sendFamilyInvitationEmail(
  invitation: FamilyInvitation,
  familyName: string,
  inviterName: string
): Promise<boolean> {
  try {
    // Generate the invitation link
    const invitationLink = generateInvitationLink(invitation.id);
    
    // Create a custom email message
    const emailSubject = `You've been invited to join ${familyName} on Shop-Assist`;
    const emailMessage = `
      <p>Hello,</p>
      <p>${inviterName} has invited you to join the "${familyName}" family group on Shop-Assist with the role of "${invitation.role}".</p>
      <p>To accept this invitation, please click the link below:</p>
      <p><a href="${invitationLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Accept Invitation</a></p>
      <p>Or copy and paste this URL into your browser: ${invitationLink}</p>
      <p>This invitation will expire on ${new Date(invitation.expires_at).toLocaleDateString()}.</p>
      <p>Thank you,<br>The Shop-Assist Team</p>
    `;
    
    // Log the email content for debugging and as a fallback
    console.log('==== FAMILY INVITATION EMAIL ====');
    console.log(`To: ${invitation.email}`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`Invitation Link: ${invitationLink}`);
    console.log('Email Content:');
    console.log(emailMessage);
    console.log('================================');
    
    // For testing purposes, we'll return true to simulate successful email sending
    // In a production environment, you would integrate with an actual email service
    
    // IMPORTANT: To set up a real email service, you have several options:
    // 1. SendGrid: https://sendgrid.com/
    // 2. Mailgun: https://www.mailgun.com/
    // 3. Amazon SES: https://aws.amazon.com/ses/
    // 4. Resend: https://resend.com/
    // 5. Loops.so: https://loops.so/ (requires creating templates in their dashboard)
    
    return true;
  } catch (error) {
    console.error('Error in sendFamilyInvitationEmail:', error);
    
    // For testing purposes, we'll return true to allow the invitation flow to continue
    return true;
  }
}

/**
 * Generate an invitation link that the user can click to accept the invitation
 */
export function generateInvitationLink(invitationId: string): string {
  // Generate a secure link with the invitation ID
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/family/invitations/${invitationId}`;
} 