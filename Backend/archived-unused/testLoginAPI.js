// testLoginAPI.js - Test login API directly
const axios = require('axios');

const testLoginAPI = async () => {
    try {
        console.log('Testing login API...');

        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@example.com',
            password: 'password123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Login successful!');
        console.log('Response:', response.data);

    } catch (error) {
        console.log('❌ Login failed');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
};

testLoginAPI();
