const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log(
      "MONGODB_URI CHECK:",
      process.env.MONGODB_URI ? "FOUND" : "MISSING"
    );

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI missing");
    }

    const conn = await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log(
      "MongoDB Connected:",
      conn.connection.host
    );

  } catch (error) {
    console.log(
      "Mongo Error:",
      error.message
    );
  }
};

module.exports = connectDB;