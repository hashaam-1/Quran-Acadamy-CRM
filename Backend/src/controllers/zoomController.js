const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');

// Zoom Meeting SDK signature generation
exports.generateSignature = async (req, res) => {
  try {
    console.log('Zoom signature request received at:', new Date().toISOString(), { meetingNumber, role, programmaticJoin: req.body.programmaticJoin });
    const { meetingNumber, role, programmaticJoin } = req.body;
    
    // Zoom SDK credentials from environment
    const SDK_KEY = process.env.ZOOM_SDK_KEY || 'YNdDIn95StmFL25wVBoGQ';
    const SDK_SECRET = process.env.ZOOM_SDK_SECRET || '3EAhP2bxllkQHBHeZndDiA4jiz0AfEZr';
    
    // Validate required fields
    if (!meetingNumber || role === undefined) {
      return res.status(400).json({ 
        error: 'Meeting number and role are required' 
      });
    }
    
    // Generate signature
    const signature = generateZoomSignature(SDK_KEY, SDK_SECRET, meetingNumber, role);
    
    console.log(`Zoom signature generated for meeting ${meetingNumber}, role: ${role}`);
    
    res.json({ signature });
  } catch (error) {
    console.error('Error generating Zoom signature:', error);
    res.status(500).json({ error: 'Failed to generate signature' });
  }
};

// Helper function to generate Zoom signature
function generateZoomSignature(sdkKey, sdkSecret, meetingNumber, role) {
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2; // 2 hours expiration
  
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    appKey: sdkKey,
    sdkKey: sdkKey,
    mn: meetingNumber,
    role: role,
    iat: iat,
    exp: exp,
    tokenExp: exp
  };
  
  // Encode header and payload
  const encodedHeader = base64UrlEscape(Buffer.from(JSON.stringify(header)).toString('base64'));
  const encodedPayload = base64UrlEscape(Buffer.from(JSON.stringify(payload)).toString('base64'));
  
  // Create signature
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = base64UrlEscape(
    CryptoJS.HmacSHA256(signatureInput, sdkSecret).toString(CryptoJS.enc.Base64)
  );
  
  return `${signatureInput}.${signature}`;
}

// Helper function for base64 URL encoding
function base64UrlEscape(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Create meeting endpoint (optional - for creating meetings via API)
exports.createMeeting = async (req, res) => {
  try {
    const { topic, duration, startTime } = req.body;
    
    // This would require OAuth token if you want to create meetings via API
    // For now, we'll return a mock meeting number
    const meetingNumber = Math.floor(10000000000 + Math.random() * 90000000000);
    
    res.json({
      meetingNumber,
      topic: topic || 'Quran Class',
      duration: duration || 60,
      startTime: startTime || new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
};

// Get meeting info endpoint
exports.getMeetingInfo = async (req, res) => {
  try {
    const { meetingNumber } = req.params;
    
    // Mock meeting info - in production, this would call Zoom API
    res.json({
      meetingNumber,
      topic: 'Quran Class',
      password: '',
      hostEmail: 'teacher@quranacademy.com',
      startTime: new Date().toISOString(),
      duration: 60
    });
  } catch (error) {
    console.error('Error getting meeting info:', error);
    res.status(500).json({ error: 'Failed to get meeting info' });
  }
};
