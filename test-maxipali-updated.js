const axios = require('axios');

async function testMaxiPaliAPI() {
  try {
    console.log('Testing updated MaxiPali API...');
    
    const query = 'arroz';
    console.log(`Search query: ${query}`);
    
    // Prepare the API parameters based on the working example
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
      
      if (products.length > 0) {
        console.log('\nSample product:');
        const sampleProduct = products[0];
        console.log('Product Name:', sampleProduct.productName);
        console.log('Brand:', sampleProduct.brand);
        console.log('Price:', sampleProduct.priceRange?.sellingPrice?.lowPrice);
        
        const imageUrl = sampleProduct.items && sampleProduct.items[0]?.images[0]?.imageUrl;
        console.log('Raw Image URL:', imageUrl);
        
        // Fix the image URL to handle cases where it already contains a domain
        let formattedImageUrl = '';
        if (imageUrl) {
          if (imageUrl.startsWith('http')) {
            formattedImageUrl = imageUrl;
          } else if (imageUrl.startsWith('https://')) {
            formattedImageUrl = imageUrl;
          } else {
            formattedImageUrl = `https://maxipali.vtexassets.com${imageUrl}`;
          }
        }
        console.log('Formatted Image URL:', formattedImageUrl);
        
        console.log('Link:', `https://www.maxipali.co.cr/${sampleProduct.linkText}/p`);
      }
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

testMaxiPaliAPI(); 