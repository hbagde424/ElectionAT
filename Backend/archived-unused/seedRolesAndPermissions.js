const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Role = require('./models/Role');
const Permission = require('./models/Permission');
const RolePermission = require('./models/RolePermission');

const seedRolesAndPermissions = async () => {
    try {
        await connectDB();
        console.log('Connected to database');

        // Clear existing data
        await RolePermission.deleteMany({});
        await Role.deleteMany({});
        await Permission.deleteMany({});
        console.log('Cleared existing roles and permissions');

        // Create Permissions
        const permissions = [
            // User Management
            { name: 'USER_VIEW', description: 'View users' },
            { name: 'USER_CREATE', description: 'Create new users' },
            { name: 'USER_UPDATE', description: 'Update user information' },
            { name: 'USER_DELETE', description: 'Delete users' },

            // Role Management
            { name: 'ROLE_VIEW', description: 'View roles' },
            { name: 'ROLE_CREATE', description: 'Create new roles' },
            { name: 'ROLE_UPDATE', description: 'Update roles' },
            { name: 'ROLE_DELETE', description: 'Delete roles' },
            { name: 'ROLE_ASSIGN', description: 'Assign roles to users' },

            // Permission Management
            { name: 'PERMISSION_VIEW', description: 'View permissions' },
            { name: 'PERMISSION_CREATE', description: 'Create new permissions' },
            { name: 'PERMISSION_UPDATE', description: 'Update permissions' },
            { name: 'PERMISSION_DELETE', description: 'Delete permissions' },

            // Geographic Data Management
            { name: 'STATE_VIEW', description: 'View state data' },
            { name: 'STATE_CREATE', description: 'Create state data' },
            { name: 'STATE_UPDATE', description: 'Update state data' },
            { name: 'STATE_DELETE', description: 'Delete state data' },

            { name: 'DIVISION_VIEW', description: 'View division data' },
            { name: 'DIVISION_CREATE', description: 'Create division data' },
            { name: 'DIVISION_UPDATE', description: 'Update division data' },
            { name: 'DIVISION_DELETE', description: 'Delete division data' },

            { name: 'PARLIAMENT_VIEW', description: 'View parliament data' },
            { name: 'PARLIAMENT_CREATE', description: 'Create parliament data' },
            { name: 'PARLIAMENT_UPDATE', description: 'Update parliament data' },
            { name: 'PARLIAMENT_DELETE', description: 'Delete parliament data' },

            { name: 'ASSEMBLY_VIEW', description: 'View assembly data' },
            { name: 'ASSEMBLY_CREATE', description: 'Create assembly data' },
            { name: 'ASSEMBLY_UPDATE', description: 'Update assembly data' },
            { name: 'ASSEMBLY_DELETE', description: 'Delete assembly data' },

            { name: 'BLOCK_VIEW', description: 'View block data' },
            { name: 'BLOCK_CREATE', description: 'Create block data' },
            { name: 'BLOCK_UPDATE', description: 'Update block data' },
            { name: 'BLOCK_DELETE', description: 'Delete block data' },

            { name: 'BOOTH_VIEW', description: 'View booth data' },
            { name: 'BOOTH_CREATE', description: 'Create booth data' },
            { name: 'BOOTH_UPDATE', description: 'Update booth data' },
            { name: 'BOOTH_DELETE', description: 'Delete booth data' },

            // Election Data Management
            { name: 'CANDIDATE_VIEW', description: 'View candidate data' },
            { name: 'CANDIDATE_CREATE', description: 'Create candidate data' },
            { name: 'CANDIDATE_UPDATE', description: 'Update candidate data' },
            { name: 'CANDIDATE_DELETE', description: 'Delete candidate data' },

            { name: 'PARTY_VIEW', description: 'View party data' },
            { name: 'PARTY_CREATE', description: 'Create party data' },
            { name: 'PARTY_UPDATE', description: 'Update party data' },
            { name: 'PARTY_DELETE', description: 'Delete party data' },

            { name: 'VOTE_VIEW', description: 'View voting data' },
            { name: 'VOTE_CREATE', description: 'Create voting data' },
            { name: 'VOTE_UPDATE', description: 'Update voting data' },
            { name: 'VOTE_DELETE', description: 'Delete voting data' },

            // Reports and Analytics
            { name: 'REPORTS_VIEW', description: 'View reports and analytics' },
            { name: 'REPORTS_EXPORT', description: 'Export reports' },

            // System Administration
            { name: 'SYSTEM_ADMIN', description: 'Full system administration access' }
        ];

        const createdPermissions = await Permission.insertMany(permissions);
        console.log(`Created ${createdPermissions.length} permissions`);

        // Create Roles
        const roles = [
            {
                name: 'Super Admin',
                description: 'Full system access with all permissions',
                level: 'system'
            },
            {
                name: 'State Administrator',
                description: 'Administrative access at state level',
                level: 'state'
            },
            {
                name: 'Division Coordinator',
                description: 'Coordinative access at division level',
                level: 'division'
            },
            {
                name: 'Parliament Manager',
                description: 'Management access at parliament level',
                level: 'parliament'
            },
            {
                name: 'Assembly Supervisor',
                description: 'Supervisory access at assembly level',
                level: 'assembly'
            },
            {
                name: 'Block Officer',
                description: 'Officer access at block level',
                level: 'block'
            },
            {
                name: 'Booth Agent',
                description: 'Agent access at booth level',
                level: 'booth'
            },
            {
                name: 'Data Entry Operator',
                description: 'Basic data entry permissions',
                level: 'booth'
            },
            {
                name: 'Viewer',
                description: 'Read-only access to data',
                level: 'booth'
            }
        ];

        const createdRoles = await Role.insertMany(roles);
        console.log(`Created ${createdRoles.length} roles`);

        // Assign permissions to roles
        const rolePermissionMappings = [
            // Super Admin - All permissions
            {
                role: 'Super Admin',
                permissions: createdPermissions.map(p => p.name)
            },

            // State Administrator
            {
                role: 'State Administrator',
                permissions: [
                    'USER_VIEW', 'USER_CREATE', 'USER_UPDATE',
                    'ROLE_VIEW', 'ROLE_ASSIGN',
                    'STATE_VIEW', 'STATE_UPDATE',
                    'DIVISION_VIEW', 'DIVISION_CREATE', 'DIVISION_UPDATE', 'DIVISION_DELETE',
                    'PARLIAMENT_VIEW', 'PARLIAMENT_CREATE', 'PARLIAMENT_UPDATE', 'PARLIAMENT_DELETE',
                    'ASSEMBLY_VIEW', 'ASSEMBLY_CREATE', 'ASSEMBLY_UPDATE', 'ASSEMBLY_DELETE',
                    'BLOCK_VIEW', 'BLOCK_CREATE', 'BLOCK_UPDATE', 'BLOCK_DELETE',
                    'BOOTH_VIEW', 'BOOTH_CREATE', 'BOOTH_UPDATE', 'BOOTH_DELETE',
                    'CANDIDATE_VIEW', 'CANDIDATE_CREATE', 'CANDIDATE_UPDATE', 'CANDIDATE_DELETE',
                    'PARTY_VIEW', 'PARTY_CREATE', 'PARTY_UPDATE', 'PARTY_DELETE',
                    'VOTE_VIEW', 'VOTE_CREATE', 'VOTE_UPDATE', 'VOTE_DELETE',
                    'REPORTS_VIEW', 'REPORTS_EXPORT'
                ]
            },

            // Division Coordinator
            {
                role: 'Division Coordinator',
                permissions: [
                    'USER_VIEW',
                    'DIVISION_VIEW', 'DIVISION_UPDATE',
                    'PARLIAMENT_VIEW', 'PARLIAMENT_CREATE', 'PARLIAMENT_UPDATE', 'PARLIAMENT_DELETE',
                    'ASSEMBLY_VIEW', 'ASSEMBLY_CREATE', 'ASSEMBLY_UPDATE', 'ASSEMBLY_DELETE',
                    'BLOCK_VIEW', 'BLOCK_CREATE', 'BLOCK_UPDATE', 'BLOCK_DELETE',
                    'BOOTH_VIEW', 'BOOTH_CREATE', 'BOOTH_UPDATE', 'BOOTH_DELETE',
                    'CANDIDATE_VIEW', 'CANDIDATE_CREATE', 'CANDIDATE_UPDATE', 'CANDIDATE_DELETE',
                    'PARTY_VIEW', 'PARTY_UPDATE',
                    'VOTE_VIEW', 'VOTE_CREATE', 'VOTE_UPDATE', 'VOTE_DELETE',
                    'REPORTS_VIEW', 'REPORTS_EXPORT'
                ]
            },

            // Parliament Manager
            {
                role: 'Parliament Manager',
                permissions: [
                    'USER_VIEW',
                    'PARLIAMENT_VIEW', 'PARLIAMENT_UPDATE',
                    'ASSEMBLY_VIEW', 'ASSEMBLY_CREATE', 'ASSEMBLY_UPDATE', 'ASSEMBLY_DELETE',
                    'BLOCK_VIEW', 'BLOCK_CREATE', 'BLOCK_UPDATE', 'BLOCK_DELETE',
                    'BOOTH_VIEW', 'BOOTH_CREATE', 'BOOTH_UPDATE', 'BOOTH_DELETE',
                    'CANDIDATE_VIEW', 'CANDIDATE_CREATE', 'CANDIDATE_UPDATE', 'CANDIDATE_DELETE',
                    'PARTY_VIEW',
                    'VOTE_VIEW', 'VOTE_CREATE', 'VOTE_UPDATE', 'VOTE_DELETE',
                    'REPORTS_VIEW'
                ]
            },

            // Assembly Supervisor
            {
                role: 'Assembly Supervisor',
                permissions: [
                    'USER_VIEW',
                    'ASSEMBLY_VIEW', 'ASSEMBLY_UPDATE',
                    'BLOCK_VIEW', 'BLOCK_CREATE', 'BLOCK_UPDATE', 'BLOCK_DELETE',
                    'BOOTH_VIEW', 'BOOTH_CREATE', 'BOOTH_UPDATE', 'BOOTH_DELETE',
                    'CANDIDATE_VIEW', 'CANDIDATE_CREATE', 'CANDIDATE_UPDATE', 'CANDIDATE_DELETE',
                    'PARTY_VIEW',
                    'VOTE_VIEW', 'VOTE_CREATE', 'VOTE_UPDATE', 'VOTE_DELETE',
                    'REPORTS_VIEW'
                ]
            },

            // Block Officer
            {
                role: 'Block Officer',
                permissions: [
                    'USER_VIEW',
                    'BLOCK_VIEW', 'BLOCK_UPDATE',
                    'BOOTH_VIEW', 'BOOTH_CREATE', 'BOOTH_UPDATE', 'BOOTH_DELETE',
                    'CANDIDATE_VIEW', 'CANDIDATE_CREATE', 'CANDIDATE_UPDATE',
                    'PARTY_VIEW',
                    'VOTE_VIEW', 'VOTE_CREATE', 'VOTE_UPDATE', 'VOTE_DELETE',
                    'REPORTS_VIEW'
                ]
            },

            // Booth Agent
            {
                role: 'Booth Agent',
                permissions: [
                    'BOOTH_VIEW', 'BOOTH_UPDATE',
                    'CANDIDATE_VIEW',
                    'PARTY_VIEW',
                    'VOTE_VIEW', 'VOTE_CREATE', 'VOTE_UPDATE',
                    'REPORTS_VIEW'
                ]
            },

            // Data Entry Operator
            {
                role: 'Data Entry Operator',
                permissions: [
                    'BOOTH_VIEW',
                    'CANDIDATE_VIEW', 'CANDIDATE_CREATE', 'CANDIDATE_UPDATE',
                    'PARTY_VIEW',
                    'VOTE_VIEW', 'VOTE_CREATE', 'VOTE_UPDATE'
                ]
            },

            // Viewer
            {
                role: 'Viewer',
                permissions: [
                    'STATE_VIEW', 'DIVISION_VIEW', 'PARLIAMENT_VIEW', 'ASSEMBLY_VIEW',
                    'BLOCK_VIEW', 'BOOTH_VIEW', 'CANDIDATE_VIEW', 'PARTY_VIEW',
                    'VOTE_VIEW', 'REPORTS_VIEW'
                ]
            }
        ];

        // Create role-permission associations
        for (const mapping of rolePermissionMappings) {
            const role = createdRoles.find(r => r.name === mapping.role);

            for (const permissionName of mapping.permissions) {
                const permission = createdPermissions.find(p => p.name === permissionName);

                if (role && permission) {
                    await RolePermission.create({
                        role: role._id,
                        permission: permission._id
                    });
                }
            }
        }

        console.log('Successfully assigned permissions to roles');
        console.log('✅ Roles and permissions seeded successfully!');

        // Display summary
        console.log('\n📊 Summary:');
        console.log(`• ${createdPermissions.length} permissions created`);
        console.log(`• ${createdRoles.length} roles created`);
        console.log(`• Role-permission mappings established`);

        console.log('\n🔐 Available Roles:');
        createdRoles.forEach(role => {
            console.log(`  • ${role.name} (${role.level} level)`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

// Run the seeding function
seedRolesAndPermissions();
