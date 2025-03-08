require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function directInsert() {
  console.log('Attempting to directly insert a test product into the grocery_list table...');
  
  // Create a test product
  const testProduct = {
    id: uuidv4(),
    user_id: '00000000-0000-0000-0000-000000000001', // Test user ID
    name: 'Direct Insert Test Product',
    brand: 'Test Brand',
    description: 'This is a test product inserted directly',
    price: 29.99,
    store: 'Test Store',
    url: 'https://example.com/direct-test',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log('Test product to insert:');
  console.log(JSON.stringify(testProduct, null, 2));
  
  try {
    // First, try with imageUrl
    const productWithImageUrl = {
      ...testProduct,
      imageUrl: 'https://example.com/direct-test-image.jpg'
    };
    
    console.log('\nAttempting insert with imageUrl...');
    const { data: dataWithImageUrl, error: errorWithImageUrl } = await supabase
      .from('grocery_list')
      .insert([productWithImageUrl])
      .select();
    
    if (errorWithImageUrl) {
      console.error('Error inserting with imageUrl:', errorWithImageUrl.message);
      
      // If the error is related to the imageUrl column, try with lowercase imageurl
      console.log('\nAttempting insert with lowercase imageurl...');
      const productWithLowercaseImageUrl = {
        ...testProduct,
        imageurl: 'https://example.com/direct-test-image.jpg'
      };
      
      const { data: dataWithLowercaseImageUrl, error: errorWithLowercaseImageUrl } = await supabase
        .from('grocery_list')
        .insert([productWithLowercaseImageUrl])
        .select();
      
      if (errorWithLowercaseImageUrl) {
        console.error('Error inserting with lowercase imageurl:', errorWithLowercaseImageUrl.message);
        
        // If both attempts fail, try without any image URL
        console.log('\nAttempting insert without any image URL...');
        const { data: dataWithoutImageUrl, error: errorWithoutImageUrl } = await supabase
          .from('grocery_list')
          .insert([testProduct])
          .select();
        
        if (errorWithoutImageUrl) {
          console.error('Error inserting without image URL:', errorWithoutImageUrl.message);
          console.error('All insert attempts failed.');
          
          // Check if the error is related to the user_id column
          if (errorWithoutImageUrl.message.includes('user_id')) {
            console.log('\nThe error might be related to the user_id column.');
            console.log('Attempting insert without user_id...');
            
            const productWithoutUserId = { ...testProduct };
            delete productWithoutUserId.user_id;
            
            const { data: dataWithoutUserId, error: errorWithoutUserId } = await supabase
              .from('grocery_list')
              .insert([productWithoutUserId])
              .select();
            
            if (errorWithoutUserId) {
              console.error('Error inserting without user_id:', errorWithoutUserId.message);
            } else {
              console.log('✅ Successfully inserted product without user_id!');
              console.log('Inserted data:', JSON.stringify(dataWithoutUserId, null, 2));
            }
          }
          
          // Print detailed error information
          console.log('\nDetailed error information:');
          console.log('Error code:', errorWithoutImageUrl.code);
          console.log('Error message:', errorWithoutImageUrl.message);
          console.log('Error details:', errorWithoutImageUrl.details);
          console.log('Error hint:', errorWithoutImageUrl.hint);
        } else {
          console.log('✅ Successfully inserted product without image URL!');
          console.log('Inserted data:', JSON.stringify(dataWithoutImageUrl, null, 2));
        }
      } else {
        console.log('✅ Successfully inserted product with lowercase imageurl!');
        console.log('Inserted data:', JSON.stringify(dataWithLowercaseImageUrl, null, 2));
      }
    } else {
      console.log('✅ Successfully inserted product with imageUrl!');
      console.log('Inserted data:', JSON.stringify(dataWithImageUrl, null, 2));
    }
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

directInsert(); 