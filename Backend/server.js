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
// Start server only after DB connection
const startServer = async () => {
  try {
    await connectDB(); // waits for MongoDB Atlas connection

    // 🚀 Always use process.env.PORT (CapRover sets this)
    const PORT = process.env.PORT;
    if (!PORT) {
      console.error("❌ PORT not set in environment variables! Exiting...");
      process.exit(1);
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
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
