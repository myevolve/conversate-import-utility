import fetch from 'node-fetch';

async function testAuth() {
    try {
        // Test login
        console.log('Testing login...');
        const loginResponse = await fetch('http://localhost:53875/api/auth/sign_in', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'sr@conversate.us',
                password: 'Test123456!'
            })
        });

        console.log('Login response status:', loginResponse.status);
        console.log('Login response headers:', Object.fromEntries(loginResponse.headers.entries()));
        console.log('Login response:', await loginResponse.json());

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run test
console.log('Running auth test...');
testAuth();