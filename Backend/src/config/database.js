const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI not found in environment variables");
  }

  return mongoose.connect(process.env.MONGODB_URI);
};

module.exports = connectDB;