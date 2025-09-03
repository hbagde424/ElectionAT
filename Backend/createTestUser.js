// createTestUser.js - Create test users and user-role assignments
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Role = require('./models/Role');
const UserRole = require('./models/UserRole');

const createTestUsers = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to database');

        // Clear existing users and user-roles
        console.log('🧹 Clearing existing user data...');
        await UserRole.deleteMany({});
        await User.deleteMany({});
        console.log('✅ Cleared existing user data');

        // Create test users
        console.log('👤 Creating test users...');
        const password = await bcrypt.hash('password123', 10);

        const adminUser = await User.create({
            name: 'Admin User',
            username: 'admin',
            email: 'admin@example.com',
            password: password,
            mobile: '1234567890',
            role: 'Admin',
            isActive: true
        });
        console.log('✅ Created Admin User:', adminUser._id);

        const managerUser = await User.create({
            name: 'Manager User',
            username: 'manager',
            email: 'manager@example.com',
            password: password,
            mobile: '1234567891',
            role: 'Admin',
            isActive: true
        });
        console.log('✅ Created Manager User:', managerUser._id);

        const regularUser = await User.create({
            name: 'Regular User',
            username: 'user',
            email: 'user@example.com',
            password: password,
            mobile: '1234567892',
            role: 'State',
            isActive: true
        });
        console.log('✅ Created Regular User:', regularUser._id);

        // Get existing roles
        console.log('👥 Getting existing roles...');
        const roles = await Role.find({});
        console.log(`Found ${roles.length} roles`);

        const adminRole = roles.find(r => r.name === 'Admin');
        const managerRole = roles.find(r => r.name === 'Manager');
        const userRole = roles.find(r => r.name === 'User');

        // Create user-role assignments
        console.log('🔗 Creating user-role assignments...');

        if (adminRole) {
            await UserRole.create({
                user: adminUser._id,
                role: adminRole._id
            });
            console.log('✅ Assigned Admin role to Admin User');
        }

        if (managerRole) {
            await UserRole.create({
                user: managerUser._id,
                role: managerRole._id
            });
            console.log('✅ Assigned Manager role to Manager User');
        }

        if (userRole) {
            await UserRole.create({
                user: regularUser._id,
                role: userRole._id
            });
            console.log('✅ Assigned User role to Regular User');
        }

        console.log('\n🎉 Test users and assignments created successfully!');
        console.log('Summary:');
        console.log('- 3 users created');
        console.log('- 3 user-role assignments created');
        console.log('\nLogin credentials:');
        console.log('Admin: admin / password123');
        console.log('Manager: manager / password123');
        console.log('User: user / password123');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

createTestUsers();
