const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://rcmuzstcirbulftnbcth.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateTableSchema() {
  try {
    console.log('Checking the grocery_list table structure...');
    
    // First, let's check if the table exists
    const { error: checkError } = await supabase
      .from('grocery_list')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('Error: The grocery_list table does not exist or is not accessible.');
      console.error('Error details:', checkError.message);
      console.log('\nPlease run the SQL script to create the table first.');
      return;
    }
    
    console.log('The grocery_list table exists. Checking for missing columns...');
    
    // We'll use a REST API call to get the table information
    // Since we can't directly query the schema with the JS client,
    // we'll try to insert a record with all required columns to see what's missing
    
    const testProduct = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Test Product',
      brand: 'Test Brand',
      description: 'Test Description',
      price: 9.99,
      imageUrl: 'https://example.com/image.jpg',
      store: 'Test Store',
      url: 'https://example.com/product',
      created_at: new Date().toISOString()
    };
    
    const { error: insertError } = await supabase
      .from('grocery_list')
      .insert([testProduct]);
    
    if (!insertError) {
      console.log('Successfully inserted a test record with all required columns.');
      console.log('The table schema appears to be correct.');
      
      // Clean up the test record
      const { error: deleteError } = await supabase
        .from('grocery_list')
        .delete()
        .eq('id', testProduct.id);
      
      if (deleteError) {
        console.warn('Warning: Could not delete the test record:', deleteError.message);
      } else {
        console.log('Test record deleted successfully.');
      }
      
      return;
    }
    
    // If we get here, there was an error with the insert
    console.error('Error inserting test record:', insertError.message);
    
    if (insertError.message.includes("Could not find the 'imageUrl' column")) {
      console.log('\nThe imageUrl column is missing. You need to update the table schema.');
      console.log('Please run the following SQL in the Supabase dashboard:');
      console.log(`
ALTER TABLE public.grocery_list 
ADD COLUMN IF NOT EXISTS imageUrl TEXT;
      `);
    } else if (insertError.code === 'PGRST204') {
      // Extract the missing column name from the error message
      const missingColumnMatch = insertError.message.match(/Could not find the '(.+)' column/);
      if (missingColumnMatch && missingColumnMatch[1]) {
        const missingColumn = missingColumnMatch[1];
        console.log(`\nThe ${missingColumn} column is missing. You need to update the table schema.`);
        console.log('Please run the following SQL in the Supabase dashboard:');
        console.log(`
ALTER TABLE public.grocery_list 
ADD COLUMN IF NOT EXISTS ${missingColumn} ${getColumnType(missingColumn)};
        `);
      }
    } else {
      console.log('\nThere appears to be an issue with the table schema.');
      console.log('Please run the following SQL in the Supabase dashboard to recreate the table:');
      console.log(`
DROP TABLE IF EXISTS public.grocery_list;

CREATE TABLE public.grocery_list (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  price NUMERIC NOT NULL,
  imageUrl TEXT,
  store TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.grocery_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for now" 
  ON public.grocery_list 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

GRANT ALL ON public.grocery_list TO anon;
GRANT ALL ON public.grocery_list TO authenticated;
GRANT ALL ON public.grocery_list TO service_role;
      `);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Helper function to determine the column type based on the column name
function getColumnType(columnName) {
  switch (columnName) {
    case 'id':
      return 'UUID';
    case 'name':
    case 'brand':
    case 'description':
    case 'imageUrl':
    case 'store':
    case 'url':
      return 'TEXT';
    case 'price':
      return 'NUMERIC';
    case 'created_at':
      return 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()';
    default:
      return 'TEXT';
  }
}

updateTableSchema()
  .then(() => console.log('\nOperation complete'))
  .catch(err => console.error('Operation failed:', err)); 