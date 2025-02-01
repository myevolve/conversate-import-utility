const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing login...');
    const response = await axios.post('https://app.conversate.us/auth/sign_in', {
      email: 'sr@conversate.us',
      password: 'Demo123456!',
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://app.conversate.us',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
      withCredentials: true,
    });

    console.log('Response:', {
      status: response.status,
      headers: response.headers,
      data: response.data,
    });
  } catch (error) {
    console.error('Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
  }
}

testAPI();