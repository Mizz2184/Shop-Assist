const axios = require('axios');

async function testMaxiPaliEANExtraction() {
  try {
    console.log('Testing MaxiPali API for EAN extraction...');
    
    // Use a common product that likely has an EAN code
    const query = 'arroz tio pelon';
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
      
      // Count products with EAN codes
      let productsWithEAN = 0;
      let productsWithRefId = 0;
      
      // Analyze each product for EAN codes
      console.log('\n=== EAN Analysis ===');
      
      products.forEach((product, index) => {
        console.log(`\nProduct ${index + 1}: ${product.productName}`);
        
        // Check for EAN in items
        let ean = null;
        let refId = null;
        
        if (product.items && product.items.length > 0) {
          // Check direct EAN property
          if (product.items[0].ean) {
            ean = product.items[0].ean;
            productsWithEAN++;
          }
          
          // Check referenceId for EAN
          if (product.items[0].referenceId && Array.isArray(product.items[0].referenceId)) {
            const refIdObj = product.items[0].referenceId.find(ref => ref.Key === 'RefId');
            if (refIdObj) {
              refId = refIdObj.Value;
              productsWithRefId++;
            }
          }
        }
        
        console.log('Direct EAN:', ean || 'Not found');
        console.log('Reference ID:', refId || 'Not found');
        
        // Log the full item structure for the first product to help debug
        if (index === 0) {
          console.log('\nFirst product item structure:');
          console.log(JSON.stringify(product.items?.[0] || {}, null, 2));
        }
      });
      
      // Summary
      console.log('\n=== Summary ===');
      console.log(`Total products: ${products.length}`);
      console.log(`Products with direct EAN: ${productsWithEAN} (${Math.round(productsWithEAN/products.length*100)}%)`);
      console.log(`Products with Reference ID: ${productsWithRefId} (${Math.round(productsWithRefId/products.length*100)}%)`);
      console.log(`Products with either EAN or RefId: ${productsWithEAN + productsWithRefId - Math.min(productsWithEAN, productsWithRefId)} (${Math.round((productsWithEAN + productsWithRefId - Math.min(productsWithEAN, productsWithRefId))/products.length*100)}%)`);
      
      // Test the search API implementation
      console.log('\n=== Testing Search API Implementation ===');
      console.log('Checking how our API would transform these products:');
      
      const transformedProducts = products.map(item => {
        const ean = item.items?.[0]?.ean || '';
        return {
          id: item.productId,
          name: item.productName,
          ean: ean
        };
      });
      
      console.log(`\nSample of ${Math.min(5, transformedProducts.length)} transformed products:`);
      transformedProducts.slice(0, 5).forEach(product => {
        console.log(`- ${product.name}: EAN = "${product.ean}"`);
      });
      
      const productsWithExtractedEAN = transformedProducts.filter(p => p.ean && p.ean.length > 0);
      console.log(`\nProducts with extracted EAN: ${productsWithExtractedEAN.length} out of ${transformedProducts.length} (${Math.round(productsWithExtractedEAN.length/transformedProducts.length*100)}%)`);
      
    } else {
      console.log('No products found in the response');
    }
  } catch (error) {
    console.error('Error testing MaxiPali API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMaxiPaliEANExtraction(); 