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

async function testUsersAPI() {
    try {
        console.log('🔍 Testing users API functionality...');

        // Find superadmin user
        const superadmin = await User.findOne({ email: 'superadmin@example.com' });
        if (!superadmin) {
            console.log('❌ Superadmin user not found');
            return;
        }

        console.log('✅ Superadmin user found:', superadmin.email);

        // Get all users (simulating the API call)
        const allUsers = await User.find({}).select('-password');
        console.log(`📋 Total users in database: ${allUsers.length}`);

        allUsers.forEach((user, index) => {
            console.log(`\n👤 User ${index + 1}:`);
            console.log('  - ID:', user._id);
            console.log('  - Email:', user.email);
            console.log('  - Username:', user.username);
            console.log('  - Role:', user.role);
            console.log('  - Active:', user.isActive);
        });

        // Check if there are any users with hierarchy assignments
        const usersWithHierarchy = await User.find({
            $or: [
                { state_ids: { $exists: true, $ne: [] } },
                { division_ids: { $exists: true, $ne: [] } },
                { parliament_ids: { $exists: true, $ne: [] } },
                { assembly_ids: { $exists: true, $ne: [] } },
                { block_ids: { $exists: true, $ne: [] } },
                { booth_ids: { $exists: true, $ne: [] } }
            ]
        });

        console.log(`\n🏢 Users with hierarchy assignments: ${usersWithHierarchy.length}`);

        // Check UserHierarchy collection
        const UserHierarchy = require('./models/UserHierarchy');
        const userHierarchyCount = await UserHierarchy.countDocuments();
        console.log(`📊 UserHierarchy documents: ${userHierarchyCount}`);

        if (userHierarchyCount > 0) {
            const sampleHierarchy = await UserHierarchy.findOne().populate('user');
            console.log('📋 Sample hierarchy:', {
                userId: sampleHierarchy.user._id,
                userEmail: sampleHierarchy.user.email,
                state: sampleHierarchy.state,
                division: sampleHierarchy.division,
                parliament: sampleHierarchy.parliament,
                assembly: sampleHierarchy.assembly,
                block: sampleHierarchy.block,
                booth: sampleHierarchy.booth
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

testUsersAPI();
