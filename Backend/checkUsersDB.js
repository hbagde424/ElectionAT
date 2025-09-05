const mongoose = require('mongoose');
const User = require('./models/User');

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://developer:Hh1q2w3e4r5t6y7u8i9o0p@cluster0.8ehw8jn.mongodb.net/electionAT');
        console.log('✅ Connected to MongoDB');

        // List all users
        const users = await User.find({}).select('email role isActive');
        console.log('📋 Users in database:');
        users.forEach(user => {
            console.log(`  - Email: ${user.email}, Role: ${user.role}, Active: ${user.isActive}`);
        });

        // Check if specific test user exists
        const testUser = await User.findOne({ email: 'test@test.com' });
        if (testUser) {
            console.log('✅ Test user found:', testUser.email);
        } else {
            console.log('❌ Test user not found');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Database error:', error);
        process.exit(1);
    }
};

connectDB();
