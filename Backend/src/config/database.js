const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.log("⚠️ MONGODB_URI missing");
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB Connected:", mongoose.connection.host);
  } catch (err) {
    console.log("MongoDB Error:", err.message);
  }
};

module.exports = connectDB;