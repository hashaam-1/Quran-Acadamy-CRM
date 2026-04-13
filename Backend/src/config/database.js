const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI missing");
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB Connected");

  } catch (err) {
    console.error("DB ERROR:", err.message);
    // DO NOT crash Railway
  }
};

module.exports = connectDB;