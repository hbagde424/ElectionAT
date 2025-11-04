const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const UserRole = require('./models/UserRole');

// Connect to MongoDB Atlas
const MONGO_URI = 'mongodb+srv://developer:Hh@1q2w3e4r5t6y7u8i9o@cluster0.8ehw8jn.mongodb.net/ElectionAtlas';
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

async function testData() {
    try {
        console.log('=== Testing Users ===');
        const users = await User.find({}).select('_id username email').limit(5);
        console.log(`Found ${users.length} users:`, users);

        console.log('\n=== Testing Roles ===');
        const roles = await Role.find({}).limit(5);
        console.log(`Found ${roles.length} roles:`, roles);

        console.log('\n=== Testing UserRoles ===');
        const userRoles = await UserRole.find({}).populate('user', 'username').populate('role', 'name').limit(5);
        console.log(`Found ${userRoles.length} user-roles:`, userRoles);

        console.log('\n=== Testing Users for Roles endpoint ===');
        const usersForRoles = await User.find({}).select('_id username email mobile role').limit(5);
        console.log(`Users for roles:`, usersForRoles);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

testData();
