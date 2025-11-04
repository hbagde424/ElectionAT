const mongoose = require('mongoose');
const dbConfig = require('./config/db');

// Import models
const Permission = require('../Backend/models/Permission');
const Role = require('../Backend/models/Role');
const RolePermission = require('../Backend/models/RolePermission');
const User = require('../Backend/models/User');
const UserRole = require('../Backend/models/UserRole');
const UserHierarchy = require('../Backend/models/UserHierarchy');

async function verifyPermissionSystem() {
    try {
        // Connect to database
        await mongoose.connect(dbConfig.mongoURI);
        console.log('✅ Connected to MongoDB successfully');

        // Check permissions
        console.log('\n📋 CHECKING PERMISSIONS...');
        const permissions = await Permission.find({});
        console.log(`Found ${permissions.length} permissions in database`);

        if (permissions.length > 0) {
            console.log('First 5 permissions:');
            permissions.slice(0, 5).forEach(p => {
                console.log(`  - ${p.name}: ${p.description}`);
            });
            if (permissions.length > 5) {
                console.log(`  ... and ${permissions.length - 5} more`);
            }
        }

        // Check roles
        console.log('\n👥 CHECKING ROLES...');
        const roles = await Role.find({});
        console.log(`Found ${roles.length} roles in database`);

        if (roles.length > 0) {
            for (const role of roles) {
                const rolePermissions = await RolePermission.find({ role: role._id }).populate('permission');
                console.log(`  - ${role.name}: ${rolePermissions.length} permissions`);
            }
        }

        // Check users
        console.log('\n👤 CHECKING USERS...');
        const users = await User.find({});
        console.log(`Found ${users.length} users in database`);

        for (const user of users) {
            const userRoles = await UserRole.find({ user: user._id }).populate('role');
            const userHierarchy = await UserHierarchy.findOne({ user: user._id });

            console.log(`\n  User: ${user.email}`);
            console.log(`    Roles: ${userRoles.map(ur => ur.role.name).join(', ')}`);

            if (userHierarchy) {
                console.log(`    Geographic Access: ${userHierarchy.level} - ${userHierarchy.entityName}`);
            }

            // Calculate total permissions
            let totalPermissions = 0;
            for (const userRole of userRoles) {
                const rolePermissions = await RolePermission.find({ role: userRole.role._id });
                totalPermissions += rolePermissions.length;
            }
            console.log(`    Total Permissions: ${totalPermissions}`);
        }

        // Check role-permission assignments
        console.log('\n🔗 CHECKING ROLE-PERMISSION ASSIGNMENTS...');
        const rolePermissions = await RolePermission.find({}).populate('role').populate('permission');
        console.log(`Found ${rolePermissions.length} role-permission assignments`);

        // Group by role
        const rolePermissionMap = {};
        rolePermissions.forEach(rp => {
            const roleName = rp.role.name;
            if (!rolePermissionMap[roleName]) {
                rolePermissionMap[roleName] = [];
            }
            rolePermissionMap[roleName].push(rp.permission.name);
        });

        Object.keys(rolePermissionMap).forEach(roleName => {
            console.log(`  ${roleName}: ${rolePermissionMap[roleName].length} permissions`);
        });

        // Test specific permission checks
        console.log('\n🧪 TESTING SPECIFIC PERMISSION CHECKS...');

        // Find super admin user
        const superAdminUser = await User.findOne({ email: 'superadmin@example.com' });
        if (superAdminUser) {
            const superAdminRoles = await UserRole.find({ user: superAdminUser._id }).populate('role');
            console.log(`Super Admin has ${superAdminRoles.length} roles`);

            // Get all permissions for super admin
            let superAdminPermissions = [];
            for (const userRole of superAdminRoles) {
                const rolePerms = await RolePermission.find({ role: userRole.role._id }).populate('permission');
                superAdminPermissions = superAdminPermissions.concat(rolePerms.map(rp => rp.permission.name));
            }

            // Remove duplicates
            superAdminPermissions = [...new Set(superAdminPermissions)];

            console.log(`Super Admin has ${superAdminPermissions.length} unique permissions`);
            console.log('Sample permissions:', superAdminPermissions.slice(0, 10).join(', '));

            // Check specific permissions
            const testPermissions = ['user_create', 'user_delete', 'role_create', 'state_read'];
            testPermissions.forEach(perm => {
                const hasPermission = superAdminPermissions.includes(perm);
                console.log(`  ${perm}: ${hasPermission ? '✅' : '❌'}`);
            });
        }

        console.log('\n🎉 Permission system verification complete!');
        console.log('\nSummary:');
        console.log(`- ${permissions.length} permissions defined`);
        console.log(`- ${roles.length} roles created`);
        console.log(`- ${users.length} users in system`);
        console.log(`- ${rolePermissions.length} role-permission assignments`);

    } catch (error) {
        console.error('❌ Error verifying permission system:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n📤 Disconnected from MongoDB');
    }
}

// Run verification
verifyPermissionSystem();
