// createSuperAdminNow.js - Create Super Admin using existing models
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

const createSuperAdminNow = async () => {
    try {
        console.log('🚀 Creating Super Admin using existing User model...');

        await connectDB();
        console.log('✅ Connected to database');

        // Check what users currently exist
        const existingUsers = await User.find({});
        console.log('📊 Existing users count:', existingUsers.length);

        // Clear any existing user with this email first
        const deleteResult = await User.deleteMany({ email: 'superadmin@example.com' });
        console.log('🧹 Deleted existing users:', deleteResult.deletedCount);

        // Create the Super Admin user
        console.log('👤 Creating Super Admin user...');
        const hashedPassword = await bcrypt.hash('superadmin@123', 10);
        console.log('🔐 Password hashed, length:', hashedPassword.length);

        const superAdminUser = new User({
            username: 'superadmin',
            email: 'superadmin@example.com',
            password: hashedPassword,
            mobile: '9999999999',
            role: 'superAdmin',
            isActive: true
        });

        console.log('💾 Saving user to database...');
        const savedUser = await superAdminUser.save();
        console.log('✅ Super Admin user created successfully!');
        console.log('📋 Saved user ID:', savedUser._id);

        // Verify the user was created
        const verifyUser = await User.findOne({ email: 'superadmin@example.com' }).select('+password');
        if (verifyUser) {
            console.log('📋 Super Admin User Details:');
            console.log('  • ID:', verifyUser._id);
            console.log('  • Username:', verifyUser.username);
            console.log('  • Email:', verifyUser.email);
            console.log('  • Role:', verifyUser.role);
            console.log('  • Active:', verifyUser.isActive);
            console.log('  • Password Hash Length:', verifyUser.password?.length);

            // Test password comparison
            const passwordTest = await verifyUser.comparePassword('superadmin@123');
            console.log('  • Password Test:', passwordTest ? 'PASS ✅' : 'FAIL ❌');
        }

        await mongoose.connection.close();
        console.log('✅ Database connection closed');

        console.log('\n🎉 Super Admin setup completed!');
        console.log('\n📝 Login Credentials:');
        console.log('Email: superadmin@example.com');
        console.log('Password: superadmin@123');
        console.log('Role: superAdmin');
        console.log('\n🔗 Frontend Login URL: http://localhost:5173/election/login');

    } catch (error) {
        console.error('❌ Error creating Super Admin:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
};

// Run immediately
createSuperAdminNow();
