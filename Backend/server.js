// server.js

// Load environment variables first
require("dotenv").config({ path: __dirname + '/.env' });

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");

// Set NODE_ENV if not set
process.env.NODE_ENV = process.env.NODE_ENV || "development";



// Create HTTP server
const server = http.createServer(app);

// Start server only after DB connection
// Function to find an available port
const findAvailablePort = async (startPort) => {
  const net = require('net');
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
    server.listen(startPort, () => {
      server.close(() => {
        resolve(startPort);
      });
    });
  });
};

// Start server only after DB connection
const startServer = async () => {
  try {
    await connectDB(); // waits for MongoDB Atlas connection

    // Use PORT from environment or find available port starting from 5000
    const desiredPort = process.env.PORT || 5000;
    const PORT = await findAvailablePort(desiredPort);

    server.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      if (PORT !== desiredPort) {
        console.log(`Note: Original port ${desiredPort} was in use, using port ${PORT} instead`);
      }
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle SIGINT / SIGTERM (graceful shutdown)
process.on("SIGINT", () => {
  console.log("👋 Shutting down gracefully (SIGINT)...");
  server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("👋 Shutting down gracefully (SIGTERM)...");
  server.close(() => process.exit(0));
});
