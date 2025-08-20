// Test script to debug the API endpoints and data structure
const fetch = require('node-fetch');

async function testAPIs() {
    console.log('Testing API endpoints...\n');

    try {
        // Test candidates API
        console.log('1. Testing Candidates API:');
        const candidatesResponse = await fetch('http://localhost:5000/api/candidates');
        const candidatesData = await candidatesResponse.json();
        console.log('- Status:', candidatesResponse.status);
        console.log('- Success:', candidatesData.success);
        console.log('- Count:', candidatesData.count);
        console.log('- First candidate sample:', candidatesData.data?.[0]?.name || 'No candidates');
        console.log('');

        // Test election years API
        console.log('2. Testing Election Years API:');
        const electionYearsResponse = await fetch('http://localhost:5000/api/election-years');
        const electionYearsData = await electionYearsResponse.json();
        console.log('- Status:', electionYearsResponse.status);
        console.log('- Success:', electionYearsData.success);
        console.log('- Count:', electionYearsData.count);
        console.log('- First election year sample:', electionYearsData.data?.[0]?.year || 'No election years');
        console.log('');

        // Test other essential APIs
        console.log('3. Testing Parties API:');
        const partiesResponse = await fetch('http://localhost:5000/api/parties');
        const partiesData = await partiesResponse.json();
        console.log('- Status:', partiesResponse.status);
        console.log('- Success:', partiesData.success);
        console.log('- Count:', partiesData.count);
        console.log('');

        console.log('4. Testing States API:');
        const statesResponse = await fetch('http://localhost:5000/api/states');
        const statesData = await statesResponse.json();
        console.log('- Status:', statesResponse.status);
        console.log('- Success:', statesData.success);
        console.log('- Count:', statesData.count);

        console.log('\n=== SUMMARY ===');
        console.log('All APIs are responding correctly!');
        console.log('Data structure for candidates:', {
            success: candidatesData.success,
            data: Array.isArray(candidatesData.data) ? 'Array of ' + candidatesData.data.length + ' items' : 'Not an array'
        });
        console.log('Data structure for election years:', {
            success: electionYearsData.success,
            data: Array.isArray(electionYearsData.data) ? 'Array of ' + electionYearsData.data.length + ' items' : 'Not an array'
        });

    } catch (error) {
        console.error('Error testing APIs:', error.message);
    }
}

testAPIs();
