const mongoose = require('mongoose');
const Permission = require('./models/Permission');
const Role = require('./models/Role');
const RolePermission = require('./models/RolePermission');
const config = require('./config/config');

// Connect to MongoDB
mongoose.connect(config.MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000
})
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => {
        console.error("❌ MongoDB connection failed:", err.message);
        process.exit(1);
    });
const userPermissions = [
    // User CRUD permissions
    { name: 'user_create', description: 'Create new users' },
    { name: 'user_read', description: 'View user information' },
    { name: 'user_update', description: 'Update user information' },
    { name: 'user_delete', description: 'Delete users' },

    // User role and hierarchy management
    { name: 'user_role_assign', description: 'Assign roles to users' },
    { name: 'user_role_remove', description: 'Remove roles from users' },
    { name: 'user_hierarchy_assign', description: 'Assign geographic access to users' },
    { name: 'user_hierarchy_remove', description: 'Remove geographic access from users' },

    // Role management permissions
    { name: 'role_create', description: 'Create new roles' },
    { name: 'role_read', description: 'View role information' },
    { name: 'role_update', description: 'Update role information' },
    { name: 'role_delete', description: 'Delete roles' },

    // Permission management permissions
    { name: 'permission_create', description: 'Create new permissions' },
    { name: 'permission_read', description: 'View permission information' },
    { name: 'permission_update', description: 'Update permission information' },
    { name: 'permission_delete', description: 'Delete permissions' },

    // Role-Permission matrix permissions
    { name: 'role_permission_assign', description: 'Assign permissions to roles' },
    { name: 'role_permission_remove', description: 'Remove permissions from roles' },
    { name: 'role_permission_matrix_view', description: 'View role-permission matrix' },

    // Geographic entity permissions
    { name: 'state_create', description: 'Create states' },
    { name: 'state_read', description: 'View state information' },
    { name: 'state_update', description: 'Update state information' },
    { name: 'state_delete', description: 'Delete states' },

    { name: 'division_create', description: 'Create divisions' },
    { name: 'division_read', description: 'View division information' },
    { name: 'division_update', description: 'Update division information' },
    { name: 'division_delete', description: 'Delete divisions' },

    { name: 'parliament_create', description: 'Create parliament constituencies' },
    { name: 'parliament_read', description: 'View parliament information' },
    { name: 'parliament_update', description: 'Update parliament information' },
    { name: 'parliament_delete', description: 'Delete parliament constituencies' },

    { name: 'assembly_create', description: 'Create assembly constituencies' },
    { name: 'assembly_read', description: 'View assembly information' },
    { name: 'assembly_update', description: 'Update assembly information' },
    { name: 'assembly_delete', description: 'Delete assembly constituencies' },

    { name: 'block_create', description: 'Create blocks' },
    { name: 'block_read', description: 'View block information' },
    { name: 'block_update', description: 'Update block information' },
    { name: 'block_delete', description: 'Delete blocks' },

    { name: 'booth_create', description: 'Create booths' },
    { name: 'booth_read', description: 'View booth information' },
    { name: 'booth_update', description: 'Update booth information' },
    { name: 'booth_delete', description: 'Delete booths' },

    // Election data permissions
    { name: 'election_data_read', description: 'View election data' },
    { name: 'election_data_update', description: 'Update election data' },
    { name: 'election_data_delete', description: 'Delete election data' },

    // Candidate permissions
    { name: 'candidate_create', description: 'Create candidate records' },
    { name: 'candidate_read', description: 'View candidate information' },
    { name: 'candidate_update', description: 'Update candidate information' },
    { name: 'candidate_delete', description: 'Delete candidate records' },

    // Party permissions
    { name: 'party_create', description: 'Create party records' },
    { name: 'party_read', description: 'View party information' },
    { name: 'party_update', description: 'Update party information' },
    { name: 'party_delete', description: 'Delete party records' },

    // Voter permissions
    { name: 'voter_create', description: 'Create voter records' },
    { name: 'voter_read', description: 'View voter information' },
    { name: 'voter_update', description: 'Update voter information' },
    { name: 'voter_delete', description: 'Delete voter records' },

    // Survey permissions
    { name: 'survey_create', description: 'Create surveys' },
    { name: 'survey_read', description: 'View survey data' },
    { name: 'survey_update', description: 'Update survey data' },
    { name: 'survey_delete', description: 'Delete surveys' },

    // Report permissions
    { name: 'report_read', description: 'View reports' },
    { name: 'report_generate', description: 'Generate reports' },
    { name: 'report_export', description: 'Export reports' },

    // Analytics permissions
    { name: 'analytics_read', description: 'View analytics' },
    { name: 'analytics_advanced', description: 'Access advanced analytics' },

    // System permissions
    { name: 'system_settings_read', description: 'View system settings' },
    { name: 'system_settings_update', description: 'Update system settings' },
    { name: 'system_backup', description: 'Create system backups' },
    { name: 'system_restore', description: 'Restore system from backup' },

    // Audit permissions
    { name: 'audit_log_read', description: 'View audit logs' },
    { name: 'audit_log_export', description: 'Export audit logs' }
];

const roleDefinitions = [
    {
        name: 'Super Administrator',
        description: 'Full system access with all permissions',
        permissions: 'ALL' // Special case - gets all permissions
    },
    {
        name: 'State Administrator',
        description: 'State-level administration with geographic restrictions',
        permissions: [
            'user_create', 'user_read', 'user_update', 'user_delete',
            'user_role_assign', 'user_hierarchy_assign',
            'role_read', 'permission_read',
            'division_create', 'division_read', 'division_update', 'division_delete',
            'parliament_create', 'parliament_read', 'parliament_update', 'parliament_delete',
            'assembly_create', 'assembly_read', 'assembly_update', 'assembly_delete',
            'block_create', 'block_read', 'block_update', 'block_delete',
            'booth_create', 'booth_read', 'booth_update', 'booth_delete',
            'candidate_create', 'candidate_read', 'candidate_update', 'candidate_delete',
            'party_create', 'party_read', 'party_update', 'party_delete',
            'voter_create', 'voter_read', 'voter_update', 'voter_delete',
            'survey_create', 'survey_read', 'survey_update', 'survey_delete',
            'election_data_read', 'election_data_update',
            'report_read', 'report_generate', 'report_export',
            'analytics_read', 'analytics_advanced'
        ]
    },
    {
        name: 'Division Administrator',
        description: 'Division-level administration',
        permissions: [
            'user_read', 'user_update', 'user_role_assign', 'user_hierarchy_assign',
            'parliament_read', 'parliament_update',
            'assembly_create', 'assembly_read', 'assembly_update', 'assembly_delete',
            'block_create', 'block_read', 'block_update', 'block_delete',
            'booth_create', 'booth_read', 'booth_update', 'booth_delete',
            'candidate_create', 'candidate_read', 'candidate_update', 'candidate_delete',
            'party_read', 'party_update',
            'voter_create', 'voter_read', 'voter_update', 'voter_delete',
            'survey_create', 'survey_read', 'survey_update', 'survey_delete',
            'election_data_read', 'election_data_update',
            'report_read', 'report_generate', 'analytics_read'
        ]
    },
    {
        name: 'Parliament Administrator',
        description: 'Parliament constituency-level administration',
        permissions: [
            'user_read', 'user_update',
            'assembly_read', 'assembly_update',
            'block_read', 'block_update',
            'booth_create', 'booth_read', 'booth_update', 'booth_delete',
            'candidate_read', 'candidate_update',
            'voter_create', 'voter_read', 'voter_update', 'voter_delete',
            'survey_create', 'survey_read', 'survey_update', 'survey_delete',
            'election_data_read', 'election_data_update',
            'report_read', 'report_generate', 'analytics_read'
        ]
    },
    {
        name: 'Assembly Administrator',
        description: 'Assembly constituency-level administration',
        permissions: [
            'user_read', 'user_update',
            'block_read', 'block_update',
            'booth_create', 'booth_read', 'booth_update', 'booth_delete',
            'candidate_read', 'candidate_update',
            'voter_create', 'voter_read', 'voter_update', 'voter_delete',
            'survey_create', 'survey_read', 'survey_update', 'survey_delete',
            'election_data_read', 'election_data_update',
            'report_read', 'analytics_read'
        ]
    },
    {
        name: 'Block Administrator',
        description: 'Block-level administration',
        permissions: [
            'user_read',
            'booth_create', 'booth_read', 'booth_update', 'booth_delete',
            'voter_create', 'voter_read', 'voter_update', 'voter_delete',
            'survey_create', 'survey_read', 'survey_update', 'survey_delete',
            'election_data_read', 'election_data_update',
            'report_read', 'analytics_read'
        ]
    },
    {
        name: 'Booth Administrator',
        description: 'Booth-level administration',
        permissions: [
            'booth_read', 'booth_update',
            'voter_create', 'voter_read', 'voter_update', 'voter_delete',
            'survey_create', 'survey_read', 'survey_update', 'survey_delete',
            'election_data_read', 'election_data_update',
            'report_read'
        ]
    },
    {
        name: 'Data Entry Operator',
        description: 'Data entry and basic operations',
        permissions: [
            'voter_create', 'voter_read', 'voter_update',
            'candidate_read', 'party_read',
            'survey_create', 'survey_read', 'survey_update',
            'election_data_read'
        ]
    },
    {
        name: 'Analyst',
        description: 'Data analysis and reporting',
        permissions: [
            'user_read', 'booth_read', 'block_read', 'assembly_read', 'parliament_read',
            'candidate_read', 'party_read', 'voter_read',
            'survey_read', 'election_data_read',
            'report_read', 'report_generate', 'report_export',
            'analytics_read', 'analytics_advanced'
        ]
    },
    {
        name: 'Viewer',
        description: 'Read-only access to assigned areas',
        permissions: [
            'user_read', 'booth_read', 'block_read', 'assembly_read', 'parliament_read',
            'candidate_read', 'party_read', 'voter_read',
            'survey_read', 'election_data_read',
            'report_read', 'analytics_read'
        ]
    }
];

async function setupPermissionsAndRoles() {
    try {
        console.log('🚀 Setting up comprehensive permissions and roles...');

        // Create all permissions
        console.log('📝 Creating permissions...');
        const createdPermissions = {};

        for (const perm of userPermissions) {
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

        // Create roles and assign permissions
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

            // Clear existing role permissions
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

        console.log('✅ Setup completed successfully!');
        console.log(`📊 Created ${userPermissions.length} permissions and ${roleDefinitions.length} roles`);

        // Display summary
        console.log('\n📋 Summary:');
        console.log('Permissions created:', userPermissions.length);
        console.log('Roles created:', roleDefinitions.length);

        console.log('\n🔑 Available Roles:');
        for (const roleDef of roleDefinitions) {
            console.log(`  - ${roleDef.name}: ${roleDef.description}`);
        }

    } catch (error) {
        console.error('❌ Error setting up permissions and roles:', error);
        process.exit(1);
    } finally {
        mongoose.connection.close();
    }
}

// Run the setup
setupPermissionsAndRoles();
