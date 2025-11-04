// createUser.js - Create test user for login
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createUser() {
    try {
        console.log('Starting user creation...');

        // Connect directly with the connection string
        await mongoose.connect('mongodb+srv://developer:Hh1q2w3e4r5t6y7u8i9o0p@cluster0.8ehw8jn.mongodb.net/electionAT');
        console.log('Connected to database');

        // Define User schema exactly as in the model
        const userSchema = new mongoose.Schema({
            username: {
                type: String,
                required: true,
                trim: true,
                unique: true
            },
            mobile: {
                type: String,
                required: true,
                unique: true,
                trim: true
            },
            email: {
                type: String,
                required: true,
                unique: true,
                lowercase: true,
                trim: true
            },
            password: {
                type: String,
                required: true,
                select: false
            },
            role: {
                type: String,
                enum: ['superAdmin', 'State', 'Admin', 'Booth', 'Division', 'Parliament', 'Block', 'Assembly'],
                required: true
            },
            isActive: {
                type: Boolean,
                default: true
            },
            created_at: {
                type: Date,
                default: Date.now
            },
            updated_at: {
                type: Date,
                default: Date.now
            }
        });

        // Add comparePassword method
        userSchema.methods.comparePassword = async function (candidatePassword) {
            return await bcrypt.compare(candidatePassword, this.password);
        };

        const User = mongoose.model('User', userSchema);

        // Clear existing users
        console.log('Clearing users...');
        await User.deleteMany({});

        // Create admin user
        console.log('Creating admin user...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        const adminUser = new User({
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
            mobile: '1234567890',
            role: 'Admin',
            isActive: true
        });

        await adminUser.save();
        console.log('Admin user created successfully');

        // Verify user exists
        const savedUser = await User.findOne({ email: 'admin@example.com' }).select('+password');
        if (savedUser) {
            console.log('User verified in database:');
            console.log('  Email:', savedUser.email);
            console.log('  Username:', savedUser.username);
            console.log('  Role:', savedUser.role);
            console.log('  Active:', savedUser.isActive);
            console.log('  Password hash length:', savedUser.password?.length);

            // Test password
            const passwordTest = await savedUser.comparePassword('password123');
            console.log('  Password test result:', passwordTest);
        }

        await mongoose.disconnect();
        console.log('Database disconnected');
        console.log('\n✅ Setup complete! Try login with:');
        console.log('Email: admin@example.com');
        console.log('Password: password123');

    } catch (error) {
        console.error('Error:', error.message);
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    }
}

createUser();
