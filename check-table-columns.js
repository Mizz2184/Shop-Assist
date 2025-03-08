require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Get Supabase credentials from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key. Please check your .env.local file.');
  process.exit(1);
}

async function checkTableColumns() {
  try {
    console.log('Checking grocery_list table columns...');
    
    // Query to check if the table exists and get its columns
    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'grocery_list'
      ORDER BY ordinal_position;
    `;
    
    // Make the request to Supabase
    const response = await axios.post(
      `${supabaseUrl}/rest/v1/rpc/query`,
      { query },
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
    
    if (response.data && response.data.length > 0) {
      console.log('\nTable exists with the following columns:');
      console.table(response.data);
      
      // Check if imageUrl column exists
      const hasImageUrl = response.data.some(col => col.column_name === 'imageUrl');
      if (hasImageUrl) {
        console.log('\nThe imageUrl column exists!');
      } else {
        console.log('\nThe imageUrl column is missing!');
        console.log('Please run the SQL commands in recreate-grocery-list-table.sql to recreate the table with the correct schema.');
      }
    } else {
      console.log('\nThe grocery_list table does not exist or has no columns.');
      console.log('Please run the SQL commands in recreate-grocery-list-table.sql to create the table.');
    }
    
  } catch (error) {
    console.error('Error checking table columns:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      if (error.response.status === 404) {
        console.log('\nThe query function does not exist. You need to create it first.');
        console.log('Please go to the Supabase dashboard, navigate to the SQL Editor, and run the following SQL:');
        console.log(`
CREATE OR REPLACE FUNCTION query(query text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE query;
END;
$$;
        `);
      }
    }
    
    console.log('\nAlternative approach: Try to insert a record and see what happens...');
    
    try {
      // Try to insert a record with all fields
      const testProduct = {
        id: '00000000-0000-0000-0000-000000000099',
        user_id: '00000000-0000-0000-0000-000000000001',
        name: 'Test Product',
        brand: 'Test Brand',
        description: 'Test Description',
        price: 9.99,
        imageUrl: 'https://example.com/image.jpg',
        store: 'Test Store',
        url: 'https://example.com/product'
      };
      
      const insertResponse = await axios.post(
        `${supabaseUrl}/rest/v1/grocery_list`,
        testProduct,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        }
      );
      
      console.log('Insert response status:', insertResponse.status);
      console.log('Insert response data:', insertResponse.data);
      console.log('\nSuccessfully inserted a record! The table schema appears to be correct.');
      
      // Clean up the test record
      console.log('\nCleaning up test record...');
      await axios.delete(
        `${supabaseUrl}/rest/v1/grocery_list?id=eq.00000000-0000-0000-0000-000000000099`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );
      console.log('Test record deleted.');
      
    } catch (insertError) {
      console.error('Error inserting test record:', insertError.message);
      
      if (insertError.response) {
        console.error('Insert response status:', insertError.response.status);
        console.error('Insert response data:', insertError.response.data);
        
        if (insertError.response.data && insertError.response.data.message) {
          if (insertError.response.data.message.includes('imageUrl')) {
            console.log('\nThe imageUrl column is missing from the grocery_list table.');
          } else if (insertError.response.data.message.includes('user_id')) {
            console.log('\nThe user_id column is missing or has incorrect constraints.');
          }
          
          console.log('\nPlease run the SQL commands in recreate-grocery-list-table.sql to recreate the table with the correct schema.');
        }
      }
    }
  }
}

checkTableColumns()
  .then(() => console.log('\nCheck complete'))
  .catch(err => console.error('Check failed:', err)); 