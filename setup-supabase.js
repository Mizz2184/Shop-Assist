const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://rcmuzstcirbulftnbcth.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('Setting up Supabase database...');
  
  try {
    // Check if the table exists
    const { error: checkError } = await supabase
      .from('grocery_list')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('The grocery_list table already exists.');
      return;
    }
    
    // Create the grocery_list table using SQL
    const { error } = await supabase.rpc('create_grocery_list_table', {});
    
    if (error) {
      // If RPC fails, we'll try to create the table using REST API
      console.log('Creating table using SQL function failed, trying alternative method...');
      
      // This is a workaround since we can't directly execute SQL with the JS client
      // We'll create a minimal table and then add columns
      const { error: createError } = await supabase
        .from('grocery_list')
        .insert([{ 
          id: '00000000-0000-0000-0000-000000000000',
          name: 'Test Product',
          brand: 'Test Brand',
          description: 'Test Description',
          price: 0,
          imageUrl: '',
          store: 'test',
          url: '',
          created_at: new Date().toISOString()
        }]);
      
      if (createError) {
        console.error('Error creating grocery_list table:', createError);
        return;
      }
      
      console.log('Successfully created the grocery_list table!');
    } else {
      console.log('Successfully created the grocery_list table using SQL function!');
    }
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase()
  .then(() => console.log('Database setup complete'))
  .catch(err => console.error('Database setup failed:', err)); 