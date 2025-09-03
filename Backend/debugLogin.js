// debugLogin.js - Debug login step by step
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const axios = require('axios');

const debugLogin = async () => {
    console.log('=== DEBUGGING LOGIN PROCESS ===\n');

    try {
        // Step 1: Connect to database
        console.log('1. Connecting to database...');
        await connectDB();
        console.log('✅ Database connected\n');

        // Step 2: Create test user
        console.log('2. Creating test user...');
        await User.deleteMany({});

        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = new User({
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
            mobile: '1234567890',
            role: 'Admin',
            isActive: true
        });

        await user.save();
        console.log('✅ User created:', user.email);
        console.log('✅ User ID:', user._id);
        console.log('✅ User role:', user.role);
        console.log('✅ User active:', user.isActive, '\n');

        // Step 3: Verify user in database
        console.log('3. Verifying user in database...');
        const savedUser = await User.findOne({ email: 'admin@example.com' }).select('+password');
        if (savedUser) {
            console.log('✅ User found in database');
            console.log('   Username:', savedUser.username);
            console.log('   Email:', savedUser.email);
            console.log('   Role:', savedUser.role);
            console.log('   Active:', savedUser.isActive);
            console.log('   Password hash exists:', !!savedUser.password);

            // Test password comparison
            const passwordMatch = await savedUser.comparePassword('password123');
            console.log('   Password comparison:', passwordMatch ? 'PASS' : 'FAIL');
        } else {
            console.log('❌ User not found in database');
            return;
        }

        console.log('\n4. Testing backend API...');

        // Step 4: Test the API endpoint
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'admin@example.com',
                password: 'password123'
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            console.log('✅ API Login successful!');
            console.log('   Status:', response.status);
            console.log('   Response keys:', Object.keys(response.data));
            if (response.data.user) {
                console.log('   User email:', response.data.user.email);
                console.log('   User role:', response.data.user.role);
            }

        } catch (apiError) {
            console.log('❌ API Login failed');
            if (apiError.response) {
                console.log('   Status:', apiError.response.status);
                console.log('   Error:', apiError.response.data);
            } else if (apiError.code === 'ECONNREFUSED') {
                console.log('   Error: Cannot connect to backend server');
                console.log('   Make sure backend is running on port 5000');
            } else {
                console.log('   Error:', apiError.message);
            }
        }

        await mongoose.connection.close();
        console.log('\n✅ Debug completed');

    } catch (error) {
        console.error('❌ Debug failed:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
};

debugLogin();
