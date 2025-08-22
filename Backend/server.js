// Load environment variables first
require('dotenv').config();

const app = require('./app');
const http = require('http');
const config = require('./config/config');

// Set NODE_ENV if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Debug environment variables (remove in production if needed)
console.log('Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set (hidden for security)' : 'NOT SET');

const server = http.createServer(app);

// Connect to database first
require('./config/db')()
  .then(() => {
    server.listen(config.PORT, () => {
      console.log(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});