const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
const UserRole = require('./models/UserRole');
const RolePermission = require('./models/RolePermission');

async function createAllAccessPermission() {
    try {
        await mongoose.connect('mongodb://localhost:27017/electionat');
        console.log('Connected to MongoDB');

        // Create 'all.access' permission if it doesn't exist
        let allAccessPermission = await Permission.findOne({ name: 'all.access' });
        if (!allAccessPermission) {
            allAccessPermission = await Permission.create({
                name: 'all.access',
                description: 'Full access to all system functions'
            });
            console.log('Created all.access permission');
        }

        // Create 'system.admin' permission if it doesn't exist
        let systemAdminPermission = await Permission.findOne({ name: 'system.admin' });
        if (!systemAdminPermission) {
            systemAdminPermission = await Permission.create({
                name: 'system.admin',
                description: 'System administrator access'
            });
            console.log('Created system.admin permission');
        }

        // Find Super Admin role
        const superAdminRole = await Role.findOne({ name: 'superAdmin' });
        if (!superAdminRole) {
            console.log('Super Admin role not found');
            return;
        }

        // Add permissions to Super Admin role if not already present
        const existingAllAccess = await RolePermission.findOne({
            role: superAdminRole._id,
            permission: allAccessPermission._id
        });

        if (!existingAllAccess) {
            await RolePermission.create({
                role: superAdminRole._id,
                permission: allAccessPermission._id
            });
            console.log('Added all.access permission to Super Admin role');
        }

        const existingSystemAdmin = await RolePermission.findOne({
            role: superAdminRole._id,
            permission: systemAdminPermission._id
        });

        if (!existingSystemAdmin) {
            await RolePermission.create({
                role: superAdminRole._id,
                permission: systemAdminPermission._id
            });
            console.log('Added system.admin permission to Super Admin role');
        }

        console.log('Permission setup complete');
        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createAllAccessPermission();
