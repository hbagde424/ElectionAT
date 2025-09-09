const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const UserRole = require('./models/UserRole');
const RolePermission = require('./models/RolePermission');
const Permission = require('./models/Permission');

// Connect to the cloud database
const MONGO_URI = 'mongodb+srv://developer:Hh1q2w3e4r5t6y7u8i9o0p@cluster0.8ehw8jn.mongodb.net/electionAT';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function checkSuperAdminPermissions() {
    try {
        console.log('🔍 Checking superadmin permissions in cloud database...');

        // Find superadmin user
        const superadmin = await User.findOne({ email: 'superadmin@example.com' });
        if (!superadmin) {
            console.log('❌ Superadmin user not found');
            return;
        }

        console.log('✅ Superadmin user found:', superadmin.email);

        // Get user roles
        const userRoles = await UserRole.find({ user: superadmin._id }).populate('role');
        console.log('📋 User roles:', userRoles.map(ur => ur.role.name));

        // Get all permissions for each role
        for (const userRole of userRoles) {
            const rolePermissions = await RolePermission.find({ role: userRole.role._id }).populate('permission');
            console.log(`\n🔐 Permissions for role "${userRole.role.name}":`);
            rolePermissions.forEach(rp => {
                console.log(`  - ${rp.permission.name}`);
            });
        }

        // Check specifically for user_read permission
        const userReadPermission = await Permission.findOne({ name: 'user_read' });
        if (userReadPermission) {
            console.log('\n🔍 Checking user_read permission...');
            const hasUserRead = await RolePermission.findOne({
                role: { $in: userRoles.map(ur => ur.role._id) },
                permission: userReadPermission._id
            });
            console.log('✅ Has user_read permission:', !!hasUserRead);
        } else {
            console.log('❌ user_read permission not found in database');
        }

        // List all available permissions
        const allPermissions = await Permission.find({});
        console.log(`\n📋 Total permissions in database: ${allPermissions.length}`);
        console.log('Available permissions:');
        allPermissions.forEach(permission => {
            console.log(`  - ${permission.name}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

checkSuperAdminPermissions();
