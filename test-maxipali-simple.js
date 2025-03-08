const axios = require('axios');

async function testMaxiPaliAPI() {
  try {
    console.log('Testing MaxiPali API with simplified query...');
    
    const query = 'arroz';
    console.log(`Search query: ${query}`);
    
    // Prepare the API parameters with fewer filters
    const params = {
      'workspace': 'master',
      'maxAge': 'short',
      'appsEtag': 'remove',
      'domain': 'store',
      'locale': 'es-CR',
      '__bindingId': 'c0655441-0e36-4c40-a5b2-167f32bcfd18',
      'operationName': 'productSearchV3',
      'variables': '{}',
      'extensions': `{"persistedQuery":{"version":1,"sha256Hash":"9177ba6f883473505dc99fcf2b679a6e270af6320a157f0798b92efeab98d5d3","sender":"vtex.store-resources@0.x","provider":"vtex.search-graphql@0.x"},"variables":"eyJoaWRlVW5hdmFpbGFibGVJdGVtcyI6ZmFsc2UsInNrdXNGaWx0ZXIiOiJBTEwiLCJzaW11bGF0aW9uQmVoYXZpb3IiOiJkZWZhdWx0IiwiaW5zdGFsbG1lbnRDcml0ZXJpYSI6Ik1BWF9XSVRIT1VUX0lOVEVSRVNUIiwicHJvZHVjdE9yaWdpblZ0ZXgiOmZhbHNlLCJtYXAiOiJjIiwicXVlcnkiOiIke3F1ZXJ5fSIsIm9yZGVyQnkiOiJPcmRlckJ5U2NvcmVERVNDIiwiZnJvbSI6MCwidG8iOjIwLCJzZWxlY3RlZEZhY2V0cyI6W10sInNlYXJjaFN0YXRlIjpudWxsLCJmYWNldHNCZWhhdmlvciI6IlN0YXRpYyIsImNhdGVnb3J5VHJlZUJlaGF2aW9yIjoiZGVmYXVsdCIsIndpdGhGYWNldHMiOmZhbHNlLCJhZHZlcnRpc2VtZW50T3B0aW9ucyI6eyJzaG93U3BvbnNvcmVkIjp0cnVlLCJzcG9uc29yZWRDb3VudCI6MywiYWR2ZXJ0aXNlbWVudFBsYWNlbWVudCI6InRvcF9zZWFyY2giLCJyZXBlYXRTcG9uc29yZWRQcm9kdWN0cyI6dHJ1ZX19"}`.replace('${query}', encodeURIComponent(query)),
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
    
    // Log the structure of the response
    console.log('Response data structure:', JSON.stringify(Object.keys(response.data || {}), null, 2));
    
    if (response.data && response.data.data) {
      console.log('GraphQL data structure:', JSON.stringify(Object.keys(response.data.data || {}), null, 2));
      
      if (response.data.data.productSearch) {
        console.log('ProductSearch structure:', JSON.stringify(Object.keys(response.data.data.productSearch || {}), null, 2));
        
        const products = response.data.data.productSearch.products || [];
        console.log('Number of products:', products.length);
        
        if (products.length > 0) {
          console.log('\nSample product:');
          console.log(JSON.stringify(products[0], null, 2));
        }
      } else {
        console.log('No productSearch data found in the response');
        console.log('Full response:', JSON.stringify(response.data, null, 2));
      }
    } else {
      console.log('No data found in the response');
      console.log('Full response:', JSON.stringify(response.data, null, 2));
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