// test-connection.js
require("dotenv").config({ path: __dirname + '/.env' });
const connectDB = require("./config/db");

const testConnection = async () => {
    try {
        console.log("Testing MongoDB connection...");
        await connectDB();
        console.log("✅ Connection test successful!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Connection test failed:", error);
        process.exit(1);
    }
};

testConnection();
