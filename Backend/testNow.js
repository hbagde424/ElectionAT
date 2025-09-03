const axios = require('axios');

console.log('Testing Super Admin login...');

axios.post('http://localhost:5000/api/auth/login', {
    email: 'superadmin@example.com',
    password: 'superadmin@123'
})
    .then(response => {
        console.log('✅ LOGIN SUCCESS!');
        console.log('Status:', response.status);
        console.log('User:', response.data.user);
    })
    .catch(error => {
        console.log('❌ LOGIN FAILED');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Message:', error.response.data.message);
        } else {
            console.log('Error:', error.message);
        }
    });
