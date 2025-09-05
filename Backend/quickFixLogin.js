const mongoose = require('mongoose');
const User = require('./models/User');

const testLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://developer:Hh1q2w3e4r5t6y7u8i9o0p@cluster0.8ehw8jn.mongodb.net/electionAT');
        console.log('✅ Connected to MongoDB');

        // Clear and create a fresh user
        await User.deleteMany({});

        const user = new User({
            username: 'admin',
            email: 'admin@example.com',
            password: 'password123',
            mobile: '1234567890',
            role: 'Admin',
            isActive: true
        });

        await user.save();
        console.log('✅ User created');

        // Test the password
        const savedUser = await User.findOne({ email: 'admin@example.com' }).select('+password');
        const passwordMatch = await savedUser.comparePassword('password123');
        console.log('Password comparison result:', passwordMatch);

        if (passwordMatch) {
            console.log('🎉 Login credentials working!');
            console.log('Email: admin@example.com');
            console.log('Password: password123');
        } else {
            console.log('❌ Password comparison failed');
        }

        mongoose.connection.close();

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testLogin();
