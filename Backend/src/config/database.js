const mongoose = require("mongoose");

const connectDB = async () => {
  console.log("🔍 ENV CHECK:", process.env.MONGODB_URI ? "MONGODB_URI FOUND" : "MONGODB_URI NOT FOUND");
  
  // Enhanced debugging: Show all ENV keys containing MONGO
  const mongoEnvKeys = Object.keys(process.env).filter(k => k.includes("MONGO"));
  console.log("🔍 MONGO ENV KEYS:", mongoEnvKeys);
  
  // Show all ENV keys for debugging
  const allEnvKeys = Object.keys(process.env);
  console.log("🔍 TOTAL ENV KEYS COUNT:", allEnvKeys.length);
  console.log("🔍 ALL ENV KEYS:", allEnvKeys);

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI missing in .env");
    }

    // Trim whitespace from MONGODB_URI to handle hidden spaces
    const mongoUri = process.env.MONGODB_URI.trim();
    console.log("🔍 MONGODB_URI LENGTH:", mongoUri.length);
    console.log("🔍 MONGODB_URI FIRST 50 CHARS:", mongoUri.substring(0, 50));

    // Enhanced connection options for Railway deployment
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000, // Increased timeout for Railway
      socketTimeoutMS: 45000, // Increased socket timeout
      connectTimeoutMS: 30000, // Increased connection timeout
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
      maxPoolSize: 10, // Connection pool size
      minPoolSize: 2, // Minimum connections
    });

    console.log("🟢 MongoDB Connected:", mongoose.connection.host);
  } catch (err) {
    console.log("❌ MongoDB Error:", err.message);
    throw err; // Throw instead of process.exit(1) to allow Railway to handle restart
  }
};

module.exports = connectDB;