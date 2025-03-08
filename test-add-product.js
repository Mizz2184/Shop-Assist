const axios = require('axios');

async function testAddProduct() {
  console.log('Testing adding a product to the grocery list...');
  
  const testProduct = {
    name: 'Test Product',
    brand: 'Test Brand',
    description: 'This is a test product',
    price: 9.99,
    imageUrl: 'https://example.com/image.jpg',
    store: 'Test Store',
    url: 'https://example.com/product'
  };
  
  try {
    // Try to connect to the API on different ports
    const ports = [3000, 3001, 3002, 3003, 3004, 3005];
    let response = null;
    
    for (const port of ports) {
      try {
        console.log(`Trying to connect on port ${port}...`);
        response = await axios.post(`http://localhost:${port}/api/grocery-list`, testProduct, {
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
      return;
    }
    
    console.log(`Response status: ${response.status}`);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Successfully added product to grocery list!');
      console.log('Product details:');
      console.log(`- ID: ${response.data.id}`);
      console.log(`- Name: ${response.data.name}`);
      console.log(`- Brand: ${response.data.brand}`);
      console.log(`- Price: ${response.data.price}`);
      console.log(`- Store: ${response.data.store}`);
      
      // Check if imageUrl was saved
      if (response.data.imageUrl) {
        console.log(`- Image URL: ${response.data.imageUrl}`);
      } else if (response.data.imageurl) {
        console.log(`- Image URL (lowercase): ${response.data.imageurl}`);
      } else {
        console.log('⚠️ Note: No image URL was saved. The column might be missing.');
      }
    } else {
      console.log('❌ Failed to add product to grocery list.');
    }
  } catch (error) {
    console.error('Error testing add product:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAddProduct(); 