const express = require("express");
const app = express();

app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("MINIMAL SERVER RUNNING ON", PORT);
});