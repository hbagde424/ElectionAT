const mongoose = require('mongoose');
const config = require('./config/config');

// Simple connection test
const testConnection = async () => {
    try {
        console.log('🔍 Testing MongoDB connection...');
        console.log('Connection URI:', config.MONGO_URI ? 'URI found' : 'URI missing');

        await mongoose.connect(config.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ MongoDB connected successfully!');

        // Test basic operations
        const Permission = require('./models/Permission');
        const permissionCount = await Permission.countDocuments();
        console.log(`📊 Current permissions in database: ${permissionCount}`);

        const Role = require('./models/Role');
        const roleCount = await Role.countDocuments();
        console.log(`📊 Current roles in database: ${roleCount}`);

        const User = require('./models/User');
        const userCount = await User.countDocuments();
        console.log(`📊 Current users in database: ${userCount}`);

        if (userCount > 0) {
            const users = await User.find().limit(5).select('email firstName lastName');
            console.log('👥 Sample users:');
            users.forEach(user => {
                console.log(`   - ${user.email} (${user.firstName} ${user.lastName})`);
            });
        }

        console.log('🎉 Database connection test completed!');

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.error('Full error:', error);
    } finally {
        mongoose.connection.close();
    }
};

testConnection();
