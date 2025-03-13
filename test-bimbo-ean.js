const axios = require('axios');

async function testBimboEANExtraction() {
  try {
    console.log('Testing MaxiPali API for Bimbo Cero Cero Blanco 550g EAN extraction...');
    
    // Use the specific product name
    const query = 'Bimbo Cero Cero Blanco 550g';
    console.log(`Search query: ${query}`);
    
    // Prepare the API parameters
    const params = {
      'workspace': 'master',
      'maxAge': 'short',
      'appsEtag': 'remove',
      'domain': 'store',
      'locale': 'es-CR',
      '__bindingId': 'c0655441-0e36-4c40-a5b2-167f32bcfd18',
      'operationName': 'productSearchV3',
      'variables': '{}',
      'extensions': `{"persistedQuery":{"version":1,"sha256Hash":"9177ba6f883473505dc99fcf2b679a6e270af6320a157f0798b92efeab98d5d3","sender":"vtex.store-resources@0.x","provider":"vtex.search-graphql@0.x"},"variables":"eyJoaWRlVW5hdmFpbGFibGVJdGVtcyI6ZmFsc2UsInNrdXNGaWx0ZXIiOiJBTEwiLCJzaW11bGF0aW9uQmVoYXZpb3IiOiJkZWZhdWx0IiwiaW5zdGFsbG1lbnRDcml0ZXJpYSI6Ik1BWF9XSVRIT1VUX0lOVEVSRVNUIiwicHJvZHVjdE9yaWdpblZ0ZXgiOmZhbHNlLCJtYXAiOiJjIiwicXVlcnkiOiIke3F1ZXJ5fSIsIm9yZGVyQnkiOiJPcmRlckJ5U2NvcmVERVNDIiwiZnJvbSI6MCwidG8iOjIwLCJzZWxlY3RlZEZhY2V0cyI6W3sia2V5IjoiYyIsInZhbHVlIjoiYWJhcnJvdGVzIn1dLCJvcGVyYXRvciI6ImFuZCIsImZ1enp5IjoiMCIsInNlYXJjaFN0YXRlIjpudWxsLCJmYWNldHNCZWhhdmlvciI6IlN0YXRpYyIsImNhdGVnb3J5VHJlZUJlaGF2aW9yIjoiZGVmYXVsdCIsIndpdGhGYWNldHMiOmZhbHNlLCJhZHZlcnRpc2VtZW50T3B0aW9ucyI6eyJzaG93U3BvbnNvcmVkIjp0cnVlLCJzcG9uc29yZWRDb3VudCI6MywiYWR2ZXJ0aXNlbWVudFBsYWNlbWVudCI6InRvcF9zZWFyY2giLCJyZXBlYXRTcG9uc29yZWRQcm9kdWN0cyI6dHJ1ZX19"}`.replace('${query}', encodeURIComponent(query)),
    };

    // Add headers to mimic a browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'es-CR,es;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://www.maxipali.co.cr/',
      'Origin': 'https://www.maxipali.co.cr'
    };

    console.log('Making API request to MaxiPali...');
    
    // Make the API request
    const response = await axios.get('https://www.maxipali.co.cr/_v/segment/graphql/v1', { 
      params,
      headers,
      timeout: 10000 // 10 seconds timeout
    });
    
    console.log('MaxiPali API response received');
    console.log('Response status:', response.status);
    
    // Process the response
    if (response.data && response.data.data && response.data.data.productSearch) {
      const products = response.data.data.productSearch.products || [];
      console.log(`Found ${products.length} products from MaxiPali`);
      
      if (products.length === 0) {
        console.log('No products found matching "Bimbo Cero Cero Blanco 550g"');
        
        // Try a more general search for Bimbo products
        console.log('\nTrying a more general search for "Bimbo Cero Cero"...');
        await searchForBimboProducts();
        return;
      }
      
      // Analyze each product for EAN codes
      console.log('\n=== Product Details ===');
      
      products.forEach((product, index) => {
        console.log(`\nProduct ${index + 1}: ${product.productName}`);
        
        // Check for EAN in items
        let ean = null;
        let refId = null;
        
        if (product.items && product.items.length > 0) {
          // Check direct EAN property
          if (product.items[0].ean) {
            ean = product.items[0].ean;
          }
          
          // Check referenceId for EAN
          if (product.items[0].referenceId && Array.isArray(product.items[0].referenceId)) {
            const refIdObj = product.items[0].referenceId.find(ref => ref.Key === 'RefId');
            if (refIdObj) {
              refId = refIdObj.Value;
            }
          }
        }
        
        console.log('Brand:', product.brand || 'Not specified');
        console.log('Direct EAN:', ean || 'Not found');
        console.log('Reference ID:', refId || 'Not found');
        
        // Log the full item structure for debugging
        console.log('\nProduct item structure:');
        console.log(JSON.stringify(product.items?.[0] || {}, null, 2));
      });
      
    } else {
      console.log('No products found in the response');
      
      // Try a more general search for Bimbo products
      console.log('\nTrying a more general search for "Bimbo Cero Cero"...');
      await searchForBimboProducts();
    }
  } catch (error) {
    console.error('Error testing MaxiPali API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Try a more general search for Bimbo products
    console.log('\nTrying a more general search for "Bimbo Cero Cero"...');
    await searchForBimboProducts();
  }
}

async function searchForBimboProducts() {
  try {
    // Use a more general query
    const query = 'Bimbo Cero Cero';
    console.log(`Search query: ${query}`);
    
    // Prepare the API parameters
    const params = {
      'workspace': 'master',
      'maxAge': 'short',
      'appsEtag': 'remove',
      'domain': 'store',
      'locale': 'es-CR',
      '__bindingId': 'c0655441-0e36-4c40-a5b2-167f32bcfd18',
      'operationName': 'productSearchV3',
      'variables': '{}',
      'extensions': `{"persistedQuery":{"version":1,"sha256Hash":"9177ba6f883473505dc99fcf2b679a6e270af6320a157f0798b92efeab98d5d3","sender":"vtex.store-resources@0.x","provider":"vtex.search-graphql@0.x"},"variables":"eyJoaWRlVW5hdmFpbGFibGVJdGVtcyI6ZmFsc2UsInNrdXNGaWx0ZXIiOiJBTEwiLCJzaW11bGF0aW9uQmVoYXZpb3IiOiJkZWZhdWx0IiwiaW5zdGFsbG1lbnRDcml0ZXJpYSI6Ik1BWF9XSVRIT1VUX0lOVEVSRVNUIiwicHJvZHVjdE9yaWdpblZ0ZXgiOmZhbHNlLCJtYXAiOiJjIiwicXVlcnkiOiIke3F1ZXJ5fSIsIm9yZGVyQnkiOiJPcmRlckJ5U2NvcmVERVNDIiwiZnJvbSI6MCwidG8iOjIwLCJzZWxlY3RlZEZhY2V0cyI6W3sia2V5IjoiYyIsInZhbHVlIjoiYWJhcnJvdGVzIn1dLCJvcGVyYXRvciI6ImFuZCIsImZ1enp5IjoiMCIsInNlYXJjaFN0YXRlIjpudWxsLCJmYWNldHNCZWhhdmlvciI6IlN0YXRpYyIsImNhdGVnb3J5VHJlZUJlaGF2aW9yIjoiZGVmYXVsdCIsIndpdGhGYWNldHMiOmZhbHNlLCJhZHZlcnRpc2VtZW50T3B0aW9ucyI6eyJzaG93U3BvbnNvcmVkIjp0cnVlLCJzcG9uc29yZWRDb3VudCI6MywiYWR2ZXJ0aXNlbWVudFBsYWNlbWVudCI6InRvcF9zZWFyY2giLCJyZXBlYXRTcG9uc29yZWRQcm9kdWN0cyI6dHJ1ZX19"}`.replace('${query}', encodeURIComponent(query)),
    };

    // Add headers to mimic a browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'es-CR,es;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://www.maxipali.co.cr/',
      'Origin': 'https://www.maxipali.co.cr'
    };
    
    // Make the API request
    const response = await axios.get('https://www.maxipali.co.cr/_v/segment/graphql/v1', { 
      params,
      headers,
      timeout: 10000 // 10 seconds timeout
    });
    
    // Process the response
    if (response.data && response.data.data && response.data.data.productSearch) {
      const products = response.data.data.productSearch.products || [];
      console.log(`Found ${products.length} Bimbo products from MaxiPali`);
      
      if (products.length === 0) {
        console.log('No Bimbo products found');
        return;
      }
      
      // Analyze each product for EAN codes
      console.log('\n=== Bimbo Products ===');
      
      products.forEach((product, index) => {
        console.log(`\nProduct ${index + 1}: ${product.productName}`);
        
        // Check for EAN in items
        let ean = null;
        let refId = null;
        
        if (product.items && product.items.length > 0) {
          // Check direct EAN property
          if (product.items[0].ean) {
            ean = product.items[0].ean;
          }
          
          // Check referenceId for EAN
          if (product.items[0].referenceId && Array.isArray(product.items[0].referenceId)) {
            const refIdObj = product.items[0].referenceId.find(ref => ref.Key === 'RefId');
            if (refIdObj) {
              refId = refIdObj.Value;
            }
          }
        }
        
        console.log('Brand:', product.brand || 'Not specified');
        console.log('Direct EAN:', ean || 'Not found');
        console.log('Reference ID:', refId || 'Not found');
        
        // Check if this is the product we're looking for
        if (product.productName.toLowerCase().includes('cero cero blanco') && 
            product.productName.toLowerCase().includes('550g')) {
          console.log('\n*** FOUND TARGET PRODUCT ***');
          console.log(`Product: ${product.productName}`);
          console.log('EAN:', ean || 'Not found');
        }
      });
      
    } else {
      console.log('No Bimbo products found in the response');
    }
  } catch (error) {
    console.error('Error searching for Bimbo products:', error.message);
  }
}

testBimboEANExtraction(); 