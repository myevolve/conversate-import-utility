const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing login...');
    const response = await axios.post('http://localhost:52224/api/auth/sign_in', {
      email: 'sr@conversate.us',
      password: 'Demo123456!',
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
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