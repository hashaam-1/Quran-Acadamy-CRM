const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("MONGODB_URI TYPE:", typeof process.env.MONGODB_URI);
    console.log("MONGODB_URI LENGTH:", process.env.MONGODB_URI?.length);
    console.log(
      "MONGODB_URI JSON:",
      JSON.stringify(process.env.MONGODB_URI)
    );
    console.log(
      "MONGODB_URI CHECK:",
      process.env.MONGODB_URI ? "FOUND" : "MISSING"
    );

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI missing");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(
      "MongoDB Connected:",
      conn.connection.host
    );

    return conn;

  } catch (error) {
    console.error("Mongo Error:", error.message);
    throw error; // IMPORTANT: Re-throw to propagate error
  }
};

module.exports = connectDB;