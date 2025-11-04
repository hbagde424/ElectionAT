// quickClean.js - Quick database cleanup
require('dotenv').config();
const mongoose = require('mongoose');

const quickClean = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);

        const db = mongoose.connection.db;

        // Drop the collections that are causing issues
        try {
            await db.collection('rolepermissions').drop();
            console.log('Dropped rolepermissions collection');
        } catch (e) {
            console.log('RolePermissions collection not found or already empty');
        }

        try {
            await db.collection('roles').drop();
            console.log('Dropped roles collection');
        } catch (e) {
            console.log('Roles collection not found or already empty');
        }

        try {
            await db.collection('permissions').drop();
            console.log('Dropped permissions collection');
        } catch (e) {
            console.log('Permissions collection not found or already empty');
        }

        console.log('Cleanup completed');
        await mongoose.connection.close();

    } catch (error) {
        console.error('Error:', error);
    }
};

quickClean();
