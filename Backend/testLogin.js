// testLogin.js - Test the login functionality
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const testLogin = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to database');

        // Check if test users exist
        console.log('\n👤 Checking test users...');

        const adminUser = await User.findOne({ email: 'admin@example.com' }).select('+password');
        const managerUser = await User.findOne({ email: 'manager@example.com' }).select('+password');
        const regularUser = await User.findOne({ email: 'user@example.com' }).select('+password');

        console.log('Admin User exists:', !!adminUser);
        console.log('Manager User exists:', !!managerUser);
        console.log('Regular User exists:', !!regularUser);

        if (adminUser) {
            console.log('\n🔍 Admin User Details:');
            console.log('Email:', adminUser.email);
            console.log('Username:', adminUser.username);
            console.log('Role:', adminUser.role);
            console.log('Is Active:', adminUser.isActive);
            console.log('Password Hash Length:', adminUser.password ? adminUser.password.length : 'No password');

            // Test password comparison
            const testPassword = 'password123';
            const passwordMatch = await bcrypt.compare(testPassword, adminUser.password);
            console.log('Password comparison test:', passwordMatch);

            // Test the comparePassword method
            const methodMatch = await adminUser.comparePassword(testPassword);
            console.log('comparePassword method test:', methodMatch);
        }

        // Test direct login simulation
        if (adminUser) {
            console.log('\n🚀 Simulating login process...');
            const { email } = { email: 'admin@example.com', password: 'password123' };

            // Find user with password
            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                console.log('❌ User not found');
                return;
            }

            // Check if user is active
            if (!user.isActive) {
                console.log('❌ User account is deactivated');
                return;
            }

            // Check password
            const isMatch = await user.comparePassword('password123');
            if (!isMatch) {
                console.log('❌ Password does not match');
                return;
            }

            console.log('✅ Login simulation successful!');
        }

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

testLogin();
