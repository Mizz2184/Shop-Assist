require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Get Supabase credentials from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key. Please check your .env.local file.');
  process.exit(1);
}

async function addColumn() {
  try {
    console.log('Attempting to add the imageUrl column to the grocery_list table...');
    
    // Try to add the column using the REST API
    // Since we can't execute SQL directly, we'll try to insert a record with the imageUrl field
    // and see if Supabase automatically adds the column
    
    const testProduct = {
      id: '00000000-0000-0000-0000-000000000099',
      name: 'Test Product',
      brand: 'Test Brand',
      description: 'Test Description',
      price: 9.99,
      store: 'Test Store',
      url: 'https://example.com/product',
      imageurl: 'https://example.com/image.jpg' // Note: lowercase 'imageurl' to match Postgres convention
    };
    
    console.log('Inserting test product with imageurl field...');
    
    const response = await axios.post(
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
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    if (response.status === 201 || response.status === 200) {
      console.log('\nSuccessfully inserted the test product!');
      console.log('This suggests that either:');
      console.log('1. The imageurl column was added automatically, or');
      console.log('2. The column already existed but with a different case (e.g., "imageurl" instead of "imageUrl")');
      
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
    }
    
  } catch (error) {
    console.error('Error adding column:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      // If we get a specific error about the column not existing, we need to recreate the table
      if (error.response.data && error.response.data.message && 
          error.response.data.message.includes('column') && 
          error.response.data.message.includes('does not exist')) {
        console.log('\nThe column could not be added automatically.');
        console.log('Please run the SQL commands in recreate-grocery-list-table.sql to recreate the table with the correct schema.');
      }
      // If we get a 400 error with a message about the column not being found in the schema cache
      else if (error.response.status === 400 && 
               error.response.data && 
               error.response.data.message && 
               error.response.data.message.includes('Could not find')) {
        console.log('\nThe column could not be found in the schema cache.');
        console.log('This usually means the column does not exist and Supabase does not allow adding it automatically.');
        console.log('Please run the SQL commands in recreate-grocery-list-table.sql to recreate the table with the correct schema.');
      }
      // If we get a 403 error, we don't have permission
      else if (error.response.status === 403) {
        console.log('\nYou do not have permission to modify the table schema.');
        console.log('Please run the SQL commands in recreate-grocery-list-table.sql manually in the Supabase dashboard.');
      }
    }
  }
}

addColumn()
  .then(() => console.log('\nOperation complete'))
  .catch(err => console.error('Operation failed:', err)); 