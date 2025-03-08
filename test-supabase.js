const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://rcmuzstcirbulftnbcth.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in .env.local');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 10 chars):', supabaseKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Check if grocery_list table exists
    console.log('Checking if grocery_list table exists...');
    const { data, error: checkError } = await supabase
      .from('grocery_list')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('Error: grocery_list table does not exist or is not accessible.');
      console.error('Error details:', checkError.message);
      console.error('Error code:', checkError.code);
      
      if (checkError.code === '42P01') {
        console.log('\nThe table does not exist. You need to create it using the SQL script.');
        console.log('Please go to the Supabase dashboard (https://app.supabase.com) and:');
        console.log('1. Navigate to your project');
        console.log('2. Go to the SQL Editor');
        console.log('3. Copy and paste the contents of create-grocery-list-table.sql');
        console.log('4. Run the SQL script');
      }
    } else {
      console.log('grocery_list table exists and is accessible!');
      console.log('Data:', data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection()
  .then(() => console.log('\nTest complete'))
  .catch(err => console.error('Test failed:', err)); 