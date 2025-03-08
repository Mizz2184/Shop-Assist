const axios = require('axios');

async function fixDatabase() {
  console.log('Accessing the admin API endpoint to fix the database...');
  
  try {
    // Try different ports in case the dev server is running on a different port
    const ports = [3000, 3001, 3002, 3003, 3004, 3005];
    let connected = false;
    
    for (const port of ports) {
      try {
        console.log(`Trying to connect on port ${port}...`);
        const response = await axios.get(`http://localhost:${port}/api/admin/recreate-table`);
        
        console.log(`Connected on port ${port}`);
        console.log(`Response status: ${response.status}`);
        
        // Extract the SQL commands from the HTML response
        const htmlResponse = response.data;
        const sqlMatch = htmlResponse.match(/<pre>([\s\S]*?)<\/pre>/);
        
        if (sqlMatch && sqlMatch[1]) {
          console.log('\nSQL commands to execute in Supabase dashboard:');
          console.log(sqlMatch[1]);
          console.log('\nPlease copy these SQL commands and execute them in the Supabase dashboard SQL editor.');
          console.log('After executing the SQL, run the check-table-schema.js script to verify the table has been fixed.');
        } else {
          console.log('Could not extract SQL commands from the response.');
        }
        
        connected = true;
        break;
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`Connection refused on port ${port}`);
        } else {
          throw error;
        }
      }
    }
    
    if (!connected) {
      console.error('Could not connect to the development server on any port.');
      console.log('Please make sure the development server is running (npm run dev).');
    }
    
  } catch (error) {
    console.error('Error accessing the admin API endpoint:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

fixDatabase(); 