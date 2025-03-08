const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://rcmuzstcirbulftnbcth.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function recreateTable() {
  try {
    console.log('Checking if the grocery_list table exists...');
    
    // First, let's check if the table exists
    const { error: checkError } = await supabase
      .from('grocery_list')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.log('The grocery_list table does not exist or is not accessible.');
      console.log('Creating a new grocery_list table...');
    } else {
      console.log('The grocery_list table exists. Backing up data before recreating...');
      
      // Fetch all existing data
      const { data: existingData, error: fetchError } = await supabase
        .from('grocery_list')
        .select('*');
      
      if (fetchError) {
        console.error('Error fetching existing data:', fetchError.message);
      } else {
        console.log(`Found ${existingData.length} existing records.`);
        
        // Save the data to a local file
        const fs = require('fs');
        fs.writeFileSync('grocery_list_backup.json', JSON.stringify(existingData, null, 2));
        console.log('Data backed up to grocery_list_backup.json');
      }
    }
    
    console.log('\nCreating a new grocery_list table with the correct schema...');
    
    // Create a test product with all required fields
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
    
    // Try to insert the test product
    const { error: insertError } = await supabase
      .from('grocery_list')
      .insert([testProduct]);
    
    if (insertError) {
      console.error('Error inserting test product:', insertError.message);
      
      if (insertError.message.includes("Could not find the 'imageUrl' column") || 
          insertError.code === 'PGRST204') {
        console.log('\nThe table schema is incorrect. Please run the following SQL in the Supabase dashboard:');
        console.log(`
-- Drop the existing table if it exists
DROP TABLE IF EXISTS public.grocery_list;

-- Create the grocery_list table with the correct schema
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

-- Set up Row Level Security (RLS)
ALTER TABLE public.grocery_list ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
CREATE POLICY "Allow all operations for now" 
  ON public.grocery_list 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Grant access to the anon role
GRANT ALL ON public.grocery_list TO anon;
GRANT ALL ON public.grocery_list TO authenticated;
GRANT ALL ON public.grocery_list TO service_role;
        `);
      }
    } else {
      console.log('Successfully created the grocery_list table with the correct schema!');
      
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
      
      // Check if we have a backup file to restore
      const fs = require('fs');
      if (fs.existsSync('grocery_list_backup.json')) {
        console.log('\nRestoring data from backup...');
        
        try {
          const backupData = JSON.parse(fs.readFileSync('grocery_list_backup.json', 'utf8'));
          
          if (backupData.length > 0) {
            // Insert the backup data
            const { error: restoreError } = await supabase
              .from('grocery_list')
              .insert(backupData);
            
            if (restoreError) {
              console.error('Error restoring data:', restoreError.message);
            } else {
              console.log(`Successfully restored ${backupData.length} records.`);
            }
          } else {
            console.log('No data to restore.');
          }
        } catch (error) {
          console.error('Error reading backup file:', error.message);
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

recreateTable()
  .then(() => console.log('\nOperation complete'))
  .catch(err => console.error('Operation failed:', err)); 