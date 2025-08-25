// server.js

// Load environment variables first
require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");

// Set NODE_ENV if not set
process.env.NODE_ENV = process.env.NODE_ENV || "development";


// Create HTTP server
const server = http.createServer(app);

// Start server only after DB connection
const startServer = async () => {
  try {
    await connectDB(); // waits for MongoDB Atlas connection
    server.listen(process.env.PORT || 5000, () => {
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV} mode on port ${process.env.PORT || 5000
        }`
      );
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
