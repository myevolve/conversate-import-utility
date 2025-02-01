const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLogin() {
  try {
    console.log('Sending login request...');
    const response = await fetch('https://app.conversate.us/auth/sign_in', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        email: 'sr@conversate.us',
        password: 'Demo123456!'
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', data);

  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();