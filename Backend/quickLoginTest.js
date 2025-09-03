// quickLoginTest.js - Quick login test for Super Admin
const axios = require('axios');

// Test Super Admin login
axios.post('http://localhost:5000/api/auth/login', {
    email: 'superadmin@example.com',
    password: 'superadmin@123'
}, {
    headers: { 'Content-Type': 'application/json' }
})
    .then(response => {
        console.log('SUCCESS:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    })
    .catch(error => {
        if (error.response) {
            console.log('FAILED:', error.response.status);
            console.log('Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('ERROR:', error.message);
        }
    });
