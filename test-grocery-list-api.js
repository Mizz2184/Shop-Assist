const axios = require('axios');

async function testGroceryListApi() {
  console.log('Testing the grocery list API...');
  
  try {
    // Try to connect to the API on different ports
    const ports = [3000, 3001, 3002, 3003, 3004, 3005];
    let getResponse = null;
    
    // First, test the GET endpoint
    console.log('\n1. Testing GET /api/grocery-list endpoint...');
    for (const port of ports) {
      try {
        console.log(`Trying to connect on port ${port}...`);
        getResponse = await axios.get(`http://localhost:${port}/api/grocery-list`);
        
        console.log(`Successfully connected on port ${port}`);
        break;
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`Connection refused on port ${port}`);
        } else {
          // If we got a response but with an error status, still capture it
          getResponse = error.response;
          console.log(`Got response with status ${getResponse?.status} on port ${port}`);
          break;
        }
      }
    }
    
    if (!getResponse) {
      console.error('Could not connect to any port. Make sure the Next.js server is running.');
      return;
    }
    
    console.log(`GET Response status: ${getResponse.status}`);
    
    if (getResponse.status === 200) {
      console.log('✅ Successfully retrieved grocery list!');
      console.log(`Number of items: ${getResponse.data.length}`);
      
      if (getResponse.data.length > 0) {
        console.log('\nSample item:');
        console.log(JSON.stringify(getResponse.data[0], null, 2));
      }
    } else {
      console.log('❌ Failed to retrieve grocery list.');
      console.log('Response data:', JSON.stringify(getResponse.data, null, 2));
    }
    
    // Now, test the POST endpoint
    console.log('\n2. Testing POST /api/grocery-list endpoint...');
    
    const testProduct = {
      name: 'Test Product After Fix',
      brand: 'Test Brand',
      description: 'This is a test product after fixing the schema',
      price: 19.99,
      imageUrl: 'https://example.com/image-fixed.jpg',
      store: 'Test Store',
      url: 'https://example.com/product-fixed'
    };
    
    let postResponse = null;
    
    for (const port of ports) {
      try {
        console.log(`Trying to connect on port ${port}...`);
        postResponse = await axios.post(`http://localhost:${port}/api/grocery-list`, testProduct, {
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
          postResponse = error.response;
          console.log(`Got response with status ${postResponse?.status} on port ${port}`);
          break;
        }
      }
    }
    
    if (!postResponse) {
      console.error('Could not connect to any port for POST request.');
      return;
    }
    
    console.log(`POST Response status: ${postResponse.status}`);
    
    if (postResponse.status === 200) {
      console.log('✅ Successfully added product to grocery list!');
      console.log('Product details:');
      console.log(JSON.stringify(postResponse.data, null, 2));
      
      // Check if imageUrl was saved
      if (postResponse.data.imageUrl) {
        console.log(`\n✅ Image URL was saved correctly: ${postResponse.data.imageUrl}`);
        console.log('The database schema has been fixed successfully!');
      } else if (postResponse.data.imageurl) {
        console.log(`\n⚠️ Image URL was saved with lowercase name: ${postResponse.data.imageurl}`);
        console.log('The column exists but might be using the wrong case (imageurl instead of imageUrl).');
      } else {
        console.log('\n❌ No image URL was saved. The column might still be missing.');
      }
    } else {
      console.log('❌ Failed to add product to grocery list.');
      console.log('Response data:', JSON.stringify(postResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('Error testing grocery list API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testGroceryListApi(); 