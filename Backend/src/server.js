console.log("SERVER STARTING...");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database.js");

dotenv.config();

const app = express();

/* =========================
   HEALTH CHECK (MUST BE FIRST)
========================= */
app.get("/api/health", (req, res) => {
  return res.status(200).send("OK");
});

/* =========================
   BASIC MIDDLEWARE ONLY
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   ONLY TEST ROUTE FIRST
   (IMPORTANT FOR RAILWAY)
========================= */

app.get("/", (req, res) => {
  res.send("Backend Running");
});

/* =========================
   START SERVER (FIXED FLOW)
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("SERVER RUNNING ON PORT:", PORT);

  connectDB()
    .then(() => console.log("DB CONNECTED"))
    .catch((err) => console.log("DB ERROR:", err.message));
});