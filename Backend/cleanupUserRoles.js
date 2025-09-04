const mongoose = require('mongoose');
const UserRole = require('./models/UserRole');

// Connect to MongoDB Atlas
const MONGO_URI = 'mongodb+srv://developer:Hh@1q2w3e4r5t6y7u8i9o@cluster0.8ehw8jn.mongodb.net/ElectionAtlas';

async function cleanupOrphanedUserRoles() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB Atlas');

        // Find all user-roles and populate
        const userRoles = await UserRole.find().populate('user').populate('role');
        console.log(`Found ${userRoles.length} user-role records`);

        // Find orphaned records
        const orphaned = userRoles.filter(ur => !ur.user || !ur.role);
        console.log(`Found ${orphaned.length} orphaned records`);

        if (orphaned.length > 0) {
            console.log('Orphaned records:');
            orphaned.forEach(ur => {
                console.log(`- ID: ${ur._id}, User: ${ur.user ? ur.user._id : 'NULL'}, Role: ${ur.role ? ur.role._id : 'NULL'}`);
            });

            // Delete orphaned records
            const orphanedIds = orphaned.map(ur => ur._id);
            const result = await UserRole.deleteMany({ _id: { $in: orphanedIds } });
            console.log(`Deleted ${result.deletedCount} orphaned records`);
        }

        console.log('Cleanup completed');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

cleanupOrphanedUserRoles();
