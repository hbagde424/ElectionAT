// setupSuperAdmin.js - Create Super Admin with full permissions
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
const UserRole = require('./models/UserRole');
const RolePermission = require('./models/RolePermission');

const setupSuperAdmin = async () => {
    try {
        console.log('🚀 Setting up Super Admin account...\n');

        await connectDB();
        console.log('✅ Connected to database\n');

        // Step 1: Create or update Super Admin role
        console.log('1. Setting up Super Admin role...');
        let superAdminRole = await Role.findOne({ name: 'Super Admin' });

        if (!superAdminRole) {
            superAdminRole = await Role.create({
                name: 'Super Admin',
                description: 'Super Administrator with full system access',
                isActive: true
            });
            console.log('✅ Created Super Admin role');
        } else {
            console.log('✅ Super Admin role already exists');
        }

        // Step 2: Create all necessary permissions
        console.log('\n2. Setting up permissions...');
        const permissionsToCreate = [
            // User Management
            { name: 'users.view', description: 'View users', module: 'Users' },
            { name: 'users.create', description: 'Create users', module: 'Users' },
            { name: 'users.edit', description: 'Edit users', module: 'Users' },
            { name: 'users.delete', description: 'Delete users', module: 'Users' },

            // Role Management
            { name: 'roles.view', description: 'View roles', module: 'Roles' },
            { name: 'roles.create', description: 'Create roles', module: 'Roles' },
            { name: 'roles.edit', description: 'Edit roles', module: 'Roles' },
            { name: 'roles.delete', description: 'Delete roles', module: 'Roles' },

            // Permission Management
            { name: 'permissions.view', description: 'View permissions', module: 'Permissions' },
            { name: 'permissions.create', description: 'Create permissions', module: 'Permissions' },
            { name: 'permissions.edit', description: 'Edit permissions', module: 'Permissions' },
            { name: 'permissions.delete', description: 'Delete permissions', module: 'Permissions' },

            // Dashboard Access
            { name: 'dashboard.view', description: 'View dashboard', module: 'Dashboard' },
            { name: 'dashboard.analytics', description: 'View analytics', module: 'Dashboard' },

            // Election Data
            { name: 'elections.view', description: 'View election data', module: 'Elections' },
            { name: 'elections.create', description: 'Create election data', module: 'Elections' },
            { name: 'elections.edit', description: 'Edit election data', module: 'Elections' },
            { name: 'elections.delete', description: 'Delete election data', module: 'Elections' },

            // Candidates
            { name: 'candidates.view', description: 'View candidates', module: 'Candidates' },
            { name: 'candidates.create', description: 'Create candidates', module: 'Candidates' },
            { name: 'candidates.edit', description: 'Edit candidates', module: 'Candidates' },
            { name: 'candidates.delete', description: 'Delete candidates', module: 'Candidates' },

            // Booths
            { name: 'booths.view', description: 'View booths', module: 'Booths' },
            { name: 'booths.create', description: 'Create booths', module: 'Booths' },
            { name: 'booths.edit', description: 'Edit booths', module: 'Booths' },
            { name: 'booths.delete', description: 'Delete booths', module: 'Booths' },

            // Assembly
            { name: 'assembly.view', description: 'View assembly data', module: 'Assembly' },
            { name: 'assembly.create', description: 'Create assembly data', module: 'Assembly' },
            { name: 'assembly.edit', description: 'Edit assembly data', module: 'Assembly' },
            { name: 'assembly.delete', description: 'Delete assembly data', module: 'Assembly' },

            // Reports
            { name: 'reports.view', description: 'View reports', module: 'Reports' },
            { name: 'reports.create', description: 'Create reports', module: 'Reports' },
            { name: 'reports.export', description: 'Export reports', module: 'Reports' },

            // System Settings
            { name: 'settings.view', description: 'View system settings', module: 'Settings' },
            { name: 'settings.edit', description: 'Edit system settings', module: 'Settings' },

            // Super Admin permissions
            { name: 'system.admin', description: 'Full system administration', module: 'System' },
            { name: 'all.access', description: 'Access to all features', module: 'System' }
        ];

        const createdPermissions = [];
        for (const permData of permissionsToCreate) {
            let permission = await Permission.findOne({ name: permData.name });
            if (!permission) {
                permission = await Permission.create(permData);
                console.log(`  ✅ Created permission: ${permData.name}`);
            }
            createdPermissions.push(permission);
        }

        // Step 3: Assign all permissions to Super Admin role
        console.log('\n3. Assigning permissions to Super Admin role...');

        // Clear existing role permissions for Super Admin
        await RolePermission.deleteMany({ role: superAdminRole._id });

        // Create role-permission assignments
        for (const permission of createdPermissions) {
            await RolePermission.create({
                role: superAdminRole._id,
                permission: permission._id
            });
        }
        console.log(`✅ Assigned ${createdPermissions.length} permissions to Super Admin role`);

        // Step 4: Create Super Admin user
        console.log('\n4. Creating Super Admin user...');

        // Check if super admin user already exists
        let superAdminUser = await User.findOne({ email: 'superadmin@example.com' });

        if (superAdminUser) {
            console.log('⚠️  Super Admin user already exists, updating...');
            // Update password and ensure it's active
            const hashedPassword = await bcrypt.hash('superadmin@123', 10);
            superAdminUser.password = hashedPassword;
            superAdminUser.isActive = true;
            superAdminUser.role = 'superAdmin';
            await superAdminUser.save();
            console.log('✅ Updated existing Super Admin user');
        } else {
            // Create new super admin user
            const hashedPassword = await bcrypt.hash('superadmin@123', 10);

            superAdminUser = await User.create({
                username: 'superadmin',
                email: 'superadmin@example.com',
                password: hashedPassword,
                mobile: '9999999999',
                role: 'superAdmin',
                isActive: true
            });
            console.log('✅ Created new Super Admin user');
        }

        // Step 5: Assign Super Admin role to user
        console.log('\n5. Assigning Super Admin role to user...');

        // Clear existing user roles
        await UserRole.deleteMany({ user: superAdminUser._id });

        // Assign Super Admin role
        await UserRole.create({
            user: superAdminUser._id,
            role: superAdminRole._id
        });
        console.log('✅ Assigned Super Admin role to user');

        // Step 6: Verify setup
        console.log('\n6. Verifying setup...');

        const userWithRole = await User.findById(superAdminUser._id);
        const userRoles = await UserRole.find({ user: superAdminUser._id }).populate('role');
        const rolePermissions = await RolePermission.find({ role: superAdminRole._id }).populate('permission');

        console.log('📋 Super Admin User Details:');
        console.log(`  • ID: ${userWithRole._id}`);
        console.log(`  • Username: ${userWithRole.username}`);
        console.log(`  • Email: ${userWithRole.email}`);
        console.log(`  • Role: ${userWithRole.role}`);
        console.log(`  • Active: ${userWithRole.isActive}`);
        console.log(`  • Assigned Roles: ${userRoles.length}`);
        console.log(`  • Total Permissions: ${rolePermissions.length}`);

        // Test password
        const passwordTest = await userWithRole.comparePassword('superadmin@123');
        console.log(`  • Password Test: ${passwordTest ? 'PASS' : 'FAIL'}`);

        await mongoose.connection.close();
        console.log('\n🎉 Super Admin setup completed successfully!');
        console.log('\n📝 Login Credentials:');
        console.log('Email: superadmin@example.com');
        console.log('Password: superadmin@123');
        console.log('\n🔐 This account has full access to:');
        console.log('• All sidebar menus and options');
        console.log('• User management (view, create, edit, delete)');
        console.log('• Role and permission management');
        console.log('• System settings and configuration');
        console.log('• All election data and reports');
        console.log('• Full CRUD operations on all modules');

    } catch (error) {
        console.error('❌ Setup failed:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
};

setupSuperAdmin();
