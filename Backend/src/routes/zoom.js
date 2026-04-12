const express = require("express");
const crypto = require("crypto");
const router = express.Router();

console.log("ZOOM FILE UPDATED - FORCE DEPLOY CHECK - " + new Date().toISOString());
console.log("zoom.js FILE LOADED - STEP 2 DEBUG");
console.log("Zoom.js route file loaded - POST /signature-test endpoint available (mounted at /api/zoom)");
console.log("ACTIVE ZOOM ROUTER LOADED - SINGLE SYSTEM");

router.post("/signature-test", (req, res) => {
  console.log("SIGNATURE ROUTE HIT - STEP 2 DEBUG");
  try {
    const { meetingNumber, role = 0 } = req.body;

    const sdkKey = process.env.ZOOM_SDK_KEY;
    const sdkSecret = process.env.ZOOM_SDK_SECRET;

    if (!meetingNumber) {
      return res.status(400).json({ error: "meetingNumber required" });
    }

    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const header = Buffer.from(JSON.stringify({
      alg: "HS256",
      typ: "JWT"
    })).toString("base64url");

    const payload = Buffer.from(JSON.stringify({
      sdkKey,
      mn: meetingNumber,
      role,
      iat,
      exp,
      appKey: sdkKey,
      tokenExp: exp
    })).toString("base64url");

    const msg = `${header}.${payload}`;

    const hash = crypto
      .createHmac("sha256", sdkSecret)
      .update(msg)
      .digest("base64url");

    const signature = `${msg}.${hash}`;

    res.json({ signature });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
