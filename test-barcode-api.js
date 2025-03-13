const axios = require('axios');

async function testBarcodeAPI() {
  try {
    console.log('Testing barcode API with Bimbo Cero Cero Blanco EAN...');
    
    // Use the EAN we found for Bimbo Cero Cero Blanco
    const ean = '7441029522686';
    console.log(`Testing EAN: ${ean}`);
    
    // Make the API request to our local barcode API
    console.log('Making API request to local barcode API...');
    const response = await axios.get(`http://localhost:3000/api/products/barcode/${ean}`);
    
    console.log('API response received');
    console.log('Response status:', response.status);
    
    // Process the response
    if (response.data) {
      console.log('\n=== Product Details ===');
      console.log('Product Name:', response.data.name);
      console.log('Brand:', response.data.brand);
      console.log('Price:', response.data.price);
      console.log('EAN:', response.data.ean);
      console.log('Store:', response.data.store);
      console.log('Image URL:', response.data.imageUrl);
    } else {
      console.log('No product found for this EAN');
    }
  } catch (error) {
    console.error('Error testing barcode API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testBarcodeAPI(); 