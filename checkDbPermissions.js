const mongoose = require('./Backend/node_modules/mongoose');
const config = require('./Backend/config/config');
const Permission = require('./Backend/models/Permission');

async function checkDbPermissions() {
    try {
        // Connect to MongoDB using the config
        await mongoose.connect(config.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get all permissions from DB
        const permissions = await Permission.find({});

        console.log('\n=== Current Permissions in Database ===');
        permissions.forEach(p => {
            console.log(`- ${p.name}`);
        });

        // Define required permissions based on your permissionUtils
        const requiredPermissions = [
            'dashboard.view',
            'analytics_read',
            'report_read',
            'reports.view',
            'Dashboard_Total',
            'user.create',
            'user.read',
            'user.update',
            'user.delete',
            'role.create',
            'role.read',
            'booth.read',
            'assembly.read',
            'parliament.read',
            'division.read',
            'division.update',
            'block.read',
            'election.manage'
        ];

        // Check for duplicates
        const duplicates = permissions.filter((permission, index, self) =>
            self.findIndex(p => p.name.toLowerCase() === permission.name.toLowerCase()) !== index
        );

        // Check for missing permissions
        const existingPermissionNames = permissions.map(p => p.name.toLowerCase());
        const missingPermissions = requiredPermissions.filter(required =>
            !existingPermissionNames.includes(required.toLowerCase())
        );

        console.log('\n=== Analysis Results ===');
        console.log(`Total permissions in DB: ${permissions.length}`);
        console.log(`Required permissions: ${requiredPermissions.length}`);
        console.log(`Missing permissions: ${missingPermissions.length}`);

        if (duplicates.length > 0) {
            console.log('\n=== Duplicate Permissions ===');
            duplicates.forEach(p => console.log(`- ${p.name}`));
        }

        if (missingPermissions.length > 0) {
            console.log('\n=== Missing Permissions ===');
            missingPermissions.forEach(p => console.log(`- ${p}`));
        }

        // List all existing permissions with their IDs
        console.log('\n=== All Permissions Detail ===');
        permissions.forEach(p => {
            console.log(`ID: ${p._id}, Name: ${p.name}, Description: ${p.description || 'No description'}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDisconnected from MongoDB');
    }
}

checkDbPermissions();