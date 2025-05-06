const app = require('./app');
const http = require('http');
const config = require('./config/config');

// Set NODE_ENV if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const server = http.createServer(app);

require('dotenv').config();

server.listen(config.PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});