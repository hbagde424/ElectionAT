require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
const RolePermission = require('./models/RolePermission');

const cleanAndSeedData = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/electionAT';
        console.log('Connecting to:', mongoUri);

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to database');

        // Step 1: Clear existing data
        console.log('\n🧹 Clearing existing data...');
        await RolePermission.deleteMany({});
        console.log('✅ Cleared role-permissions');

        await Role.deleteMany({});
        console.log('✅ Cleared roles');

        await Permission.deleteMany({});
        console.log('✅ Cleared permissions');

        // Step 2: Create sample permissions
        console.log('\n📋 Creating permissions...');
        const permissionsData = [
            { name: 'USER_VIEW', description: 'View users', level: 'All' },
            { name: 'USER_CREATE', description: 'Create new users', level: 'All' },
            { name: 'USER_UPDATE', description: 'Update user information', level: 'All' },
            { name: 'USER_DELETE', description: 'Delete users', level: 'All' },
            { name: 'ROLE_VIEW', description: 'View roles', level: 'All' },
            { name: 'ROLE_CREATE', description: 'Create new roles', level: 'All' },
            { name: 'ROLE_UPDATE', description: 'Update roles', level: 'All' },
            { name: 'ROLE_DELETE', description: 'Delete roles', level: 'All' },
            { name: 'PERMISSION_VIEW', description: 'View permissions', level: 'All' },
            { name: 'PERMISSION_CREATE', description: 'Create new permissions', level: 'All' }
        ];

        const createdPermissions = await Permission.insertMany(permissionsData);
        console.log(`✅ Created ${createdPermissions.length} permissions`);

        // Step 3: Create sample roles
        console.log('\n👥 Creating roles...');
        const rolesData = [
            { name: 'Super Admin', description: 'Full system access', status: 'Active' },
            { name: 'Admin', description: 'Administrative access', status: 'Active' },
            { name: 'Manager', description: 'Management level access', status: 'Active' },
            { name: 'User', description: 'Basic user access', status: 'Active' },
            { name: 'Viewer', description: 'Read-only access', status: 'Active' }
        ];

        const createdRoles = await Role.insertMany(rolesData);
        console.log(`✅ Created ${createdRoles.length} roles`);

        // Step 4: Create some sample role-permission assignments
        console.log('\n🔗 Creating role-permission assignments...');
        const assignments = [];

        // Super Admin gets all permissions
        const superAdminRole = createdRoles.find(r => r.name === 'Super Admin');
        for (const permission of createdPermissions) {
            assignments.push({
                role: superAdminRole._id,
                permission: permission._id
            });
        }

        // Admin gets most permissions (excluding some sensitive ones)
        const adminRole = createdRoles.find(r => r.name === 'Admin');
        const adminPermissions = createdPermissions.filter(p =>
            !p.name.includes('DELETE') || p.name === 'USER_DELETE'
        );
        for (const permission of adminPermissions) {
            assignments.push({
                role: adminRole._id,
                permission: permission._id
            });
        }

        // User gets basic permissions
        const userRole = createdRoles.find(r => r.name === 'User');
        const userPermissions = createdPermissions.filter(p =>
            p.name.includes('VIEW') || p.name === 'USER_UPDATE'
        );
        for (const permission of userPermissions) {
            assignments.push({
                role: userRole._id,
                permission: permission._id
            });
        }

        const createdAssignments = await RolePermission.insertMany(assignments);
        console.log(`✅ Created ${createdAssignments.length} role-permission assignments`);

        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\nSummary:');
        console.log(`- Roles: ${createdRoles.length}`);
        console.log(`- Permissions: ${createdPermissions.length}`);
        console.log(`- Role-Permission assignments: ${createdAssignments.length}`);

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
};

cleanAndSeedData();
