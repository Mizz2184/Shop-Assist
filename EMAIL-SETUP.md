# Setting Up Email Sending for Family Invitations

This document provides instructions on how to set up email sending for family invitations in the Shop-Assist application.

## Current Implementation

Currently, the application uses a mock implementation that logs email content to the console. This is useful for development and testing, but in a production environment, you'll want to use a real email service.

## Email Service Options

Here are some popular email service providers you can integrate with:

1. **SendGrid** - https://sendgrid.com/
2. **Mailgun** - https://www.mailgun.com/
3. **Amazon SES** - https://aws.amazon.com/ses/
4. **Resend** - https://resend.com/
5. **Loops.so** - https://loops.so/

## Setting Up Loops.so (Recommended)

Loops.so is a good option for transactional emails with templates. Here's how to set it up:

1. **Create an account** at [Loops.so](https://loops.so/)
2. **Create a transactional email template**:
   - Go to the Loops.so dashboard
   - Navigate to "Transactional" in the sidebar
   - Click "Create New Template"
   - Name your template "family-invitation" (or any name you prefer)
   - Design your email template with the following variables:
     - `{{invitationLink}}` - The link to accept the invitation
     - `{{familyName}}` - The name of the family group
     - `{{inviterName}}` - The name of the person who sent the invitation
     - `{{role}}` - The role assigned to the invited user
     - `{{expiresAt}}` - The expiration date of the invitation

3. **Get your API key**:
   - Go to Settings > API Keys
   - Create a new API key or copy your existing one

4. **Update your environment variables**:
   - Open your `.env.local` file
   - Update the following variables:
     ```
     LOOPS_API_KEY=your_api_key_here
     LOOPS_INVITATION_TRANSACTIONAL_ID=your_template_id_here
     NEXT_PUBLIC_LOOPS_API_KEY=your_api_key_here
     NEXT_PUBLIC_LOOPS_INVITATION_TRANSACTIONAL_ID=your_template_id_here
     ```

## Alternative: Using SendGrid

If you prefer SendGrid, here's how to set it up:

1. **Create a SendGrid account** at [SendGrid](https://sendgrid.com/)
2. **Create an API key** in the SendGrid dashboard
3. **Install the SendGrid package**:
   ```bash
   npm install @sendgrid/mail
   ```
4. **Update your environment variables**:
   ```
   SENDGRID_API_KEY=your_api_key_here
   ```
5. **Modify the email service implementation**:
   - Open `src/lib/emailService.ts`
   - Replace the current implementation with SendGrid:

   ```typescript
   import { FamilyInvitation } from '@/types/family';
   import sgMail from '@sendgrid/mail';

   // Initialize SendGrid
   sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

   export async function sendFamilyInvitationEmail(
     invitation: FamilyInvitation,
     familyName: string,
     inviterName: string
   ): Promise<boolean> {
     try {
       // Generate the invitation link
       const invitationLink = generateInvitationLink(invitation.id);
       
       // Create email content
       const msg = {
         to: invitation.email,
         from: 'your-verified-sender@example.com', // Must be verified in SendGrid
         subject: `You've been invited to join ${familyName} on Shop-Assist`,
         html: `
           <p>Hello,</p>
           <p>${inviterName} has invited you to join the "${familyName}" family group on Shop-Assist with the role of "${invitation.role}".</p>
           <p>To accept this invitation, please click the link below:</p>
           <p><a href="${invitationLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Accept Invitation</a></p>
           <p>Or copy and paste this URL into your browser: ${invitationLink}</p>
           <p>This invitation will expire on ${new Date(invitation.expires_at).toLocaleDateString()}.</p>
           <p>Thank you,<br>The Shop-Assist Team</p>
         `,
       };
       
       // Send email
       await sgMail.send(msg);
       console.log(`Email sent to ${invitation.email}`);
       return true;
     } catch (error) {
       console.error('Error sending email:', error);
       return false;
     }
   }

   export function generateInvitationLink(invitationId: string): string {
     const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
     return `${baseUrl}/family/invitations/${invitationId}`;
   }
   ```

## Testing Your Email Setup

After setting up your email service, you can test it using the test page at `/test-invitation`. This page allows you to:

1. Select a family group
2. Enter an email address
3. Choose a role
4. Send a test invitation

The page will show you the result of the API call and any errors that occur.

## Troubleshooting

If you're having issues with email sending:

1. **Check your API keys** - Make sure they're correctly set in your environment variables
2. **Check the server logs** - Look for any error messages related to email sending
3. **Test with a valid email** - Make sure you're using a valid email address for testing
4. **Check spam folders** - Sometimes test emails can end up in spam folders

## Production Considerations

For production environments:

1. **Use environment variables** for all sensitive information
2. **Set up email authentication** (SPF, DKIM, DMARC) to improve deliverability
3. **Monitor email delivery rates** using your email service provider's dashboard
4. **Implement email verification** to ensure users provide valid email addresses 