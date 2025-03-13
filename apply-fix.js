const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  console.log('Reading SQL file...');
  
  let sqlCommands;
  try {
    sqlCommands = fs.readFileSync(path.join(__dirname, 'fix-grocery-list.sql'), 'utf8');
  } catch (error) {
    console.error('Error reading SQL file:', error);
    process.exit(1);
  }
  
  console.log('SQL commands to execute:');
  console.log(sqlCommands);
  
  console.log('\nTo apply this fix:');
  console.log('1. Go to the Supabase dashboard (https://app.supabase.com)');
  console.log('2. Select your project');
  console.log('3. Go to the SQL Editor');
  console.log('4. Copy and paste the SQL commands above');
  console.log('5. Run the SQL script');
  
  // Attempt to execute the SQL directly if using the service role key
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      console.log('\nAttempting to execute SQL directly...');
      
      // Try using rpc if available
      const { error } = await supabase.rpc('exec_sql', { sql_query: sqlCommands });
      
      if (error) {
        console.error('Error executing SQL commands:', error);
        console.log('\nPlease follow the manual steps above to apply the fix.');
      } else {
        console.log('SQL commands executed successfully!');
        console.log('The grocery_list table has been fixed.');
      }
    } catch (error) {
      console.error('Error executing SQL:', error);
      console.log('\nPlease follow the manual steps above to apply the fix.');
    }
  } else {
    console.log('\nNote: To execute this script automatically, you need to add the SUPABASE_SERVICE_ROLE_KEY to your .env.local file.');
  }
}

applyFix(); 