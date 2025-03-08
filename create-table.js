const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://rcmuzstcirbulftnbcth.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  try {
    console.log('Attempting to create the grocery_list table...');
    
    // Using the REST API to create a table with a minimal structure
    // We'll insert a dummy record which will create the table with the necessary columns
    const { data, error } = await supabase
      .from('grocery_list')
      .insert([
        {
          id: '00000000-0000-0000-0000-000000000000',
          name: 'Test Product',
          brand: 'Test Brand',
          description: 'Test Description',
          price: 9.99,
          imageUrl: 'https://example.com/image.jpg',
          store: 'Test Store',
          url: 'https://example.com/product',
          created_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating table:', error.message);
      
      if (error.code === '42P01') {
        console.log('\nAttempting alternative approach...');
        
        // Try using RPC to create the table
        // Note: This requires a stored procedure to be set up in Supabase
        console.log('This approach requires admin access to Supabase.');
        console.log('Please follow these steps:');
        console.log('1. Go to https://app.supabase.com and log in');
        console.log('2. Select your project');
        console.log('3. Go to the SQL Editor');
        console.log('4. Copy and paste the contents of create-grocery-list-table.sql');
        console.log('5. Run the SQL script');
      }
    } else {
      console.log('Successfully created the grocery_list table!');
      console.log('Inserted data:', data);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTable()
  .then(() => console.log('\nOperation complete'))
  .catch(err => console.error('Operation failed:', err)); 