const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI missing in .env");
    }

    // Enhanced connection options for Railway deployment
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increased timeout for Railway
      socketTimeoutMS: 45000, // Increased socket timeout
      connectTimeoutMS: 30000, // Increased connection timeout
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
      maxPoolSize: 10, // Connection pool size
      minPoolSize: 2, // Minimum connections
    });

    console.log("MongoDB Connected:", mongoose.connection.host);
  } catch (err) {
    console.log("MongoDB Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;