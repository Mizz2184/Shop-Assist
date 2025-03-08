const axios = require('axios');

async function testSearchAPI() {
  try {
    console.log('Testing Shop Assist API with query "arroz"...');
    const response = await axios.get('http://localhost:3000/api/search?query=arroz&stores=maxipali');
    
    console.log('API Response Status:', response.status);
    console.log('Number of products found:', response.data.length);
    
    if (response.data.length > 0) {
      console.log('\nSample product:');
      console.log(JSON.stringify(response.data[0], null, 2));
    } else {
      console.log('No products found.');
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSearchAPI(); 