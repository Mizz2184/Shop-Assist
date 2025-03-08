const axios = require('axios');

async function testMaxiPaliAPI() {
  try {
    console.log('Testing MaxiPali API directly...');
    
    const query = 'arroz';
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
      'extensions': `{"persistedQuery":{"version":1,"sha256Hash":"9177ba6f883473505dc99fcf2b679a6e270af6320a157f0798b92efeab98d5d3","sender":"vtex.store-resources@0.x","provider":"vtex.search-graphql@0.x"},"variables":"eyJoaWRlVW5hdmFpbGFibGVJdGVtcyI6ZmFsc2UsInNrdXNGaWx0ZXIiOiJBTEwiLCJzaW11bGF0aW9uQmVoYXZpb3IiOiJkZWZhdWx0IiwiaW5zdGFsbG1lbnRDcml0ZXJpYSI6Ik1BWF9XSVRIT1VUX0lOVEVSRVNUIiwicHJvZHVjdE9yaWdpblZ0ZXgiOmZhbHNlLCJtYXAiOiJjYXRlZ29yeS0xLGNhdGVnb3J5LTIsY2F0ZWdvcnktMixjYXRlZ29yeS0yLGNhdGVnb3J5LTIsY2F0ZWdvcnktMixjYXRlZ29yeS0yLGNhdGVnb3J5LTIsY2F0ZWdvcnktMixjYXRlZ29yeS0yLGNhdGVnb3J5LTIsY2F0ZWdvcnktMixjYXRlZ29yeS0yLGNhdGVnb3J5LTIsY2F0ZWdvcnktMixjYXRlZ29yeS0yLGNhdGVnb3J5LTIsY2F0ZWdvcnktMiIsInF1ZXJ5IjoiJHtxdWVyeX0iLCJvcmRlckJ5IjoiT3JkZXJCeVNjb3JlREVTQyIsImZyb20iOjAsInRvIjoyMCwic2VsZWN0ZWRGYWNldHMiOlt7ImtleSI6ImNhdGVnb3J5LTEiLCJ2YWx1ZSI6ImFiYXJyb3RlcyJ9LHsia2V5IjoiY2F0ZWdvcnktMiIsInZhbHVlIjoiYWNlaXRlcy1kZS1jb2NpbmEifSx7ImtleSI6ImNhdGVnb3J5LTIiLCJ2YWx1ZSI6ImFsaW1lbnRvcy1pbnN0YW50YW5lb3MifSx7ImtleSI6ImNhdGVnb3J5LTIiLCJ2YWx1ZSI6ImFycm96LWZyaWpvbC15LXNlbWlsbGFzIn0seyJrZXkiOiJjYXRlZ29yeS0yIiwidmFsdWUiOiJhenVjYXIteS1wb3N0cmVzIn0seyJrZXkiOiJjYXRlZ29yeS0yIiwidmFsdWUiOiJjYWZlLXRlLXktc3VzdGl0dXRvcyJ9LHsia2V5IjoiY2F0ZWdvcnktMiIsInZhbHVlIjoiY2VyZWFsZXMteS1iYXJyYXMifSx7ImtleSI6ImNhdGVnb3J5LTIiLCJ2YWx1ZSI6ImR1bGNlcy15LWNob2NvbGF0ZXMifSx7ImtleSI6ImNhdGVnb3J5LTIiLCJ2YWx1ZSI6ImVubGF0YWRvcy15LWNvbnNlcnZhcyJ9LHsia2V5IjoiY2F0ZWdvcnktMiIsInZhbHVlIjoiZXNwZWNpYXMteS1zYXpvbmFkb3JlcyJ9LHsia2V5IjoiY2F0ZWdvcnktMiIsInZhbHVlIjoiZ2FsbGV0YXMifSx7ImtleSI6ImNhdGVnb3J5LTIiLCJ2YWx1ZSI6ImhhcmluYXMteS1yZXBvc3RlcmlhIn0seyJrZXkiOiJjYXRlZ29yeS0yIiwidmFsdWUiOiJtZXJtZWxhZGFzLXktbWllbCJ9LHsia2V5IjoiY2F0ZWdvcnktMiIsInZhbHVlIjoicGFuLXktdG9ydGlsbGFzLWVtcGFjYWRvcyJ9LHsia2V5IjoiY2F0ZWdvcnktMiIsInZhbHVlIjoicGFzdGFzIn0seyJrZXkiOiJjYXRlZ29yeS0yIiwidmFsdWUiOiJwcm9kdWN0b3MtdmVnZXRhbGVzLXktdmVnYW5vcyJ9LHsia2V5IjoiY2F0ZWdvcnktMiIsInZhbHVlIjoic2Fsc2EtYWRlcmV6b3MteS12aW5hZ3JlIn0seyJrZXkiOiJjYXRlZ29yeS0yIiwidmFsdWUiOiJzbmFja3MteS1mcnV0YS1zZWNhIn1dLCJzZWFyY2hTdGF0ZSI6bnVsbCwiZmFjZXRzQmVoYXZpb3IiOiJTdGF0aWMiLCJjYXRlZ29yeVRyZWVCZWhhdmlvciI6ImRlZmF1bHQiLCJ3aXRoRmFjZXRzIjpmYWxzZSwiYWR2ZXJ0aXNlbWVudE9wdGlvbnMiOnsic2hvd1Nwb25zb3JlZCI6dHJ1ZSwic3BvbnNvcmVkQ291bnQiOjMsImFkdmVydGlzZW1lbnRQbGFjZW1lbnQiOiJ0b3Bfc2VhcmNoIiwicmVwZWF0U3BvbnNvcmVkUHJvZHVjdHMiOnRydWV9fQ=="}`.replace('${query}', encodeURIComponent(query)),
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