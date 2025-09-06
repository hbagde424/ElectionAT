const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../Backend/models/User');
const Role = require('../Backend/models/Role');
const UserRole = require('../Backend/models/UserRole');
const Permission = require('../Backend/models/Permission');
const RolePermission = require('../Backend/models/RolePermission');
const config = require('../Backend/config/config');

// Connect to MongoDB
mongoose.connect(config.MONGO_URI);

// Comprehensive permission set for election management system
const allPermissions = [
    // User Management Permissions (State level - highest administrative level)
    { name: 'user_create', description: 'Create new users', category: 'User Management', level: 'State' },
    { name: 'user_read', description: 'View user information', category: 'User Management', level: 'Booth' },
    { name: 'user_update', description: 'Update user information', category: 'User Management', level: 'Division' },
    { name: 'user_delete', description: 'Delete users', category: 'User Management', level: 'State' },
    { name: 'user_role_assign', description: 'Assign roles to users', category: 'User Management', level: 'State' },
    { name: 'user_role_remove', description: 'Remove roles from users', category: 'User Management', level: 'State' },
    { name: 'user_hierarchy_assign', description: 'Assign geographic access to users', category: 'User Management', level: 'State' },
    { name: 'user_hierarchy_remove', description: 'Remove geographic access from users', category: 'User Management', level: 'State' },

    // Role Management Permissions (State level - system administration)
    { name: 'role_create', description: 'Create new roles', category: 'Role Management', level: 'State' },
    { name: 'role_read', description: 'View role information', category: 'Role Management', level: 'Division' },
    { name: 'role_update', description: 'Update role information', category: 'Role Management', level: 'State' },
    { name: 'role_delete', description: 'Delete roles', category: 'Role Management', level: 'State' },

    // Permission Management (State level - highest security)
    { name: 'permission_create', description: 'Create new permissions', category: 'Permission Management', level: 'State' },
    { name: 'permission_read', description: 'View permission information', category: 'Permission Management', level: 'Division' },
    { name: 'permission_update', description: 'Update permission information', category: 'Permission Management', level: 'State' },
    { name: 'permission_delete', description: 'Delete permissions', category: 'Permission Management', level: 'State' },
    { name: 'role_permission_assign', description: 'Assign permissions to roles', category: 'Permission Management', level: 'State' },
    { name: 'role_permission_remove', description: 'Remove permissions from roles', category: 'Permission Management', level: 'State' },
    { name: 'role_permission_matrix_view', description: 'View role-permission matrix', category: 'Permission Management', level: 'Division' },

    // Geographic Entity Permissions (respective levels)
    { name: 'state_create', description: 'Create states', category: 'Geographic Management', level: 'State' },
    { name: 'state_read', description: 'View state information', category: 'Geographic Management', level: 'State' },
    { name: 'state_update', description: 'Update state information', category: 'Geographic Management', level: 'State' },
    { name: 'state_delete', description: 'Delete states', category: 'Geographic Management', level: 'State' },

    { name: 'division_create', description: 'Create divisions', category: 'Geographic Management', level: 'State' },
    { name: 'division_read', description: 'View division information', category: 'Geographic Management', level: 'Division' },
    { name: 'division_update', description: 'Update division information', category: 'Geographic Management', level: 'Division' },
    { name: 'division_delete', description: 'Delete divisions', category: 'Geographic Management', level: 'State' },

    { name: 'parliament_create', description: 'Create parliament constituencies', category: 'Geographic Management', level: 'State' },
    { name: 'parliament_read', description: 'View parliament information', category: 'Geographic Management', level: 'Parliament' },
    { name: 'parliament_update', description: 'Update parliament information', category: 'Geographic Management', level: 'Parliament' },
    { name: 'parliament_delete', description: 'Delete parliament constituencies', category: 'Geographic Management', level: 'State' },

    { name: 'assembly_create', description: 'Create assembly constituencies', category: 'Geographic Management', level: 'Division' },
    { name: 'assembly_read', description: 'View assembly information', category: 'Geographic Management', level: 'Assembly' },
    { name: 'assembly_update', description: 'Update assembly information', category: 'Geographic Management', level: 'Assembly' },
    { name: 'assembly_delete', description: 'Delete assembly constituencies', category: 'Geographic Management', level: 'Division' },

    { name: 'block_create', description: 'Create blocks', category: 'Geographic Management', level: 'Assembly' },
    { name: 'block_read', description: 'View block information', category: 'Geographic Management', level: 'Block' },
    { name: 'block_update', description: 'Update block information', category: 'Geographic Management', level: 'Block' },
    { name: 'block_delete', description: 'Delete blocks', category: 'Geographic Management', level: 'Assembly' },

    { name: 'booth_create', description: 'Create booths', category: 'Geographic Management', level: 'Block' },
    { name: 'booth_read', description: 'View booth information', category: 'Geographic Management', level: 'Booth' },
    { name: 'booth_update', description: 'Update booth information', category: 'Geographic Management', level: 'Booth' },
    { name: 'booth_delete', description: 'Delete booths', category: 'Geographic Management', level: 'Block' },

    // Election Data Permissions (booth level for granular control)
    { name: 'candidate_create', description: 'Create candidate records', category: 'Election Management', level: 'Assembly' },
    { name: 'candidate_read', description: 'View candidate information', category: 'Election Management', level: 'Booth' },
    { name: 'candidate_update', description: 'Update candidate information', category: 'Election Management', level: 'Assembly' },
    { name: 'candidate_delete', description: 'Delete candidate records', category: 'Election Management', level: 'Division' },

    { name: 'party_create', description: 'Create party records', category: 'Election Management', level: 'State' },
    { name: 'party_read', description: 'View party information', category: 'Election Management', level: 'Booth' },
    { name: 'party_update', description: 'Update party information', category: 'Election Management', level: 'Division' },
    { name: 'party_delete', description: 'Delete party records', category: 'Election Management', level: 'State' },

    { name: 'voter_create', description: 'Create voter records', category: 'Election Management', level: 'Booth' },
    { name: 'voter_read', description: 'View voter information', category: 'Election Management', level: 'Booth' },
    { name: 'voter_update', description: 'Update voter information', category: 'Election Management', level: 'Booth' },
    { name: 'voter_delete', description: 'Delete voter records', category: 'Election Management', level: 'Block' },

    { name: 'election_data_read', description: 'View election data', category: 'Election Management', level: 'Booth' },
    { name: 'election_data_update', description: 'Update election data', category: 'Election Management', level: 'Block' },
    { name: 'election_data_delete', description: 'Delete election data', category: 'Election Management', level: 'Assembly' },

    // Survey Permissions (flexible levels based on survey scope)
    { name: 'survey_create', description: 'Create surveys', category: 'Survey Management', level: 'Block' },
    { name: 'survey_read', description: 'View survey data', category: 'Survey Management', level: 'Booth' },
    { name: 'survey_update', description: 'Update survey data', category: 'Survey Management', level: 'Block' },
    { name: 'survey_delete', description: 'Delete surveys', category: 'Survey Management', level: 'Assembly' },

    // Report Permissions (division level for broader access)
    { name: 'report_read', description: 'View reports', category: 'Reports & Analytics', level: 'Booth' },
    { name: 'report_generate', description: 'Generate reports', category: 'Reports & Analytics', level: 'Block' },
    { name: 'report_export', description: 'Export reports', category: 'Reports & Analytics', level: 'Assembly' },

    // Analytics Permissions (higher levels for strategic insights)
    { name: 'analytics_read', description: 'View analytics', category: 'Reports & Analytics', level: 'Block' },
    { name: 'analytics_advanced', description: 'Access advanced analytics', category: 'Reports & Analytics', level: 'Division' },

    // System Permissions (state level for security)
    { name: 'system_settings_read', description: 'View system settings', category: 'System Administration', level: 'Division' },
    { name: 'system_settings_update', description: 'Update system settings', category: 'System Administration', level: 'State' },
    { name: 'system_backup', description: 'Create system backups', category: 'System Administration', level: 'State' },
    { name: 'system_restore', description: 'Restore system from backup', category: 'System Administration', level: 'State' },

    // Audit Permissions (high level for oversight)
    { name: 'audit_log_read', description: 'View audit logs', category: 'System Administration', level: 'Division' },
    { name: 'audit_log_export', description: 'Export audit logs', category: 'System Administration', level: 'State' }
];

// Role definitions with specific permissions
const roleDefinitions = [
    {
        name: 'Super Administrator',
        description: 'Full system access with all permissions',
        permissions: 'ALL' // Special case - gets all permissions
    },
    {
        name: 'Manager',
        description: 'Management level access with broad permissions',
        permissions: [
            // User management (limited)
            'user_read', 'user_update', 'user_role_assign', 'user_hierarchy_assign',

            // Role and permission viewing
            'role_read', 'permission_read', 'role_permission_matrix_view',

            // Geographic management
            'state_read', 'state_update',
            'division_create', 'division_read', 'division_update', 'division_delete',
            'parliament_create', 'parliament_read', 'parliament_update', 'parliament_delete',
            'assembly_create', 'assembly_read', 'assembly_update', 'assembly_delete',
            'block_create', 'block_read', 'block_update', 'block_delete',
            'booth_create', 'booth_read', 'booth_update', 'booth_delete',

            // Election management
            'candidate_create', 'candidate_read', 'candidate_update', 'candidate_delete',
            'party_create', 'party_read', 'party_update', 'party_delete',
            'voter_create', 'voter_read', 'voter_update', 'voter_delete',
            'election_data_read', 'election_data_update',

            // Survey management
            'survey_create', 'survey_read', 'survey_update', 'survey_delete',

            // Reports and analytics
            'report_read', 'report_generate', 'report_export',
            'analytics_read', 'analytics_advanced',

            // Basic system access
            'system_settings_read', 'audit_log_read'
        ]
    },
    {
        name: 'User',
        description: 'Standard user with limited permissions',
        permissions: [
            // Basic viewing permissions
            'user_read',

            // Geographic viewing
            'state_read', 'division_read', 'parliament_read', 'assembly_read', 'block_read', 'booth_read',

            // Election data (limited)
            'candidate_read', 'party_read', 'voter_read', 'election_data_read',

            // Survey participation
            'survey_read', 'survey_create',

            // Basic reports
            'report_read', 'analytics_read'
        ]
    },
    {
        name: 'Data Entry Operator',
        description: 'Data entry focused role with specific permissions',
        permissions: [
            // Basic viewing
            'user_read',

            // Geographic viewing
            'booth_read', 'block_read', 'assembly_read',

            // Data entry permissions
            'voter_create', 'voter_read', 'voter_update',
            'candidate_read', 'party_read',
            'survey_create', 'survey_read', 'survey_update',
            'election_data_read',

            // Basic reports
            'report_read'
        ]
    },
    {
        name: 'Analyst',
        description: 'Analytics and reporting focused role',
        permissions: [
            // Viewing permissions for analysis
            'user_read',
            'state_read', 'division_read', 'parliament_read', 'assembly_read', 'block_read', 'booth_read',
            'candidate_read', 'party_read', 'voter_read', 'election_data_read',
            'survey_read',

            // Full reporting and analytics
            'report_read', 'report_generate', 'report_export',
            'analytics_read', 'analytics_advanced',

            // Audit access
            'audit_log_read'
        ]
    }
];

async function setupPermissionsAndRoles() {
    try {
        console.log('🚀 Setting up comprehensive permissions and roles...\n');

        // 1. Create all permissions
        console.log('📝 Creating permissions...');
        const createdPermissions = {};

        for (const perm of allPermissions) {
            const existingPermission = await Permission.findOne({ name: perm.name });
            if (!existingPermission) {
                const newPermission = await Permission.create(perm);
                createdPermissions[perm.name] = newPermission._id;
                console.log(`   ✅ Created permission: ${perm.name}`);
            } else {
                createdPermissions[perm.name] = existingPermission._id;
                console.log(`   ℹ️  Permission already exists: ${perm.name}`);
            }
        }

        console.log(`\n📊 Total permissions created/verified: ${allPermissions.length}\n`);

        // 2. Create roles and assign permissions
        console.log('🔑 Creating roles and assigning permissions...');

        for (const roleDef of roleDefinitions) {
            let role = await Role.findOne({ name: roleDef.name });

            if (!role) {
                role = await Role.create({
                    name: roleDef.name,
                    description: roleDef.description
                });
                console.log(`   ✅ Created role: ${roleDef.name}`);
            } else {
                console.log(`   ℹ️  Role already exists: ${roleDef.name}`);
            }

            // Clear existing role permissions for clean assignment
            await RolePermission.deleteMany({ role: role._id });

            // Assign permissions to role
            const permissionsToAssign = roleDef.permissions === 'ALL'
                ? Object.values(createdPermissions)
                : roleDef.permissions.map(permName => createdPermissions[permName]).filter(Boolean);

            for (const permissionId of permissionsToAssign) {
                await RolePermission.create({
                    role: role._id,
                    permission: permissionId
                });
            }

            console.log(`   🔗 Assigned ${permissionsToAssign.length} permissions to ${roleDef.name}`);
        }

        // 3. Create test users if they don't exist
        console.log('\n👥 Creating test users...');

        const testUsers = [
            {
                firstName: 'Super',
                lastName: 'Admin',
                email: 'superadmin@example.com',
                username: 'superadmin',
                password: await bcrypt.hash('password123', 10),
                roleName: 'Super Administrator'
            },
            {
                firstName: 'Manager',
                lastName: 'User',
                email: 'manager@example.com',
                username: 'manager',
                password: await bcrypt.hash('password123', 10),
                roleName: 'Manager'
            },
            {
                firstName: 'Regular',
                lastName: 'User',
                email: 'user@example.com',
                username: 'user',
                password: await bcrypt.hash('password123', 10),
                roleName: 'User'
            },
            {
                firstName: 'Data Entry',
                lastName: 'Operator',
                email: 'dataentry@example.com',
                username: 'dataentry',
                password: await bcrypt.hash('password123', 10),
                roleName: 'Data Entry Operator'
            },
            {
                firstName: 'Data',
                lastName: 'Analyst',
                email: 'analyst@example.com',
                username: 'analyst',
                password: await bcrypt.hash('password123', 10),
                roleName: 'Analyst'
            }
        ];

        for (const userData of testUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                const user = await User.create({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    username: userData.username,
                    password: userData.password
                });

                // Assign role to user
                const role = await Role.findOne({ name: userData.roleName });
                if (role) {
                    await UserRole.create({
                        user: user._id,
                        role: role._id
                    });
                    console.log(`   ✅ Created user: ${userData.email} with role: ${userData.roleName}`);
                }
            } else {
                console.log(`   ℹ️  User already exists: ${userData.email}`);

                // Ensure role assignment exists
                const role = await Role.findOne({ name: userData.roleName });
                const existingUserRole = await UserRole.findOne({
                    user: existingUser._id,
                    role: role._id
                });

                if (!existingUserRole && role) {
                    await UserRole.create({
                        user: existingUser._id,
                        role: role._id
                    });
                    console.log(`   🔗 Assigned role ${userData.roleName} to existing user: ${userData.email}`);
                }
            }
        }

        // 4. Verification summary
        console.log('\n✅ Setup completed successfully!\n');

        const totalPermissions = await Permission.countDocuments();
        const totalRoles = await Role.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalUserRoles = await UserRole.countDocuments();
        const totalRolePermissions = await RolePermission.countDocuments();

        console.log('📊 SETUP SUMMARY:');
        console.log('='.repeat(50));
        console.log(`Permissions created: ${totalPermissions}`);
        console.log(`Roles created: ${totalRoles}`);
        console.log(`Users created: ${totalUsers}`);
        console.log(`User-Role assignments: ${totalUserRoles}`);
        console.log(`Role-Permission assignments: ${totalRolePermissions}`);

        console.log('\n🔑 TEST USER CREDENTIALS:');
        console.log('='.repeat(50));
        testUsers.forEach(user => {
            console.log(`${user.roleName}: ${user.email} / password123`);
        });

        console.log('\n💡 ROLE CAPABILITIES:');
        console.log('='.repeat(50));
        console.log('Super Administrator: Full system access (all permissions)');
        console.log('Manager: Broad management access with user management');
        console.log('User: Standard user with read access and basic operations');
        console.log('Data Entry Operator: Focused on data entry tasks');
        console.log('Analyst: Full reporting and analytics access');

        console.log('\n🎉 Your election management system is now ready with comprehensive role-based access control!');

    } catch (error) {
        console.error('❌ Error setting up permissions and roles:', error);
        process.exit(1);
    } finally {
        mongoose.connection.close();
    }
}

// Run the setup
setupPermissionsAndRoles();
