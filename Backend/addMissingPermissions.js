const mongoose = require('mongoose');
const config = require('./config/config');
const Permission = require('./models/Permission');

async function addMissingPermissions() {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('Connected to MongoDB');

        const missingPermissions = [
            {
                name: 'analytics_read',
                description: 'Permission to read analytics data',
                level: 'State'
            },
            {
                name: 'report_read',
                description: 'Permission to read reports',
                level: 'State'
            }
        ];

        for (const perm of missingPermissions) {
            const existingPerm = await Permission.findOne({ name: perm.name });
            if (!existingPerm) {
                await Permission.create(perm);
                console.log(`Created permission: ${perm.name}`);
            } else {
                console.log(`Permission already exists: ${perm.name}`);
            }
        }

        console.log('Completed adding missing permissions');
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addMissingPermissions();