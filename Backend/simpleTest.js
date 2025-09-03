const http = require('http');

function testAPI(path, callback) {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: path,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            callback(null, { status: res.statusCode, data: data });
        });
    });

    req.on('error', (error) => {
        callback(error, null);
    });

    req.end();
}

console.log('Testing APIs...\n');

testAPI('/api/users', (err, result) => {
    if (err) {
        console.error('❌ Users API error:', err.message);
    } else {
        console.log('✅ Users API status:', result.status);
        if (result.status === 200) {
            try {
                const users = JSON.parse(result.data);
                console.log(`Found ${users.length || 0} users`);
            } catch (e) {
                console.log('Response:', result.data.substring(0, 200));
            }
        } else {
            console.log('Response:', result.data);
        }
    }
});

testAPI('/api/roles', (err, result) => {
    if (err) {
        console.error('❌ Roles API error:', err.message);
    } else {
        console.log('✅ Roles API status:', result.status);
        if (result.status === 200) {
            try {
                const roles = JSON.parse(result.data);
                console.log(`Found ${roles.length || 0} roles`);
            } catch (e) {
                console.log('Response:', result.data.substring(0, 200));
            }
        } else {
            console.log('Response:', result.data);
        }
    }
});

testAPI('/api/permissions', (err, result) => {
    if (err) {
        console.error('❌ Permissions API error:', err.message);
    } else {
        console.log('✅ Permissions API status:', result.status);
        if (result.status === 200) {
            try {
                const permissions = JSON.parse(result.data);
                console.log(`Found ${permissions.length || 0} permissions`);
            } catch (e) {
                console.log('Response:', result.data.substring(0, 200));
            }
        } else {
            console.log('Response:', result.data);
        }
    }
});
