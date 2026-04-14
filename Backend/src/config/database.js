const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI missing in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Connected:", mongoose.connection.host);
  } catch (err) {
    console.log("MongoDB Error:", err.message);
  }
};

module.exports = connectDB;