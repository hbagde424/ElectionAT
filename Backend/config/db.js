const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    const options = {
      bufferCommands: false, // Disable mongoose buffering
      serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
      socketTimeoutMS: 45000, // Close connections after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
      retryWrites: true,
      w: 'majority'
    };
    await mongoose.connect(process.env.MONGO_URI, options);

    // Wait for the connection to be ready and ensure db is available
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        resolve();
      } else {
        mongoose.connection.once('connected', resolve);
      }
    });

    // Test the connection by running a simple query
    if (mongoose.connection.db) {
      await mongoose.connection.db.listCollections().toArray();
    } else {
      console.log('Database connection established but db object not available yet');
    }

  } catch (err) {
    console.error('MongoDB connection error:', {
      message: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack
    });
    process.exit(1);
  }
};

module.exports = connectDB;