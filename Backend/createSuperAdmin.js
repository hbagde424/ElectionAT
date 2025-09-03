// createSuperAdmin.js - Simple Super Admin creation
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
    try {
        console.log('Creating Super Admin...');

        // Connect to database
        await mongoose.connect('mongodb+srv://developer:Hh1q2w3e4r5t6y7u8i9o0p@cluster0.8ehw8jn.mongodb.net/electionAT');
        console.log('Connected to database');

        // Define User schema
        const userSchema = new mongoose.Schema({
            username: { type: String, required: true, unique: true },
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true, select: false },
            mobile: { type: String, required: true, unique: true },
            role: { type: String, required: true },
            isActive: { type: Boolean, default: true },
            created_at: { type: Date, default: Date.now },
            updated_at: { type: Date, default: Date.now }
        });

        userSchema.methods.comparePassword = async function (candidatePassword) {
            return await bcrypt.compare(candidatePassword, this.password);
        };

        const User = mongoose.model('User', userSchema);

        // Check if Super Admin already exists
        let superAdmin = await User.findOne({ email: 'superadmin@example.com' });

        if (superAdmin) {
            console.log('Super Admin already exists, updating password...');
            const hashedPassword = await bcrypt.hash('superadmin@123', 10);
            superAdmin.password = hashedPassword;
            superAdmin.isActive = true;
            superAdmin.role = 'superAdmin';
            await superAdmin.save();
        } else {
            console.log('Creating new Super Admin...');
            const hashedPassword = await bcrypt.hash('superadmin@123', 10);

            superAdmin = new User({
                username: 'superadmin',
                email: 'superadmin@example.com',
                password: hashedPassword,
                mobile: '9999999999',
                role: 'superAdmin',
                isActive: true
            });

            await superAdmin.save();
        }

        console.log('Super Admin created successfully!');
        console.log('Email: superadmin@example.com');
        console.log('Password: superadmin@123');
        console.log('Role: superAdmin');

        // Verify the user
        const savedUser = await User.findOne({ email: 'superadmin@example.com' }).select('+password');
        if (savedUser) {
            const passwordTest = await savedUser.comparePassword('superadmin@123');
            console.log('Password test:', passwordTest ? 'PASS' : 'FAIL');
        }

        await mongoose.disconnect();
        console.log('Setup complete!');

    } catch (error) {
        console.error('Error:', error.message);
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    }
}

createSuperAdmin();
