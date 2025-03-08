require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const fs = require('fs');

// Get Supabase credentials from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key. Please check your .env.local file.');
  process.exit(1);
}

async function directSql() {
  try {
    console.log('Reading SQL file...');
    const sqlCommands = fs.readFileSync('recreate-grocery-list-table.sql', 'utf8');
    console.log('SQL commands to execute:');
    console.log(sqlCommands);
    
    // First, let's try to create a simple table to test permissions
    console.log('\nTesting permissions with a simple query...');
    
    const testQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'grocery_list'
      );
    `;
    
    const testResponse = await axios.post(
      `${supabaseUrl}/rest/v1/rpc/execute_sql`,
      { sql: testQuery },
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    
    console.log('Test query response:', testResponse.data);
    
    // Now try to execute the full SQL commands
    console.log('\nExecuting SQL commands...');
    
    const response = await axios.post(
      `${supabaseUrl}/rest/v1/rpc/execute_sql`,
      { sql: sqlCommands },
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    console.log('\nSQL commands executed successfully!');
    
  } catch (error) {
    console.error('Error executing SQL commands:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      if (error.response.status === 404) {
        console.log('\nThe execute_sql function does not exist. You need to create it first.');
        console.log('Please go to the Supabase dashboard, navigate to the SQL Editor, and run the following SQL:');
        console.log(`
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
        `);
      } else if (error.response.status === 403) {
        console.log('\nYou do not have permission to execute SQL commands directly.');
        console.log('Please go to the Supabase dashboard and execute the SQL commands manually.');
        console.log('SQL commands to execute:');
        console.log(fs.readFileSync('recreate-grocery-list-table.sql', 'utf8'));
      }
    }
  }
}

directSql()
  .then(() => console.log('\nOperation complete'))
  .catch(err => console.error('Operation failed:', err)); 