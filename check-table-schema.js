require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchema() {
  console.log('Checking grocery_list table schema...');
  
  try {
    // Check if the table exists by querying its schema
    const { data, error } = await supabase
      .from('grocery_list')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.error('Error: The grocery_list table does not exist.');
        console.log('Please run the SQL commands in recreate-grocery-list-table.sql to create the table.');
        return;
      }
      throw error;
    }
    
    console.log('The grocery_list table exists.');
    
    // Get the table schema
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'grocery_list' });
    
    if (columnsError) {
      console.error('Error getting table schema:', columnsError);
      console.log('You may need to create a custom function to get table columns. Trying alternative method...');
      
      // Try to insert a test record to check if all columns exist
      const testProduct = {
        name: 'Test Product',
        brand: 'Test Brand',
        description: 'Test Description',
        price: 9.99,
        imageUrl: 'https://example.com/image.jpg',
        store: 'Test Store',
        url: 'https://example.com/product'
      };
      
      const { error: insertError } = await supabase
        .from('grocery_list')
        .insert(testProduct)
        .select();
      
      if (insertError) {
        console.error('Error inserting test product:', insertError);
        if (insertError.message.includes('imageUrl')) {
          console.error('The imageUrl column is missing from the grocery_list table.');
          console.log('Please run the SQL commands in recreate-grocery-list-table.sql to recreate the table with the correct schema.');
        } else {
          console.log('There may be issues with the table schema. Please check the error message above.');
        }
        return;
      }
      
      console.log('Successfully inserted a test product. The table schema appears to be correct.');
      console.log('Test product has been added to your grocery list.');
      return;
    }
    
    // Check if all required columns exist
    const requiredColumns = ['id', 'name', 'brand', 'description', 'price', 'imageUrl', 'store', 'url', 'created_at'];
    const missingColumns = requiredColumns.filter(col => 
      !columns.some(c => c.column_name === col)
    );
    
    if (missingColumns.length > 0) {
      console.error(`Missing columns in grocery_list table: ${missingColumns.join(', ')}`);
      console.log('Please run the SQL commands in recreate-grocery-list-table.sql to recreate the table with the correct schema.');
      return;
    }
    
    console.log('The grocery_list table has all the required columns.');
    console.log('Table schema is correct!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkTableSchema(); 