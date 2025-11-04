const mongoose = require('mongoose');
const Permission = require('./models/Permission');
const Role = require('./models/Role');
const RolePermission = require('./models/RolePermission');
const UserRole = require('./models/UserRole');
const UserHierarchy = require('./models/UserHierarchy');
const User = require('./models/User');
const config = require('./config/config');

// Connect to MongoDB
const options = {
    bufferCommands: false, // Disable mongoose buffering
    serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
    socketTimeoutMS: 45000, // Close connections after 45 seconds of inactivity
    maxPoolSize: 10, // Maintain up to 10 socket connections
    heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
    retryWrites: true,
    w: 'majority'
};
await mongoose.connect(process.env.MONGO_URI, options);


async function validatePermissionSystem() {
    try {
        console.log('🔍 Validating Role and Permission System...\n');

        // 1. Check if permissions were created
        const permissionCount = await Permission.countDocuments();
        console.log(`✅ Permissions in database: ${permissionCount}`);

        // 2. Check if roles were created
        const roleCount = await Role.countDocuments();
        console.log(`✅ Roles in database: ${roleCount}`);

        // 3. Check role-permission assignments
        const rolePermissionCount = await RolePermission.countDocuments();
        console.log(`✅ Role-Permission assignments: ${rolePermissionCount}`);

        // 4. List all roles and their permission counts
        console.log('\n📋 Role Details:');
        const roles = await Role.find();
        for (const role of roles) {
            const permissionCount = await RolePermission.countDocuments({ role: role._id });
            console.log(`  - ${role.name}: ${permissionCount} permissions`);
        }

        // 5. Check for critical permissions
        const criticalPermissions = [
            'user_create', 'user_read', 'user_update', 'user_delete',
            'user_role_assign', 'user_hierarchy_assign',
            'role_create', 'role_read', 'role_update', 'role_delete',
            'permission_read', 'role_permission_assign'
        ];

        console.log('\n🔑 Critical Permissions Status:');
        for (const permName of criticalPermissions) {
            const permission = await Permission.findOne({ name: permName });
            if (permission) {
                console.log(`  ✅ ${permName}: Found`);
            } else {
                console.log(`  ❌ ${permName}: Missing`);
            }
        }

        // 6. Check users and their role assignments
        console.log('\n👥 User Role Assignments:');
        const users = await User.find().limit(5);
        for (const user of users) {
            const userRoles = await UserRole.find({ user: user._id }).populate('role');
            const userHierarchy = await UserHierarchy.findOne({ user: user._id });

            console.log(`  📧 ${user.email}:`);
            if (userRoles.length > 0) {
                userRoles.forEach(ur => {
                    console.log(`    - Role: ${ur.role.name}`);
                });
            } else {
                console.log(`    - No roles assigned`);
            }

            if (userHierarchy) {
                console.log(`    - Geographic access: ${JSON.stringify(userHierarchy, null, 2)}`);
            } else {
                console.log(`    - No geographic restrictions`);
            }
        }

        // 7. Test permission checking function
        console.log('\n🧪 Testing Permission Functions:');

        // Test Super Admin permissions
        const superAdmin = await User.findOne({ email: 'superadmin@example.com' });
        if (superAdmin) {
            const superAdminRoles = await UserRole.find({ user: superAdmin._id }).populate('role');
            console.log(`  👑 Super Admin (${superAdmin.email}):`);
            console.log(`    - Roles: ${superAdminRoles.map(ur => ur.role.name).join(', ')}`);

            // Check if Super Admin has admin role
            const adminRole = superAdminRoles.find(ur => ur.role.name.includes('Super'));
            if (adminRole) {
                const adminPermissions = await RolePermission.find({ role: adminRole.role._id }).populate('permission');
                console.log(`    - Permissions: ${adminPermissions.length} permissions assigned`);
            }
        }

        // 8. Validate role hierarchy
        console.log('\n🏗️  Role Hierarchy Validation:');
        const hierarchyRoles = [
            'Super Administrator',
            'State Administrator',
            'Division Administrator',
            'Parliament Administrator',
            'Assembly Administrator',
            'Block Administrator',
            'Booth Administrator'
        ];

        for (const roleName of hierarchyRoles) {
            const role = await Role.findOne({ name: roleName });
            const permissionCount = role ? await RolePermission.countDocuments({ role: role._id }) : 0;

            if (role) {
                console.log(`  ✅ ${roleName}: ${permissionCount} permissions`);
            } else {
                console.log(`  ❌ ${roleName}: Role not found`);
            }
        }

        // 9. Check for any duplicate permissions
        console.log('\n🔍 Checking for Duplicates:');
        const duplicatePermissions = await Permission.aggregate([
            { $group: { _id: '$name', count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        if (duplicatePermissions.length > 0) {
            console.log('  ⚠️  Duplicate permissions found:');
            duplicatePermissions.forEach(dup => {
                console.log(`    - ${dup._id}: ${dup.count} instances`);
            });
        } else {
            console.log('  ✅ No duplicate permissions found');
        }

        // 10. System recommendations
        console.log('\n💡 System Recommendations:');

        if (permissionCount < 50) {
            console.log('  ⚠️  Consider adding more granular permissions for better security');
        } else {
            console.log('  ✅ Good permission granularity');
        }

        if (roleCount < 5) {
            console.log('  ⚠️  Consider creating more role types for different user levels');
        } else {
            console.log('  ✅ Good role variety');
        }

        const userCount = await User.countDocuments();
        const usersWithRoles = await UserRole.distinct('user');
        const usersWithoutRoles = userCount - usersWithRoles.length;

        if (usersWithoutRoles > 0) {
            console.log(`  ⚠️  ${usersWithoutRoles} users without role assignments`);
        } else {
            console.log('  ✅ All users have role assignments');
        }

        console.log('\n🎉 Validation completed!');

        // Summary
        console.log('\n📊 SUMMARY:');
        console.log(`Permissions: ${permissionCount}`);
        console.log(`Roles: ${roleCount}`);
        console.log(`Role-Permission Assignments: ${rolePermissionCount}`);
        console.log(`Users: ${userCount}`);
        console.log(`Users with Roles: ${usersWithRoles.length}`);

    } catch (error) {
        console.error('❌ Validation failed:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run validation
validatePermissionSystem();
