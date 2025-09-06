const mongoose = require('mongoose');
const config = require('./config/config');

// Import models
const Permission = require('./models/Permission');
const Role = require('./models/Role');
const User = require('./models/User');
const UserRole = require('./models/UserRole');
const RolePermission = require('./models/RolePermission');

async function quickCheck() {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Quick counts
        const permissionCount = await Permission.countDocuments();
        const roleCount = await Role.countDocuments();
        const userCount = await User.countDocuments();
        const userRoleCount = await UserRole.countDocuments();
        const rolePermissionCount = await RolePermission.countDocuments();

        console.log('\n📊 QUICK SYSTEM CHECK:');
        console.log(`Permissions: ${permissionCount}`);
        console.log(`Roles: ${roleCount}`);
        console.log(`Users: ${userCount}`);
        console.log(`User-Role Assignments: ${userRoleCount}`);
        console.log(`Role-Permission Assignments: ${rolePermissionCount}`);

        // Check if super admin user exists
        const superAdmin = await User.findOne({ email: 'superadmin@example.com' });
        console.log(`\nSuper Admin User: ${superAdmin ? '✅ EXISTS' : '❌ NOT FOUND'}`);

        // Check if super admin role exists
        const superAdminRole = await Role.findOne({ name: 'Super Administrator' });
        console.log(`Super Admin Role: ${superAdminRole ? '✅ EXISTS' : '❌ NOT FOUND'}`);

        if (superAdmin && superAdminRole) {
            const userRole = await UserRole.findOne({ user: superAdmin._id, role: superAdminRole._id });
            console.log(`Super Admin Role Assignment: ${userRole ? '✅ ASSIGNED' : '❌ NOT ASSIGNED'}`);

            const rolePermissions = await RolePermission.countDocuments({ role: superAdminRole._id });
            console.log(`Super Admin Permissions: ${rolePermissions}`);
        }

        // List some sample permissions
        const samplePermissions = await Permission.find({}).limit(5);
        console.log('\n📋 Sample Permissions:');
        samplePermissions.forEach(p => {
            console.log(`  - ${p.name} (${p.level}): ${p.description}`);
        });

        console.log('\n🎉 System appears to be working!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

quickCheck();
