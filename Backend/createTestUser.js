const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

const createTestUser = async () => {
    try {
        await connectDB();
        console.log('Connected to database');

        // Create a test user
        const hashedPassword = await bcrypt.hash('password123', 12);

        const testUser = new User({
            username: 'testuser',
            email: 'test@example.com',
            mobile: '1234567890',
            password: hashedPassword,
            name: 'Test User',
            role: 'Admin',
            isActive: true
        });

        await testUser.save();
        console.log('✅ Test user created successfully!');
        console.log('Username: testuser');
        console.log('Email: test@example.com');
        console.log('Password: password123');

        process.exit(0);
    } catch (error) {
        if (error.code === 11000) {
            console.log('ℹ️ Test user already exists');
        } else {
            console.error('❌ Error creating test user:', error);
        }
        process.exit(1);
    }
};

createTestUser();
