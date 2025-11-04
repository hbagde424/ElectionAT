const mongoose = require('mongoose');

// Simple connection and user creation
async function quickTest() {
    try {
        // Connect to the same MongoDB as the server
        await mongoose.connect('mongodb+srv://developer:Hh1q2w3e4r5t6y7u8i9o0p@cluster0.8ehw8jn.mongodb.net/electionAT');
        console.log('✅ Connected to MongoDB');

        // Find all users
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const users = await User.find().limit(5);
        console.log(`📊 Found ${users.length} users in database`);

        if (users.length > 0) {
            console.log('👤 Sample user:', {
                id: users[0]._id,
                username: users[0].username,
                email: users[0].email,
                name: users[0].name
            });
        }

        // Create a simple test user if none exist
        if (users.length === 0) {
            const newUser = new User({
                username: 'demo_user',
                email: 'demo@test.com',
                name: 'Demo User',
                mobile: '9876543210',
                role: 'Admin',
                isActive: true,
                password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfyXdQZY8.F7IaK' // "password123"
            });
            await newUser.save();
            console.log('✅ Created demo user');
        }

        await mongoose.disconnect();
        console.log('✅ Database operations completed');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

quickTest();
