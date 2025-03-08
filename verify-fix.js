require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFix() {
  console.log('Verifying that the database schema has been fixed...');
  console.log('Running a series of tests to check if the issues have been resolved.\n');
  
  // Test 1: Check table structure
  console.log('Test 1: Checking table structure...');
  try {
    const sql = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'grocery_list'
      ORDER BY ordinal_position;
    `;
    
    // Try to execute the SQL using the query function
    const { data: columns, error } = await supabase.rpc('query', { query_text: sql });
    
    if (error) {
      console.error('Error checking table structure:', error.message);
      console.log('❌ Test 1 failed: Could not query table structure.');
      
      if (error.message.includes('query') && error.code === '42883') {
        console.log('The query function does not exist. Please run Step 1 from the fix instructions.');
      }
    } else {
      console.log('Table structure:');
      console.log('----------------');
      
      if (columns && columns.length > 0) {
        // Find the maximum length of column names for formatting
        const maxNameLength = Math.max(...columns.map(col => col.column_name.length));
        const maxTypeLength = Math.max(...columns.map(col => col.data_type.length));
        
        // Print header
        console.log(`${'COLUMN'.padEnd(maxNameLength)} | ${'TYPE'.padEnd(maxTypeLength)} | NULLABLE`);
        console.log('-'.repeat(maxNameLength + maxTypeLength + 13));
        
        // Print each column
        columns.forEach(col => {
          console.log(`${col.column_name.padEnd(maxNameLength)} | ${col.data_type.padEnd(maxTypeLength)} | ${col.is_nullable}`);
        });
        
        // Check for the imageUrl column
        const imageUrlColumn = columns.find(col => col.column_name === 'imageUrl');
        
        if (imageUrlColumn) {
          console.log('\n✅ Test 1 passed: The imageUrl column exists with the correct case.');
        } else {
          console.log('\n❌ Test 1 failed: The imageUrl column is still missing.');
          console.log('Please run Step 2 from the fix instructions.');
        }
      } else {
        console.log('No columns found or the table does not exist.');
        console.log('❌ Test 1 failed: The grocery_list table might not exist.');
        console.log('Please run Step 3 from the fix instructions to recreate the table.');
      }
    }
  } catch (error) {
    console.error('Unexpected error in Test 1:', error.message);
    console.log('❌ Test 1 failed due to an unexpected error.');
  }
  
  // Test 2: Insert a test product
  console.log('\nTest 2: Inserting a test product...');
  try {
    // Create a test product
    const testProduct = {
      id: uuidv4(),
      user_id: '00000000-0000-0000-0000-000000000001', // Test user ID
      name: 'Verification Test Product',
      brand: 'Test Brand',
      description: 'This is a test product for verification',
      price: 39.99,
      imageUrl: 'https://example.com/verification-test-image.jpg',
      store: 'Test Store',
      url: 'https://example.com/verification-test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('grocery_list')
      .insert([testProduct])
      .select();
    
    if (error) {
      console.error('Error inserting test product:', error.message);
      console.log('❌ Test 2 failed: Could not insert a test product.');
      
      if (error.message.includes('violates row-level security policy')) {
        console.log('The row-level security policy is still preventing inserts.');
        console.log('Please run Step 2 from the fix instructions to fix the RLS policy.');
      }
    } else {
      console.log('Successfully inserted test product:');
      console.log(JSON.stringify(data[0], null, 2));
      
      // Check if imageUrl was saved
      if (data[0].imageUrl) {
        console.log('\n✅ Test 2 passed: The product was inserted with the imageUrl field.');
      } else {
        console.log('\n❌ Test 2 failed: The product was inserted but the imageUrl field is missing.');
        console.log('Please run Step 2 from the fix instructions to add the imageUrl column.');
      }
    }
  } catch (error) {
    console.error('Unexpected error in Test 2:', error.message);
    console.log('❌ Test 2 failed due to an unexpected error.');
  }
  
  // Test 3: Test the API
  console.log('\nTest 3: Testing the API...');
  try {
    // Try to connect to the API on different ports
    const ports = [3000, 3001, 3002, 3003, 3004, 3005];
    let response = null;
    
    for (const port of ports) {
      try {
        console.log(`Trying to connect on port ${port}...`);
        response = await axios.post(`http://localhost:${port}/api/grocery-list`, {
          name: 'API Test Product',
          brand: 'API Test Brand',
          description: 'This is a test product from the API',
          price: 49.99,
          imageUrl: 'https://example.com/api-test-image.jpg',
          store: 'API Test Store',
          url: 'https://example.com/api-test'
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Successfully connected on port ${port}`);
        break;
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`Connection refused on port ${port}`);
        } else {
          // If we got a response but with an error status, still capture it
          response = error.response;
          console.log(`Got response with status ${response?.status} on port ${port}`);
          break;
        }
      }
    }
    
    if (!response) {
      console.error('Could not connect to any port. Make sure the Next.js server is running.');
      console.log('❌ Test 3 failed: Could not connect to the API.');
      return;
    }
    
    console.log(`Response status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('API response data:', JSON.stringify(response.data, null, 2));
      
      // Check if imageUrl was saved
      if (response.data.imageUrl) {
        console.log('\n✅ Test 3 passed: The API successfully added a product with the imageUrl field.');
      } else {
        console.log('\n❌ Test 3 failed: The API added a product but the imageUrl field is missing.');
      }
    } else {
      console.log('API response data:', JSON.stringify(response.data, null, 2));
      console.log('\n❌ Test 3 failed: The API returned an error.');
    }
  } catch (error) {
    console.error('Unexpected error in Test 3:', error.message);
    console.log('❌ Test 3 failed due to an unexpected error.');
  }
  
  // Summary
  console.log('\n=== Verification Summary ===');
  console.log('If all tests passed, the database schema has been fixed correctly!');
  console.log('If any tests failed, please follow the instructions to fix the remaining issues.');
}

verifyFix(); 