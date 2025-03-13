const axios = require('axios');

async function testLoopsEmail() {
  const LOOPS_API_KEY = '07b7cc6bfb096f757e58042f03e3acf5';
  const LOOPS_API_URL = 'https://app.loops.so/api/v1/transactional';
  const TRANSACTIONAL_ID = 'cm86q1iwp000kcgtzlhrfgl8n';

  try {
    console.log('Testing Loops.so email service...');
    
    const response = await axios.post(
      LOOPS_API_URL,
      {
        transactionalId: TRANSACTIONAL_ID,
        email: 'test@example.com',
        dataVariables: {
          inviteName: 'Test User',
          familyName: 'Test Family',
          invitationLink: 'https://shop-assist.vercel.app/family/invitations/test-id',
          role: 'editor',
          expiresAt: new Date(Date.now() + 7*24*60*60*1000).toISOString()
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${LOOPS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Email sent successfully!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error sending email:', error.response ? error.response.data : error.message);
  }
}

testLoopsEmail(); 