const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
const RolePermission = require('./models/RolePermission');

const checkData = async () => {
    try {
        await connectDB();
        console.log('Connected to database');

        console.log('\n=== Checking Roles ===');
        const roles = await Role.find({});
        console.log(`Found ${roles.length} roles`);
        roles.forEach(role => {
            console.log(`Role: ${role.name} (ID: ${role._id})`);
        });

        console.log('\n=== Checking Permissions ===');
        const permissions = await Permission.find({});
        console.log(`Found ${permissions.length} permissions`);
        permissions.forEach(permission => {
            console.log(`Permission: ${permission.name} (ID: ${permission._id})`);
        });

        console.log('\n=== Checking Role-Permissions ===');
        const rolePermissions = await RolePermission.find({});
        console.log(`Found ${rolePermissions.length} role-permissions`);

        for (const rp of rolePermissions) {
            console.log(`RolePermission ID: ${rp._id}`);
            console.log(`  Role ID: ${rp.role}`);
            console.log(`  Permission ID: ${rp.permission}`);

            // Check if referenced role exists
            if (rp.role) {
                const role = await Role.findById(rp.role);
                if (!role) {
                    console.log(`  ❌ Role ${rp.role} not found!`);
                } else {
                    console.log(`  ✅ Role: ${role.name}`);
                }
            } else {
                console.log(`  ❌ Role is null!`);
            }

            // Check if referenced permission exists
            if (rp.permission) {
                const permission = await Permission.findById(rp.permission);
                if (!permission) {
                    console.log(`  ❌ Permission ${rp.permission} not found!`);
                } else {
                    console.log(`  ✅ Permission: ${permission.name}`);
                }
            } else {
                console.log(`  ❌ Permission is null!`);
            }
            console.log('---');
        }

        console.log('\n=== Data Integrity Check Complete ===');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkData();
