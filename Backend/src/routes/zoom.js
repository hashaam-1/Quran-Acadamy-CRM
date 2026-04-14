const express = require("express");
const crypto = require("crypto");

const router = express.Router();

console.log("🚀 ZOOM ROUTER LOADED");


// ===============================
// WEB SDK SIGNATURE (OK - FIXED STYLE)
// ===============================
router.post("/signature-test", (req, res) => {
  try {
    const { meetingNumber, role = 0 } = req.body;

    const sdkKey = process.env.ZOOM_SDK_KEY;
    const sdkSecret = process.env.ZOOM_SDK_SECRET;

    if (!meetingNumber) {
      return res.status(400).json({ error: "meetingNumber required" });
    }

    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" })
    ).toString("base64url");

    const payload = Buffer.from(
      JSON.stringify({
        sdkKey,
        mn: meetingNumber,
        role,
        iat,
        exp,
        appKey: sdkKey,
        tokenExp: exp,
      })
    ).toString("base64url");

    const msg = `${header}.${payload}`;

    const hash = crypto
      .createHmac("sha256", sdkSecret)
      .update(msg)
      .digest("base64url");

    const signature = `${msg}.${hash}`;

    return res.json({ signature });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// ===============================
// WEBHOOK (FIXED 100%)
// ===============================
router.post("/webhook", (req, res) => {
  try {
    const body = req.body;

    console.log("📩 FULL WEBHOOK BODY:", JSON.stringify(body, null, 2));

    // ===============================
    // URL VALIDATION (FIXED)
    // ===============================
    if (body.event === "endpoint.url_validation") {
      const plainToken = body.payload?.plainToken;

      const hash = crypto
        .createHmac("sha256", process.env.ZOOM_SECRET_TOKEN)
        .update(plainToken)
        .digest("hex"); // ✅ MUST BE HEX

      console.log("✅ ZOOM URL VERIFIED");

      return res.json({
        plainToken,
        encryptedToken: hash,
      });
    }

    // ===============================
    // EVENTS
    // ===============================
    switch (body.event) {
      case "meeting.started":
        console.log("🎥 Meeting Started");
        break;

      case "meeting.ended":
        console.log("🛑 Meeting Ended");
        break;

      case "meeting.participant_joined":
        console.log("👤 Participant Joined");
        break;

      case "meeting.participant_left":
        console.log("👤 Participant Left");
        break;
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.sendStatus(500);
  }
});

module.exports = router;