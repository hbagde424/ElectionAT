// testData.js - Create clean test data
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
const RolePermission = require('./models/RolePermission'); qazqwqwqwss

const createTestData = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to database');

        // Clear existing data first
        console.log('🧹 Clearing existing data...');
        await RolePermission.deleteMany({});
        await Role.deleteMany({});
        await Permission.deleteMany({});
        console.log('✅ Cleared existing data');

        // Create roles
        console.log('👥 Creating roles...');
        const adminRole = await Role.create({
            name: 'Admin',
            description: 'Administrator role',
            status: 'Active'
        });
        console.log('✅ Created Admin role:', adminRole._id);

        const userRole = await Role.create({
            name: 'User',
            description: 'Regular user role',
            status: 'Active'
        });
        console.log('✅ Created User role:', userRole._id);

        const managerRole = await Role.create({
            name: 'Manager',
            description: 'Manager role',
            status: 'Active'
        });
        console.log('✅ Created Manager role:', managerRole._id);

        // Create permissions
        console.log('📋 Creating permissions...');
        const viewPermission = await Permission.create({
            name: 'USER_VIEW',
            description: 'View users',
            level: 'State'
        });
        console.log('✅ Created VIEW permission:', viewPermission._id);

        const createPermission = await Permission.create({
            name: 'USER_CREATE',
            description: 'Create users',
            level: 'State'
        });
        console.log('✅ Created CREATE permission:', createPermission._id);

        const updatePermission = await Permission.create({
            name: 'USER_UPDATE',
            description: 'Update users',
            level: 'State'
        });
        console.log('✅ Created UPDATE permission:', updatePermission._id);

        const deletePermission = await Permission.create({
            name: 'USER_DELETE',
            description: 'Delete users',
            level: 'State'
        });
        console.log('✅ Created DELETE permission:', deletePermission._id);

        const managePermission = await Permission.create({
            name: 'ROLE_MANAGE',
            description: 'Manage roles',
            level: 'State'
        });
        console.log('✅ Created MANAGE permission:', managePermission._id);

        // Create role-permission assignments
        console.log('🔗 Creating role-permission assignments...');

        // Admin gets all permissions
        await RolePermission.create({ role: adminRole._id, permission: viewPermission._id });
        await RolePermission.create({ role: adminRole._id, permission: createPermission._id });
        await RolePermission.create({ role: adminRole._id, permission: updatePermission._id });
        await RolePermission.create({ role: adminRole._id, permission: deletePermission._id });
        await RolePermission.create({ role: adminRole._id, permission: managePermission._id });
        console.log('✅ Admin role assigned all permissions');

        // Manager gets most permissions
        await RolePermission.create({ role: managerRole._id, permission: viewPermission._id });
        await RolePermission.create({ role: managerRole._id, permission: createPermission._id });
        await RolePermission.create({ role: managerRole._id, permission: updatePermission._id });
        console.log('✅ Manager role assigned permissions');

        // User gets basic permissions
        await RolePermission.create({ role: userRole._id, permission: viewPermission._id });
        console.log('✅ User role assigned basic permissions');

        console.log('\n🎉 Test data created successfully!');
        console.log('Summary:');
        console.log('- 3 roles created');
        console.log('- 5 permissions created');
        console.log('- 9 role-permission assignments created');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

createTestData();
