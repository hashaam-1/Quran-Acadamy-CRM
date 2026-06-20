const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("MONGO URI:", process.env.MONGODB_URI ? "FOUND" : "MISSING");

    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI missing");
    }

    await mongoose.connect(uri.trim(), {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });

    console.log("MongoDB Connected:", mongoose.connection.host);
  } catch (err) {
    console.error("MongoDB Error:", err.message);
    // Don't kill Railway container - let it handle the error
  }
};

module.exports = connectDB;