const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI missing");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Connected");

    return conn;

  } catch (error) {
    console.error("Mongo Error:", error.message);
    throw error; // IMPORTANT: Re-throw to propagate error
  }
};

module.exports = connectDB;