require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const createSuperAdmin = async () => {
    try {
        console.log('🚀 Creating Super Admin...');

        // Connect directly with the URI
        await mongoose.connect('mongodb+srv://developer:Hh1q2w3e4r5t6y7u8i9o0p@cluster0.8ehw8jn.mongodb.net/electionAT');
        console.log('✅ Connected to database');

        // Clear existing superadmin
        await User.deleteMany({ email: 'superadmin@example.com' });
        console.log('🧹 Cleared existing superadmin');

        // Create new superadmin (let the model handle password hashing)
        const superAdmin = new User({
            username: 'superadmin',
            email: 'superadmin@example.com',
            password: 'superadmin@123', // Raw password - model will hash it
            mobile: '9999999999',
            role: 'superAdmin',
            isActive: true
        });

        await superAdmin.save();
        console.log('✅ Super Admin created!');

        // Test the password
        const savedUser = await User.findOne({ email: 'superadmin@example.com' }).select('+password');
        const passwordTest = await savedUser.comparePassword('superadmin@123');
        console.log('🔐 Password test:', passwordTest ? 'PASS ✅' : 'FAIL ❌');

        console.log('\n🎉 Login Credentials:');
        console.log('Email: superadmin@example.com');
        console.log('Password: superadmin@123');

        mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        mongoose.connection.close();
        process.exit(1);
    }
};

createSuperAdmin();
