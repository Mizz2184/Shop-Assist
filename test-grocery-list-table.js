const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://rcmuzstcirbulftnbcth.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGroceryListTable() {
  try {
    console.log('Testing the grocery_list table...');
    
    // Create a test product with all required fields
    const testProduct = {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Test Product',
      brand: 'Test Brand',
      description: 'Test Description',
      price: 9.99,
      imageUrl: 'https://example.com/image.jpg',
      store: 'Test Store',
      url: 'https://example.com/product'
    };
    
    console.log('Inserting test product...');
    const { data: insertData, error: insertError } = await supabase
      .from('grocery_list')
      .insert([testProduct])
      .select();
    
    if (insertError) {
      console.error('Error inserting test product:', insertError.message);
      
      if (insertError.message.includes("Could not find the 'imageUrl' column") || 
          insertError.code === 'PGRST204') {
        console.log('\nThe table schema is still incorrect. Please run the SQL in recreate-grocery-list-table.sql in the Supabase dashboard.');
      }
      
      return;
    }
    
    console.log('Test product inserted successfully!');
    console.log('Inserted data:', insertData);
    
    // Fetch the test product to verify it was inserted correctly
    console.log('\nFetching the test product...');
    const { data: fetchData, error: fetchError } = await supabase
      .from('grocery_list')
      .select('*')
      .eq('id', testProduct.id);
    
    if (fetchError) {
      console.error('Error fetching test product:', fetchError.message);
      return;
    }
    
    console.log('Test product fetched successfully!');
    console.log('Fetched data:', fetchData);
    
    // Clean up the test product
    console.log('\nCleaning up test product...');
    const { error: deleteError } = await supabase
      .from('grocery_list')
      .delete()
      .eq('id', testProduct.id);
    
    if (deleteError) {
      console.error('Error deleting test product:', deleteError.message);
      return;
    }
    
    console.log('Test product deleted successfully!');
    console.log('\nThe grocery_list table is working correctly!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testGroceryListTable()
  .then(() => console.log('\nTest complete'))
  .catch(err => console.error('Test failed:', err)); 