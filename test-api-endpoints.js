// Quick test script to check API endpoints
const testApiEndpoints = async () => {
    const baseUrl = 'http://localhost:5000/api';

    const endpoints = [
        '/states',
        '/divisions',
        '/parliaments',
        '/assemblies',
        '/blocks',
        '/booths'
    ];

    console.log('Testing API endpoints...');

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${baseUrl}${endpoint}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint}: ${data.success ? data.data.length : 0} records`);

                // Show structure of first item for divisions
                if (endpoint === '/divisions' && data.data && data.data.length > 0) {
                    console.log('  Division structure:', JSON.stringify(data.data[0], null, 2));
                }
            } else {
                console.log(`❌ ${endpoint}: HTTP ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.message}`);
        }
    }
};

// Run the test
testApiEndpoints();
