require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

async function checkTableStructure() {
  console.log('Checking the structure of the grocery_list table...');
  
  try {
    // First, check if the query function exists
    const sql = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'grocery_list'
      ORDER BY ordinal_position;
    `;
    
    // Try to execute the SQL directly using the REST API
    const response = await axios({
      method: 'POST',
      url: `${supabaseUrl}/rest/v1/rpc/query`,
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      data: {
        query_text: sql
      }
    });
    
    console.log('Table structure:');
    console.log('----------------');
    
    if (response.data && response.data.length > 0) {
      // Format the column information
      const columns = response.data;
      
      // Find the maximum length of column names for formatting
      const maxNameLength = Math.max(...columns.map(col => col.column_name.length));
      const maxTypeLength = Math.max(...columns.map(col => col.data_type.length));
      
      // Print header
      console.log(`${'COLUMN'.padEnd(maxNameLength)} | ${'TYPE'.padEnd(maxTypeLength)} | NULLABLE`);
      console.log('-'.repeat(maxNameLength + maxTypeLength + 13));
      
      // Print each column
      columns.forEach(col => {
        console.log(`${col.column_name.padEnd(maxNameLength)} | ${col.data_type.padEnd(maxTypeLength)} | ${col.is_nullable}`);
      });
      
      // Check for the imageUrl column
      const imageUrlColumn = columns.find(col => col.column_name === 'imageUrl');
      const imageurlColumn = columns.find(col => col.column_name === 'imageurl');
      
      console.log('\nAnalysis:');
      if (imageUrlColumn) {
        console.log('✅ The imageUrl column exists with the correct case.');
      } else if (imageurlColumn) {
        console.log('⚠️ The imageurl column exists but with lowercase (imageurl instead of imageUrl).');
        console.log('This might cause issues with case-sensitive code.');
      } else {
        console.log('❌ No imageUrl column found in the table.');
        console.log('You need to add the imageUrl column to the grocery_list table.');
      }
      
      // Check for user_id column
      const userIdColumn = columns.find(col => col.column_name === 'user_id');
      if (userIdColumn) {
        console.log('✅ The user_id column exists.');
      } else {
        console.log('❌ No user_id column found in the table.');
        console.log('You need to add the user_id column to the grocery_list table.');
      }
      
      // Check for required columns
      const requiredColumns = ['id', 'name', 'price', 'store'];
      const missingColumns = requiredColumns.filter(col => !columns.find(c => c.column_name === col));
      
      if (missingColumns.length === 0) {
        console.log('✅ All required columns exist.');
      } else {
        console.log(`❌ Missing required columns: ${missingColumns.join(', ')}`);
      }
    } else {
      console.log('No columns found or the table does not exist.');
    }
    
  } catch (error) {
    console.error('Error checking table structure:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.error('The query function does not exist. You need to create it in the Supabase dashboard.');
        console.log('\nRun this SQL in the Supabase dashboard:');
        console.log(`
CREATE OR REPLACE FUNCTION query(query_text text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE query_text;
END;
$$;
        `);
      }
    }
    
    console.log('\nAlternatively, you can check the table structure in the Supabase dashboard:');
    console.log('1. Go to https://app.supabase.com and log in');
    console.log('2. Select your project');
    console.log('3. Go to the Table Editor');
    console.log('4. Select the grocery_list table');
  }
}

checkTableStructure(); 