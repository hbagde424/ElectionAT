const axios = require('axios');

const testAPI = async () => {
    try {
        console.log('Testing Role and Permission System APIs...\n');

        // Test roles endpoint
        const rolesResponse = await axios.get('http://localhost:5000/api/roles');
        console.log('✅ Roles API Working');
        console.log(`Found ${rolesResponse.data.length || 0} roles`);

        // Test permissions endpoint
        const permissionsResponse = await axios.get('http://localhost:5000/api/permissions');
        console.log('✅ Permissions API Working');
        console.log(`Found ${permissionsResponse.data.length || 0} permissions`);

        // Test users endpoint
        const usersResponse = await axios.get('http://localhost:5000/api/users');
        console.log('✅ Users API Working');
        console.log(`Found ${usersResponse.data.length || usersResponse.data.data?.length || 0} users`);

        console.log('\n🎉 All APIs are working correctly!');

        // Display some sample data
        if (rolesResponse.data.length > 0) {
            console.log('\n📋 Sample Roles:');
            rolesResponse.data.slice(0, 3).forEach(role => {
                console.log(`  • ${role.name}: ${role.description}`);
            });
        }

    } catch (error) {
        console.error('❌ API Test Failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.status, error.response.statusText);
        }
    }
};

testAPI();
