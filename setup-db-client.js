const axios = require('axios');

async function setupDatabase() {
  try {
    console.log('Accessing the setup-db API endpoint...');
    
    // Determine the port from the console output (3000, 3001, 3002, etc.)
    // Try a few common ports
    const ports = [3000, 3001, 3002, 3003, 3004, 3005];
    let response = null;
    let error = null;
    
    for (const port of ports) {
      try {
        console.log(`Trying port ${port}...`);
        response = await axios.get(`http://localhost:${port}/api/setup-db`, {
          timeout: 5000 // 5 seconds timeout
        });
        
        if (response.status === 200) {
          console.log(`Successfully connected on port ${port}`);
          break;
        }
      } catch (err) {
        if (err.code === 'ECONNREFUSED') {
          console.log(`No server running on port ${port}`);
        } else {
          error = err;
          console.log(`Error on port ${port}:`, err.message);
          
          // If we got a response but with an error status, we still found the server
          if (err.response) {
            response = err.response;
            break;
          }
        }
      }
    }
    
    if (!response) {
      console.error('Could not connect to any server port.');
      if (error) {
        console.error('Last error:', error.message);
      }
      return;
    }
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('Database setup was successful!');
    } else {
      console.error('Database setup failed.');
      
      if (response.data.instructions) {
        console.log('\nFollow these instructions to set up the database manually:');
        response.data.instructions.forEach(instruction => console.log(instruction));
      }
    }
  } catch (error) {
    console.error('Error setting up database:', error.message);
  }
}

setupDatabase(); 