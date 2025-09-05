// createAdminUser.js - Simple admin user creation
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

const createAdminUser = async () => {
    try {
        console.log('Starting admin user creation...');
        await connectDB();
        console.log('✅ Connected to database');

        // Clear existing users
        console.log('🧹 Clearing existing users...');
        await User.deleteMany({});
        console.log('✅ Cleared users');

        // Create simple test user
        console.log('👤 Creating admin user...');
        // Don't hash the password here - let the User model pre-save hook handle it

        const user = new User({
            username: 'admin',
            email: 'admin@example.com',
            password: 'password123', // Raw password - let model hash it
            mobile: '1234567890',
            role: 'Admin',
            isActive: true
        });

        await user.save();
        console.log('✅ Created admin user:', user.email);

        // Verify the user
        const savedUser = await User.findOne({ email: 'admin@example.com' }).select('+password');
        if (savedUser) {
            console.log('✅ User verified in database');
            console.log('   Username:', savedUser.username);
            console.log('   Email:', savedUser.email);
            console.log('   Role:', savedUser.role);
            console.log('   Is Active:', savedUser.isActive);

            // Test password comparison
            const passwordMatch = await savedUser.comparePassword('password123');
            console.log('   Password test:', passwordMatch ? 'PASS' : 'FAIL');
        }

        console.log('\n🎉 Admin user created successfully!');
        console.log('Login credentials:');
        console.log('Email: admin@example.com');
        console.log('Password: password123');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
};

createAdminUser();
