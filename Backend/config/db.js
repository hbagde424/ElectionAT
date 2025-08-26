const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Database URI:', config.MONGO_URI.split('@')[1]); // Log only the host part, not credentials

    const options = {
      bufferCommands: false, // Disable mongoose buffering
      serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
      socketTimeoutMS: 45000, // Close connections after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
      retryWrites: true,
      w: 'majority'
    };

    const connection = await mongoose.connect(config.MONGO_URI, options);
    console.log(`MongoDB Connected successfully to ${connection.connection.host}`);

    // Test the connection by running a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', '));

    // Specifically check for winningcandidates collection
    const hasWinningCandidates = collections.some(c => c.name === 'winningcandidates');
    console.log('winningcandidates collection exists:', hasWinningCandidates);

    if (hasWinningCandidates) {
      const count = await mongoose.connection.db.collection('winningcandidates').countDocuments();
      console.log('Number of documents in winningcandidates:', count);
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