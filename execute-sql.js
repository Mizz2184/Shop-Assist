require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or service role key. Please check your .env.local file.');
  console.error('Note: This script requires the SUPABASE_SERVICE_ROLE_KEY, not the anon key.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql() {
  console.log('Reading SQL file...');
  
  let sqlCommands;
  try {
    sqlCommands = fs.readFileSync(path.join(__dirname, 'recreate-grocery-list-table.sql'), 'utf8');
  } catch (error) {
    console.error('Error reading SQL file:', error);
    process.exit(1);
  }
  
  console.log('Executing SQL commands...');
  console.log('SQL commands to execute:');
  console.log(sqlCommands);
  
  try {
    // Execute the SQL commands
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlCommands });
    
    if (error) {
      console.error('Error executing SQL commands:', error);
      console.log('\nIf the exec_sql function is not available, you need to create it first.');
      console.log('Please go to the Supabase dashboard, navigate to the SQL Editor, and run the following SQL:');
      console.log(`
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;
      `);
      console.log('\nAfter creating the function, run this script again.');
      return;
    }
    
    console.log('SQL commands executed successfully!');
    console.log('The grocery_list table has been recreated with the correct schema.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

executeSql(); 