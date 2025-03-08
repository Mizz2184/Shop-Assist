require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Testing insert into grocery_list table...');
  
  try {
    // Create a test product
    const testProduct = {
      id: uuidv4(),
      user_id: '00000000-0000-0000-0000-000000000001',
      name: 'Test Product',
      brand: 'Test Brand',
      description: 'Test Description',
      price: 9.99,
      imageUrl: 'https://example.com/image.jpg',
      store: 'Test Store',
      url: 'https://example.com/product',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Attempting to insert test product:', testProduct);
    
    // Try to insert the product
    const { data, error } = await supabase
      .from('grocery_list')
      .insert([testProduct])
      .select();
    
    if (error) {
      console.error('Error inserting test product:', error);
      
      // Check if the error is related to the imageUrl column
      if (error.message.includes('imageUrl')) {
        console.error('The imageUrl column is missing from the grocery_list table.');
        console.log('\nPlease run the SQL commands in recreate-grocery-list-table.sql to recreate the table with the correct schema.');
        
        // Try to get the current schema
        console.log('\nAttempting to get the current table schema...');
        const { data: tableInfo, error: tableError } = await supabase
          .rpc('get_table_info', { table_name: 'grocery_list' });
        
        if (tableError) {
          console.error('Error getting table info:', tableError);
        } else {
          console.log('Current table schema:', tableInfo);
        }
      }
      return;
    }
    
    console.log('Successfully inserted test product!');
    console.log('Inserted data:', data);
    
    // Clean up the test product
    console.log('\nCleaning up test product...');
    const { error: deleteError } = await supabase
      .from('grocery_list')
      .delete()
      .eq('id', testProduct.id);
    
    if (deleteError) {
      console.error('Error deleting test product:', deleteError);
    } else {
      console.log('Test product deleted successfully.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testInsert()
  .then(() => console.log('\nTest complete'))
  .catch(err => console.error('Test failed:', err)); 