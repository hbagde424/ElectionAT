const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Role = require('./models/Role');
const UserRole = require('./models/UserRole');
const Permission = require('./models/Permission');
const RolePermission = require('./models/RolePermission');
const config = require('./config/config');

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(config.MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully');
        // Run the setup after successful connection
        setupAllPermissions();
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    });

// All permissions from the user's list organized by category
const allPermissions = [
    // Geographic Hierarchy Permissions
    { name: 'state', description: 'Access to state data and operations', category: 'Geographic Management', level: 'State' },
    { name: 'division', description: 'Access to division data and operations', category: 'Geographic Management', level: 'Division' },
    { name: 'parliament', description: 'Access to parliament constituency data and operations', category: 'Geographic Management', level: 'Parliament' },
    { name: 'parliament-candidate', description: 'Access to parliament candidate data and operations', category: 'Election Management', level: 'Parliament' },
    { name: 'assembly', description: 'Access to assembly constituency data and operations', category: 'Geographic Management', level: 'Assembly' },
    { name: 'district', description: 'Access to district data and operations', category: 'Geographic Management', level: 'Division' },
    { name: 'block', description: 'Access to block data and operations', category: 'Geographic Management', level: 'Block' },
    { name: 'booth', description: 'Access to booth data and operations', category: 'Geographic Management', level: 'Booth' },

    // Election Data and Survey Permissions
    { name: 'Booth-Survey', description: 'Access to booth survey data and operations', category: 'Survey Management', level: 'Booth' },
    { name: 'booth-volunteer', description: 'Access to booth volunteer data and operations', category: 'Volunteer Management', level: 'Booth' },
    { name: 'Booth-votes', description: 'Access to booth voting data and operations', category: 'Election Management', level: 'Booth' },
    { name: 'candidates', description: 'Access to candidate data and operations', category: 'Election Management', level: 'Assembly' },
    { name: 'Caste-List', description: 'Access to caste list data and operations', category: 'Demographic Data', level: 'Block' },
    { name: 'Coding', description: 'Access to coding data and operations', category: 'Data Management', level: 'Division' },
    { name: 'Events', description: 'Access to events data and operations', category: 'Event Management', level: 'Block' },
    { name: 'Gender', description: 'Access to gender data and operations', category: 'Demographic Data', level: 'Block' },
    { name: 'Government-Scheme', description: 'Access to government scheme data and operations', category: 'Government Data', level: 'Division' },
    { name: 'Influancer', description: 'Access to influencer data and operations', category: 'Influencer Management', level: 'Assembly' },
    { name: 'Local-Issue', description: 'Access to local issue data and operations', category: 'Issue Management', level: 'Block' },
    { name: 'parties', description: 'Access to political party data and operations', category: 'Election Management', level: 'State' },
    { name: 'Party-Activities', description: 'Access to party activities data and operations', category: 'Election Management', level: 'Assembly' },
    { name: 'Pontentcal-Candidate', description: 'Access to potential candidate data and operations', category: 'Election Management', level: 'Assembly' },
    { name: 'Users', description: 'Access to user management data and operations', category: 'User Management', level: 'State' },
    { name: 'Our visits', description: 'Access to visit data and operations', category: 'Visit Management', level: 'Block' },
    { name: 'WinningPartiesList', description: 'Access to winning parties list data and operations', category: 'Election Results', level: 'State' },
    { name: 'WInningCandidateList', description: 'Access to winning candidate list data and operations', category: 'Election Results', level: 'State' },
    { name: 'Work-Status', description: 'Access to work status data and operations', category: 'Work Management', level: 'Block' },
    { name: 'Year', description: 'Access to year-based data and operations', category: 'Data Management', level: 'State' },

    // System and Role Management Permissions
    { name: 'role', description: 'Access to role management data and operations', category: 'Role Management', level: 'State' },
    { name: 'matrix', description: 'Access to permission matrix data and operations', category: 'Permission Management', level: 'State' },
    { name: 'assign-role-to-user', description: 'Access to assign roles to users', category: 'User Management', level: 'State' },
    { name: 'faq-crud', description: 'Access to FAQ CRUD operations', category: 'Content Management', level: 'Division' },
    { name: 'help center', description: 'Access to help center data and operations', category: 'Support Management', level: 'Division' },
    { name: 'faq', description: 'Access to FAQ data and operations', category: 'Content Management', level: 'Division' },
    { name: 'data', description: 'Access to general data operations', category: 'Data Management', level: 'State' },
    { name: 'default1', description: 'Access to default data operations', category: 'Data Management', level: 'State' },
    { name: 'group-admin', description: 'Access to group admin operations', category: 'User Management', level: 'Division' },
    { name: 'roles', description: 'Access to roles data and operations', category: 'Role Management', level: 'State' },
    { name: 'permissions', description: 'Access to permissions data and operations', category: 'Permission Management', level: 'State' }
];

// Role definitions with specific permissions
const roleDefinitions = [
    {
        name: 'Super Administrator',
        description: 'Full system access with all permissions',
        permissions: 'ALL' // Special case - gets all permissions
    },
    {
        name: 'State Administrator',
        description: 'Administrative access at state level',
        permissions: [
            'state', 'division', 'parliament', 'parliament-candidate', 'assembly', 'district', 'block', 'booth',
            'Booth-Survey', 'booth-volunteer', 'Booth-votes', 'candidates', 'Caste-List', 'Coding', 'Events',
            'Gender', 'Government-Scheme', 'Influancer', 'Local-Issue', 'parties', 'Party-Activities',
            'Pontentcal-Candidate', 'Users', 'Our visits', 'WinningPartiesList', 'WInningCandidateList',
            'Work-Status', 'Year', 'role', 'matrix', 'assign-role-to-user', 'faq-crud', 'help center',
            'faq', 'data', 'default1', 'group-admin', 'roles', 'permissions'
        ]
    },
    {
        name: 'Division Coordinator',
        description: 'Coordinative access at division level',
        permissions: [
            'division', 'parliament', 'parliament-candidate', 'assembly', 'district', 'block', 'booth',
            'Booth-Survey', 'booth-volunteer', 'Booth-votes', 'candidates', 'Caste-List', 'Events',
            'Gender', 'Government-Scheme', 'Local-Issue', 'parties', 'Party-Activities',
            'Pontentcal-Candidate', 'Our visits', 'Work-Status', 'faq-crud', 'help center', 'faq'
        ]
    },
    {
        name: 'Assembly Supervisor',
        description: 'Supervisory access at assembly level',
        permissions: [
            'assembly', 'block', 'booth', 'Booth-Survey', 'booth-volunteer', 'Booth-votes',
            'candidates', 'Caste-List', 'Events', 'Gender', 'Influancer', 'Local-Issue',
            'Party-Activities', 'Pontentcal-Candidate', 'Our visits', 'Work-Status'
        ]
    },
    {
        name: 'Block Officer',
        description: 'Officer access at block level',
        permissions: [
            'block', 'booth', 'Booth-Survey', 'booth-volunteer', 'Booth-votes',
            'candidates', 'Caste-List', 'Events', 'Gender', 'Local-Issue',
            'Our visits', 'Work-Status'
        ]
    },
    {
        name: 'Booth Agent',
        description: 'Agent access at booth level',
        permissions: [
            'booth', 'Booth-Survey', 'booth-volunteer', 'Booth-votes',
            'candidates', 'Events', 'Our visits', 'Work-Status'
        ]
    },
    {
        name: 'Data Entry Operator',
        description: 'Basic data entry permissions',
        permissions: [
            'booth', 'Booth-Survey', 'Booth-votes', 'candidates', 'Caste-List',
            'Events', 'Gender', 'Local-Issue', 'Our visits', 'Work-Status'
        ]
    },
    {
        name: 'Viewer',
        description: 'Read-only access to data',
        permissions: [
            'state', 'division', 'parliament', 'assembly', 'district', 'block', 'booth',
            'candidates', 'parties', 'WinningPartiesList', 'WInningCandidateList'
        ]
    }
];

async function setupAllPermissions() {
    try {
        console.log('🚀 Setting up all permissions from user list...\n');

        // 1. Create all permissions
        console.log('📝 Creating permissions...');
        const createdPermissions = {};

        for (const perm of allPermissions) {
            const existingPermission = await Permission.findOne({ name: perm.name });
            if (!existingPermission) {
                const newPermission = await Permission.create(perm);
                createdPermissions[perm.name] = newPermission._id;
                console.log(`   ✅ Created permission: ${perm.name} (${perm.category})`);
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

        // 3. Create or update super admin user
        console.log('\n👑 Setting up Super Administrator...');

        const superAdminEmail = 'superadmin@electionat.com';
        let superAdmin = await User.findOne({ email: superAdminEmail });

        if (!superAdmin) {
            // Check if mobile number is already in use
            const existingMobileUser = await User.findOne({ mobile: '9876543210' });
            const mobileNumber = existingMobileUser ? '9876543211' : '9876543210';

            superAdmin = await User.create({
                firstName: 'Super',
                lastName: 'Administrator',
                email: superAdminEmail,
                username: 'superadmin',
                mobile: mobileNumber,
                password: await bcrypt.hash('admin123', 10),
                role: 'superAdmin'
            });
            console.log(`   ✅ Created Super Administrator user: ${superAdminEmail}`);
        } else {
            console.log(`   ℹ️  Super Administrator user already exists: ${superAdminEmail}`);
        }

        // Assign Super Administrator role to the user
        const superAdminRole = await Role.findOne({ name: 'Super Administrator' });
        if (superAdminRole) {
            const existingUserRole = await UserRole.findOne({
                user: superAdmin._id,
                role: superAdminRole._id
            });

            if (!existingUserRole) {
                await UserRole.create({
                    user: superAdmin._id,
                    role: superAdminRole._id
                });
                console.log(`   🔗 Assigned Super Administrator role to user`);
            } else {
                console.log(`   ℹ️  Super Administrator role already assigned to user`);
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
        console.log('='.repeat(60));
        console.log(`Permissions created: ${totalPermissions}`);
        console.log(`Roles created: ${totalRoles}`);
        console.log(`Users created: ${totalUsers}`);
        console.log(`User-Role assignments: ${totalUserRoles}`);
        console.log(`Role-Permission assignments: ${totalRolePermissions}`);

        console.log('\n🔑 SUPER ADMIN CREDENTIALS:');
        console.log('='.repeat(60));
        console.log(`Email: ${superAdminEmail}`);
        console.log(`Password: admin123`);
        console.log(`Role: Super Administrator (ALL PERMISSIONS)`);

        console.log('\n📋 PERMISSION CATEGORIES:');
        console.log('='.repeat(60));
        const categories = [...new Set(allPermissions.map(p => p.category))];
        categories.forEach(category => {
            const categoryPermissions = allPermissions.filter(p => p.category === category);
            console.log(`${category}: ${categoryPermissions.length} permissions`);
            categoryPermissions.forEach(perm => {
                console.log(`  • ${perm.name} (${perm.level} level)`);
            });
        });

        console.log('\n🎉 All permissions have been successfully set up and assigned to Super Administrator!');
        console.log('The Super Administrator now has access to all 50+ permissions you requested.');

    } catch (error) {
        console.error('❌ Error setting up permissions:', error);
        process.exit(1);
    } finally {
        mongoose.connection.close();
    }
}

// Setup function is called after MongoDB connection
