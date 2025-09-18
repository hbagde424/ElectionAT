const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
const UserRole = require('./models/UserRole');
const RolePermission = require('./models/RolePermission');

async function setupSuperAdminPermissions() {
    try {
        const config = require('./config/config');
        await mongoose.connect(config.MONGO_URI);
        console.log('Connected to MongoDB');

        // All permissions that we defined in the menu items
        const permissionsToCreate = [
            // Core permissions
            'all.access',
            'system.admin',

            // User management
            'user_create',
            'user_read',
            'user_update',
            'user_delete',
            'user_role_assign',
            'user_role_remove',

            // Elections
            'elections.view',
            'elections.create',
            'elections.update',
            'elections.delete',
            'users.view',
            'users.create',
            'users.update',
            'users.delete',
            'permissions.view',
            'permissions.create',
            'permissions.update',
            'permissions.delete',
            'widgets.view',
            'widgets.create',
            'widgets.update',
            'widgets.delete',
            'state.view',
            'state.create',
            'state.update',
            'state.delete',
            'district.view',
            'district.create',
            'district.update',
            'district.delete',
            'assembly.view',
            'assembly.create',
            'assembly.update',
            'assembly.delete',
            'parliament.view',
            'parliament.create',
            'parliament.update',
            'parliament.delete',
            'booth.view',
            'booth.create',
            'booth.update',
            'booth.delete',
            'candidates.view',
            'candidates.create',
            'candidates.update',
            'candidates.delete',
            'votes.view',
            'votes.create',
            'votes.update',
            'votes.delete',
            // Matrix and permission management permissions
            'role_permission_manage',
            'matrix_read',
            'permission_manage',
            'user_role_assign'
        ];

        console.log('Creating permissions...');

        // Create all permissions if they don't exist
        const createdPermissions = [];
        for (const permName of permissionsToCreate) {
            let permission = await Permission.findOne({ name: permName });
            if (!permission) {
                permission = await Permission.create({
                    name: permName,
                    description: `Permission for ${permName}`,
                    level: 'State' // Default level for permissions
                });
                console.log(`Created permission: ${permName}`);
            }
            createdPermissions.push(permission);
        }

        // Find or create Super Admin role
        let superAdminRole = await Role.findOne({ name: 'superAdmin' });
        if (!superAdminRole) {
            superAdminRole = await Role.create({
                name: 'superAdmin',
                description: 'Super Administrator with full access'
            });
            console.log('Created Super Admin role');
        }

        // Assign all permissions to Super Admin role
        console.log('Assigning permissions to Super Admin role...');
        for (const permission of createdPermissions) {
            const existingRolePermission = await RolePermission.findOne({
                role: superAdminRole._id,
                permission: permission._id
            });

            if (!existingRolePermission) {
                await RolePermission.create({
                    role: superAdminRole._id,
                    permission: permission._id
                });
                console.log(`Assigned permission ${permission.name} to Super Admin role`);
            }
        }

        // Find Super Admin user
        const superAdminUser = await User.findOne({ email: 'superadmin@example.com' });
        if (!superAdminUser) {
            console.log('Super Admin user not found! Please create the user first.');
            mongoose.disconnect();
            return;
        }

        // Assign Super Admin role to user
        const existingUserRole = await UserRole.findOne({
            user: superAdminUser._id,
            role: superAdminRole._id
        });

        if (!existingUserRole) {
            await UserRole.create({
                user: superAdminUser._id,
                role: superAdminRole._id
            });
            console.log('Assigned Super Admin role to user');
        }

        // Verify the setup
        const userRoles = await UserRole.find({ user: superAdminUser._id }).populate('role');
        console.log('User roles:', userRoles.map(ur => ur.role.name));

        const rolePermissions = await RolePermission.find({ role: superAdminRole._id }).populate('permission');
        console.log(`Super Admin role has ${rolePermissions.length} permissions`);
        console.log('Sample permissions:', rolePermissions.slice(0, 5).map(rp => rp.permission.name));

        console.log('✅ Super Admin permissions setup completed successfully!');
        mongoose.disconnect();

    } catch (error) {
        console.error('Error setting up Super Admin permissions:', error);
        process.exit(1);
    }
}

setupSuperAdminPermissions();
