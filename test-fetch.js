const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
  try {
    console.log('Testing login...');
    const response = await fetch('https://app.conversate.us/auth/sign_in', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'sr@conversate.us',
        password: 'Demo123456!',
      }),
    });

    const data = await response.json();
    console.log('Response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data,
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();