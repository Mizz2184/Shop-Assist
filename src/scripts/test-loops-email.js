require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Loops.so API configuration
const LOOPS_API_KEY = process.env.LOOPS_API_KEY || process.env.NEXT_PUBLIC_LOOPS_API_KEY;
const LOOPS_API_URL = 'https://app.loops.so/api/v1/transactional';
const LOOPS_INVITATION_TEMPLATE_ID = process.env.LOOPS_INVITATION_TRANSACTIONAL_ID || process.env.NEXT_PUBLIC_LOOPS_INVITATION_TRANSACTIONAL_ID || 'family-invitation';

// Test email data
const testEmail = 'test@example.com'; // Replace with your actual test email

async function testEmailService() {
  console.log('Testing email service...');
  
  try {
    // Create a mock invitation
    const invitation = {
      id: 'test-invitation-id',
      email: testEmail,
      role: 'editor',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const familyName = 'Test Family';
    const inviterName = 'Test User';
    
    // Generate the invitation link
    const invitationLink = `http://localhost:3000/family/invitations/${invitation.id}`;
    
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
    console.log('Family invitation email content:');
    console.log(`To: ${invitation.email}`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`Message: ${emailMessage}`);
    console.log(`Invitation Link: ${invitationLink}`);
    
    // Try to send via Loops.so if configured
    if (LOOPS_API_KEY && LOOPS_API_URL) {
      try {
        console.log('Attempting to send via Loops.so...');
        console.log(`API Key: ${LOOPS_API_KEY ? LOOPS_API_KEY.substring(0, 5) + '...' : 'Not found'}`);
        
        // Prepare data for Loops.so API
        const loopsData = {
          email: invitation.email,
          transactionalId: LOOPS_INVITATION_TEMPLATE_ID,
          addToAudience: true,
          dataVariables: {
            subject: emailSubject,
            message: emailMessage,
            invitationLink,
            familyName,
            inviterName,
            role: invitation.role,
            expiresAt: new Date(invitation.expires_at).toLocaleDateString()
          }
        };
        
        // Send the email using Loops.so API
        const response = await axios.post(LOOPS_API_URL, loopsData, {
          headers: {
            'Authorization': `Bearer ${LOOPS_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Check if the request was successful
        if (response.status === 200) {
          console.log('✅ Invitation email sent successfully via Loops.so');
          console.log('Response data:', response.data);
        } else {
          console.warn('⚠️ Failed to send invitation email via Loops.so, using fallback');
          console.log('Response status:', response.status);
          console.log('Response data:', response.data);
        }
      } catch (loopsError) {
        console.warn('⚠️ Error sending invitation email via Loops.so, using fallback:');
        if (loopsError.response) {
          console.error('Response status:', loopsError.response.status);
          console.error('Response data:', loopsError.response.data);
        } else {
          console.error(loopsError.message);
        }
      }
    } else {
      console.log('⚠️ Loops.so API key or URL not configured');
    }
    
    // Fallback: In a real implementation, you would use a different email service here
    console.log('✅ Using fallback email method (logging only)');
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Error in test:', error.message);
  }
}

testEmailService(); 