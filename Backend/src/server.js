console.log("SERVER STARTING...");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database.js");

dotenv.config();

const app = express();

/* =========================
   HEALTH CHECK (FAST RESPONSE)
========================= */
app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

/* =========================
   MIDDLEWARE (MINIMAL SAFE)
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   TEST ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("Backend Running");
});

/* =========================
   START SERVER (SAFE ORDER)
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log("SERVER RUNNING ON PORT:", PORT);

  try {
    await connectDB();
    console.log("DB CONNECTED");
  } catch (err) {
    console.log("DB ERROR:", err.message);
  }
});

module.exports = app;