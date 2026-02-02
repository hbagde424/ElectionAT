const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const migrateBLOAddressToDesignation = async () => {
    try {
        console.log('🔄 Starting BLO address to designation migration...');

        // Update all BLO documents to rename full_address to designation
        const result = await mongoose.connection.db.collection('blos').updateMany(
            { full_address: { $exists: true } },
            { 
                $rename: { full_address: 'designation' }
            }
        );

        console.log(`✅ Migration completed successfully!`);
        console.log(`📊 Documents updated: ${result.modifiedCount}`);
        console.log(`📊 Documents matched: ${result.matchedCount}`);

        // Also remove the full_address field from documents that might have empty values
        const cleanupResult = await mongoose.connection.db.collection('blos').updateMany(
            {},
            { 
                $unset: { full_address: "" }
            }
        );

        console.log(`🧹 Cleanup completed: ${cleanupResult.modifiedCount} documents cleaned`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
};

const main = async () => {
    try {
        await connectDB();
        await migrateBLOAddressToDesignation();
        console.log('🎉 All migrations completed successfully!');
    } catch (error) {
        console.error('💥 Migration script failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the migration
main();