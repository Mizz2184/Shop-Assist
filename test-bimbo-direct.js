const axios = require('axios');

async function testBimboDirectSearch() {
  try {
    console.log('Testing direct catalog API for Bimbo Cero Cero Blanco 550g...');
    
    // Use a more specific query
    const query = 'Bimbo Cero Cero Blanco';
    console.log(`Search query: ${query}`);
    
    // Use the direct catalog API instead of the GraphQL API
    const searchUrl = `https://www.maxipali.co.cr/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?map=ft&_from=0&_to=20`;
    
    // Add headers to mimic a browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'es-CR,es;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://www.maxipali.co.cr/buscar?q=' + encodeURIComponent(query),
      'Origin': 'https://www.maxipali.co.cr',
      'Connection': 'keep-alive'
    };
    
    console.log('Making API request to MaxiPali catalog API...');
    
    // Make the API request
    const response = await axios.get(searchUrl, { 
      headers,
      timeout: 30000 // 30 seconds timeout
    });
    
    console.log('MaxiPali API response received');
    console.log('Response status:', response.status);
    
    // Process the response
    if (response.data && Array.isArray(response.data)) {
      const products = response.data;
      console.log(`Found ${products.length} products from MaxiPali`);
      
      if (products.length === 0) {
        console.log('No products found matching "Bimbo Cero Cero Blanco"');
        return;
      }
      
      // Analyze each product for EAN codes
      console.log('\n=== Product Details ===');
      
      products.forEach((product, index) => {
        console.log(`\nProduct ${index + 1}: ${product.productName}`);
        console.log('Brand:', product.brand || 'Not specified');
        
        // Check for EAN in items
        if (product.items && product.items.length > 0) {
          const item = product.items[0];
          console.log('EAN:', item.ean || 'Not found');
          console.log('Reference ID:', item.referenceId?.[0]?.Value || 'Not found');
          
          // Check if this is the product we're looking for
          if (product.productName.toLowerCase().includes('cero cero blanco') && 
              product.productName.toLowerCase().includes('550')) {
            console.log('\n*** FOUND TARGET PRODUCT ***');
            console.log(`Product: ${product.productName}`);
            console.log('EAN:', item.ean || 'Not found');
            console.log('Full product details:');
            console.log(JSON.stringify(product, null, 2));
          }
        }
      });
      
    } else {
      console.log('No valid response from the API');
    }
  } catch (error) {
    console.error('Error testing MaxiPali API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testBimboDirectSearch(); 