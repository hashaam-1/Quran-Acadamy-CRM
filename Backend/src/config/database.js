const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    console.log("Mongo URI exists:", !!uri);

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