const mongoose = require('mongoose');
const Permission = require('./models/Permission');
const Role = require('./models/Role');
const RolePermission = require('./models/RolePermission');

async function addMatrixPermissions() {
    try {
        await mongoose.connect('mongodb://localhost:27017/electionat');
        console.log('Connected to MongoDB');

        // Matrix-specific permissions to create
        const matrixPermissions = [
            {
                name: 'role_permission_manage',
                description: 'Permission to manage role-permission assignments',
                level: 'State'
            },
            {
                name: 'matrix_read',
                description: 'Permission to view role-permission matrix',
                level: 'State'
            },
            {
                name: 'permission_manage',
                description: 'Permission to manage permissions (create, update, delete)',
                level: 'State'
            },
            {
                name: 'user_role_assign',
                description: 'Permission to assign roles to users',
                level: 'State'
            }
        ];

        console.log('Creating matrix permissions...');

        // Create permissions if they don't exist
        const createdPermissions = [];
        for (const permData of matrixPermissions) {
            let permission = await Permission.findOne({ name: permData.name });
            if (!permission) {
                permission = await Permission.create(permData);
                console.log(`✅ Created permission: ${permData.name}`);
            } else {
                console.log(`ℹ️  Permission already exists: ${permData.name}`);
            }
            createdPermissions.push(permission);
        }

        // Find Super Admin role
        const superAdminRole = await Role.findOne({ name: 'superAdmin' });
        if (superAdminRole) {
            console.log('Assigning permissions to Super Admin role...');

            // Assign all created permissions to Super Admin
            for (const permission of createdPermissions) {
                const existingAssignment = await RolePermission.findOne({
                    role: superAdminRole._id,
                    permission: permission._id
                });

                if (!existingAssignment) {
                    await RolePermission.create({
                        role: superAdminRole._id,
                        permission: permission._id
                    });
                    console.log(`✅ Assigned ${permission.name} to Super Admin`);
                } else {
                    console.log(`ℹ️  Permission ${permission.name} already assigned to Super Admin`);
                }
            }
        } else {
            console.log('⚠️  Super Admin role not found');
        }

        console.log('Matrix permissions setup completed!');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up matrix permissions:', error);
        process.exit(1);
    }
}

addMatrixPermissions();
