// loginTest.js - Simple login test
const axios = require('axios');

async function loginTest() {
    try {
        console.log('Testing login API endpoint...');

        const loginData = {
            email: 'admin@example.com',
            password: 'password123'
        };

        console.log('Sending request to: http://localhost:5000/api/auth/login');
        console.log('Login data:', loginData);

        const response = await axios.post('http://localhost:5000/api/auth/login', loginData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('\n✅ LOGIN SUCCESSFUL!');
        console.log('Status Code:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('\n❌ LOGIN FAILED');

        if (error.response) {
            console.log('Status Code:', error.response.status);
            console.log('Status Text:', error.response.statusText);
            console.log('Error Response:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('No response received from server');
            console.log('Request details:', error.request);
        } else {
            console.log('Error setting up request:', error.message);
        }
    }
}

loginTest();
