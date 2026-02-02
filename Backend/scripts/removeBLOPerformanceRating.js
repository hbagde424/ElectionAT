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

const removeBLOPerformanceRating = async () => {
    try {
        console.log('🔄 Starting BLO performance rating removal...');

        // Remove performance_rating field from all BLO documents
        const result = await mongoose.connection.db.collection('blos').updateMany(
            {},
            { 
                $unset: { performance_rating: "" }
            }
        );

        console.log(`✅ Removal completed successfully!`);
        console.log(`📊 Documents updated: ${result.modifiedCount}`);
        console.log(`📊 Documents matched: ${result.matchedCount}`);

    } catch (error) {
        console.error('❌ Removal failed:', error);
        throw error;
    }
};

const main = async () => {
    try {
        await connectDB();
        await removeBLOPerformanceRating();
        console.log('🎉 All operations completed successfully!');
    } catch (error) {
        console.error('💥 Script failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the script
main();