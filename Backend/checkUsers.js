const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
    try {
        await mongoose.connect('mongodb://localhost:27017/electionat');
        console.log('Connected to MongoDB');

        const userCount = await User.countDocuments();
        console.log(`Total users in database: ${userCount}`);

        if (userCount > 0) {
            const users = await User.find().select('username email role createdAt').limit(10);
            console.log('Sample users:');
            users.forEach(user => {
                console.log(`- ${user.username} (${user.email}) - Role: ${user.role} - Created: ${user.createdAt}`);
            });
        } else {
            console.log('No users found in database');
            console.log('You may need to create some users first');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
}

checkUsers();
