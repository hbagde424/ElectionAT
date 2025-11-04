// testSuperAdminLogin.js - Test Super Admin login
const axios = require('axios');

async function testSuperAdminLogin() {
    try {
        console.log('🧪 Testing Super Admin login...\n');

        const loginData = {
            email: 'superadmin@example.com',
            password: 'superadmin@123'
        };

        console.log('📤 Sending login request...');
        console.log('Email:', loginData.email);
        console.log('URL: http://localhost:5000/api/auth/login');

        const response = await axios.post('http://localhost:5000/api/auth/login', loginData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('\n✅ SUPER ADMIN LOGIN SUCCESSFUL!');
        console.log('Status Code:', response.status);
        console.log('\n📋 Login Response:');
        console.log('Success:', response.data.success);
        console.log('Token received:', !!response.data.token);
        console.log('Token length:', response.data.token ? response.data.token.length : 0);

        if (response.data.user) {
            console.log('\n👤 User Details:');
            console.log('ID:', response.data.user.id);
            console.log('Email:', response.data.user.email);
            console.log('Role:', response.data.user.role);
            console.log('Active:', response.data.user.isActive);
        }

        console.log('\n🎉 Super Admin account is ready for use!');
        console.log('\n📝 Frontend Login Instructions:');
        console.log('1. Go to: http://localhost:5173/election/login');
        console.log('2. Email: superadmin@example.com');
        console.log('3. Password: superadmin@123');
        console.log('4. You should have access to all sidebar options and permissions');

    } catch (error) {
        console.log('\n❌ SUPER ADMIN LOGIN FAILED');

        if (error.response) {
            console.log('Status Code:', error.response.status);
            console.log('Error Response:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('No response received from server');
            console.log('Make sure backend is running on port 5000');
        } else {
            console.log('Error:', error.message);
        }
    }
}

testSuperAdminLogin();
