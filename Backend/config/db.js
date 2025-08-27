const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Database URI:', process.env.MONGO_URI); // Log only the host part, not credentials

    const options = {
      bufferCommands: false, // Disable mongoose buffering
      serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
      socketTimeoutMS: 45000, // Close connections after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
      retryWrites: true,
      w: 'majority'
    };
    console.log('Attempting to connect to MongoDB...');
    const connection = await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`MongoDB Connected successfully to ${connection.connection.host}`);

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
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name).join(', '));

      // Specifically check for winningcandidates collection
      const hasWinningCandidates = collections.some(c => c.name === 'winningcandidates');
      console.log('winningcandidates collection exists:', hasWinningCandidates);

      if (hasWinningCandidates) {
        const count = await mongoose.connection.db.collection('winningcandidates').countDocuments();
        console.log('Number of documents in winningcandidates:', count);
      }
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