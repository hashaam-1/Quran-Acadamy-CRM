const Meeting = require("../models/Meeting");
const Schedule = require("../models/Schedule");
const crypto = require("crypto");

let axios = null;
try {
  axios = require("axios");
} catch (err) {
  console.log("Axios not installed - Zoom disabled");
}

/* =====================
   GENERATE ZOOM SIGNATURE (CRITICAL - WAS MISSING)
===================== */
const generateZoomSignature = async ({ meetingNumber, role = 0 }) => {
  try {
    console.log('🔍 Generating Zoom signature:', { meetingNumber, role });
    
    // Check environment variables
    const sdkKey = process.env.ZOOM_SDK_KEY;
    const sdkSecret = process.env.ZOOM_SDK_SECRET;
    
    console.log('🔍 Zoom ENV check:', {
      hasSdkKey: !!sdkKey,
      hasSdkSecret: !!sdkSecret,
      sdkKeyPrefix: sdkKey ? sdkKey.substring(0, 10) + "..." : "undefined"
    });
    
    if (!sdkKey || !sdkSecret) {
      console.error('❌ Missing Zoom SDK credentials');
      throw new Error('Missing Zoom SDK credentials');
    }
    
    if (!meetingNumber) {
      console.error('❌ Missing meeting number');
      throw new Error('Meeting number is required');
    }
    
    // Validate meeting number format
    if (!/^\d+$/.test(meetingNumber)) {
      console.error('❌ Invalid meeting number format:', meetingNumber);
      throw new Error('Invalid meeting number format - must be numeric');
    }
    
    // Generate JWT signature
    const iat = Math.floor(Date.now() / 1000) - 30; // Issue 30 seconds ago
    const exp = iat + 60 * 60 * 2; // Expire in 2 hours
    
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" })
    ).toString("base64url");
    
    const payload = Buffer.from(
      JSON.stringify({
        sdkKey,
        mn: meetingNumber,
        role: role,
        iat,
        exp,
        appKey: sdkKey,
        tokenExp: exp,
        video_webrtc_mode: 1, // Enable WebRTC mode
      })
    ).toString("base64url");
    
    const msg = `${header}.${payload}`;
    
    const hash = crypto
      .createHmac("sha256", sdkSecret)
      .update(msg)
      .digest("base64url");
    
    const signature = `${msg}.${hash}`;
    
    console.log('✅ Zoom signature generated successfully:', {
      meetingNumber,
      role,
      signatureLength: signature.length,
      signaturePreview: signature.substring(0, 50) + "..."
    });
    
    return signature;
    
  } catch (error) {
    console.error('❌ Error generating Zoom signature:', error.message);
    throw error;
  }
};

/* =====================
   GENERATE UNIQUE MEETING ID (FIXED - NUMERIC ONLY)
===================== */
const generateMeetingNumber = () => {
  // Generate VALID numeric meeting number (9-11 digits like real Zoom)
  const timestamp = Date.now().toString();
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  // Take last 9-11 digits to ensure valid Zoom format
  const fullNumber = timestamp + randomSuffix;
  return fullNumber.slice(-11); // Return last 11 digits
};

/* =====================
   ZOOM (SERVER-TO-SERVER OAUTH)
===================== */
const getZoomAccessToken = async () => {
  try {
    if (!axios) {
      console.log("Axios not available");
      return null;
    }

    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    const accountId = process.env.ZOOM_ACCOUNT_ID;

    console.log("Zoom OAuth Credentials Check:", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasAccountId: !!accountId,
      clientIdLength: clientId?.length || 0,
      accountIdLength: accountId?.length || 0,
      clientId: clientId?.substring(0, 10) + "...",
      accountId: accountId?.substring(0, 10) + "..."
    });

    if (!clientId || !clientSecret || !accountId) {
      console.log("Missing Zoom OAuth credentials - check Railway environment variables");
      console.log("Required: ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_ACCOUNT_ID");
      return null;
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    console.log("Attempting Zoom OAuth token request...");
    console.log("OAuth URL:", `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`);
    console.log("Basic auth preview:", `Basic ${credentials.substring(0, 20)}...`);
    
    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      {},
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log("Zoom OAuth response status:", response.status);
    console.log("Zoom OAuth response data:", {
      access_token: response.data.access_token ? "RECEIVED" : "MISSING",
      token_type: response.data.token_type,
      expires_in: response.data.expires_in
    });

    if (!response.data.access_token) {
      console.log("OAuth response missing access token");
      return null;
    }

    console.log("Zoom OAuth success - token received");
    return response.data.access_token;
  } catch (err) {
    console.log("Zoom OAuth Error:", err.message);
    console.log("Zoom OAuth Error Details:", err.response?.data || err);
    console.log("Zoom OAuth Status:", err.response?.status);
    console.log("Zoom OAuth Headers:", err.response?.headers);
    return null;
  }
};

const createZoomMeeting = async ({ topic, startTime, duration = 60 }) => {
  try {
    if (!axios) {
      console.log("Axios not available for Zoom API");
      return null;
    }

    console.log("Creating Zoom meeting with params:", { topic, startTime, duration });

    const accessToken = await getZoomAccessToken();
    if (!accessToken) {
      console.log("Failed to get Zoom access token - cannot create meeting");
      return null;
    }

    console.log("Got access token, creating Zoom meeting...");
    console.log("Access token length:", accessToken.length);
    console.log("Access token preview:", accessToken.substring(0, 20) + "...");

    const meetingRequest = {
      topic,
      type: 2, // Scheduled meeting (more unique than type=1)
      start_time: startTime,
      duration: duration,
      settings: {
        join_before_host: true, // IMPORTANT: Allow participants to join before host
        participant_video: true,
        host_video: true,
        mute_upon_entry: false,
        waiting_room: false, // IMPORTANT: No waiting room to prevent conflicts
        auto_recording: 'none'
      }
    };

    console.log("Zoom meeting request payload:", meetingRequest);

    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      meetingRequest,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("Zoom API response status:", response.status);
    console.log("Zoom meeting created successfully:", response.data.id);
    console.log("Zoom meeting details:", {
      id: response.data.id,
      topic: response.data.topic,
      join_url: response.data.join_url,
      start_url: response.data.start_url,
      password: response.data.password
    });

    return response.data;
  } catch (err) {
    console.log("Zoom Meeting Creation Error:", err.message);
    console.log("Zoom API Error Details:", err.response?.data || err);
    console.log("Zoom API Status:", err.response?.status);
    console.log("Zoom API Headers:", err.response?.headers);
    return null;
  }
};

/* =====================
   START CLASS (FIXED)
===================== */
const startClass = async (req, res) => {
  try {
    const { className, course, scheduleId } = req.body;

    console.log("START CLASS REQUEST:", { className, course, scheduleId });

    // CRITICAL DEBUG - Check Zoom environment variables
    console.log("ZOOM ENV CHECK:", {
      account: !!process.env.ZOOM_ACCOUNT_ID,
      client: !!process.env.ZOOM_CLIENT_ID,
      secret: !!process.env.ZOOM_CLIENT_SECRET,
      token: !!process.env.ZOOM_ACCESS_TOKEN,
      accountValue: process.env.ZOOM_ACCOUNT_ID?.substring(0, 10) + "...",
      clientValue: process.env.ZOOM_CLIENT_ID?.substring(0, 10) + "...",
      tokenValue: process.env.ZOOM_ACCESS_TOKEN?.substring(0, 20) + "..."
    });

    // SAFE USER HANDLING (IMPORTANT FIX)
    const teacherId = req.user?.id || "guest";
    const teacherName = req.user?.name || "Guest";

    // Check for existing live meeting (SMART RECOVERY LOGIC)
    let existing = null;
    try {
      existing = await Meeting.findOne({
        scheduleId,
        status: { $in: ["live"] },
      });
    } catch (dbErr) {
      console.log("DB query error:", dbErr.message);
    }

    // Smart recovery instead of blocking - allow multiple hosts
    if (existing) {
      console.log("Rejoining existing live meeting:", existing.meetingNumber);
      
      // Add current user as participant if not already added
      const alreadyParticipant = existing.participants.find(
        (p) => String(p.userId) === String(teacherId)
      );
      
      if (!alreadyParticipant) {
        // Assign role based on user role to prevent host conflicts
        const userRole = req.user?.role || 'student';
        const participantRole = userRole === 'teacher' ? 1 : 0; // Only teachers are hosts
        
        existing.participants.push({
          userId: teacherId,
          name: teacherName,
          role: participantRole, // Role based on user type
        });
        await existing.save();
      }
      
      return res.json({
        success: true,
        message: "Rejoining existing class",
        meeting: existing,
        rejoin: true,
      });
    }

    // REQUIRE REAL ZOOM MEETING
    let zoom;
    try {
      console.log("CREATING ZOOM MEETING:", {
        topic: `${className} - ${course}`,
        startTime: new Date().toISOString(),
        className,
        course,
        scheduleId
      });
      
      // Use the proper OAuth flow - get access token first
      const accessToken = await getZoomAccessToken();
      if (!accessToken) {
        console.error("FAILED TO GET ZOOM ACCESS TOKEN");
        return res.status(500).json({
          success: false,
          message: "Failed to get Zoom access token - check environment variables",
          debug: {
            hasClientId: !!process.env.ZOOM_CLIENT_ID,
            hasClientSecret: !!process.env.ZOOM_CLIENT_SECRET,
            hasAccountId: !!process.env.ZOOM_ACCOUNT_ID
          }
        });
      }

      console.log("GOT ACCESS TOKEN, creating Zoom meeting...");
      
      // Direct Zoom API call with proper authentication
      const zoomResponse = await axios.post(
        "https://api.zoom.us/v2/users/me/meetings",
        {
          topic: `${className} - ${course}`,
          type: 2,
          start_time: new Date().toISOString(),
          duration: 60,
          timezone: "Asia/Karachi",
          password: crypto.randomBytes(3).toString('hex'), // Generate random 6-char password
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            waiting_room: false,
            mute_upon_entry: false
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("ZOOM SUCCESS:", zoomResponse.data);
      zoom = zoomResponse.data;
      
      // Debug password fields from Zoom API
      console.log("ZOOM PASSWORD DEBUG:", {
        password: zoom.password,
        encrypted_password: zoom.encrypted_password,
        join_url_pwd: zoom.join_url?.match(/pwd=([^&]+)/)?.[1],
        h323_password: zoom.h323_password,
        pstn_password: zoom.pstn_password
      });
      
    } catch (zErr) {
      console.log("ZOOM ERROR FULL:", zErr.response?.data || zErr.message);
      console.log("ZOOM ERROR STATUS:", zErr.response?.status);
      console.log("ZOOM ERROR HEADERS:", zErr.response?.headers);
      
      return res.status(500).json({
        success: false,
        message: "Zoom API failed",
        error: zErr.response?.data || zErr.message,
        status: zErr.response?.status,
        debug: {
          hasClientId: !!process.env.ZOOM_CLIENT_ID,
          hasClientSecret: !!process.env.ZOOM_CLIENT_SECRET,
          hasAccountId: !!process.env.ZOOM_ACCOUNT_ID
        }
      });
    }

    // Validate Zoom meeting creation
    if (!zoom?.id) {
      console.error("INVALID ZOOM RESPONSE:", zoom);
      return res.status(500).json({
        success: false,
        message: "Zoom returned no meeting ID",
        zoomResponse: zoom
      });
    }

    console.log("ZOOM MEETING CREATED SUCCESSFULLY:", zoom.id);
      console.log("Zoom meeting password:", zoom.password);
      console.log("Zoom meeting join_url:", zoom.join_url);
      console.log("Zoom meeting start_url:", zoom.start_url);
      console.log("Full Zoom response:", JSON.stringify(zoom, null, 2));

    let meeting;

    try {
      // Assign role based on user role to prevent host conflicts
      const userRole = req.user?.role || 'student';
      const creatorRole = userRole === 'teacher' ? 1 : 0; // Only teachers are hosts
      
      // ENSURE REAL PASSWORD IS STORED
      const actualPassword = zoom.password || crypto.randomBytes(3).toString('hex');
      
      meeting = await Meeting.create({
        className,
        course,
        scheduleId,
        teacherId,
        teacherName,
        meetingNumber: String(zoom.id), // Use real Zoom meeting ID as string
        status: "live",
        zoomMeetingId: String(zoom.id), // Use real Zoom meeting ID as string
        zoomPassword: actualPassword, // ✅ Store actual password
        plainPassword: actualPassword, // ✅ Store actual password
        zoomJoinUrl: zoom.join_url,
        zoomStartUrl: zoom.start_url,
        participants: [
          {
            userId: teacherId,
            name: teacherName,
            role: creatorRole,
          },
        ],
      });

      console.log("MEETING CREATED WITH PASSWORDS:", {
        zoomPassword: meeting.zoomPassword,
        plainPassword: meeting.plainPassword
      });
    } catch (createErr) {
      console.error("Meeting create error:", createErr.message);

      return res.status(500).json({
        success: false,
        message: "Database error creating meeting",
        error: createErr.message,
      });
    }

    return res.json({
      success: true,
      meeting,
    });
  } catch (err) {
    console.error("START CLASS CRASH:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Failed to start class",
    });
  }
};

/* =====================
   JOIN CLASS (PERFECT - ALL ROLES)
===================== */
const joinClass = async (req, res) => {
  try {
    const { meetingNumber, meetingId } = req.params;
    const { userId: bodyUserId, userName: bodyUserName, scheduleId, teacherName, course, time, studentName, studentId, userRole } = req.body || {};

    console.log('🔍 Join class request:', { meetingNumber, meetingId, scheduleId, userRole });
    console.log('🔍 DEBUG: Full req.body:', req.body);
    console.log('🔍 DEBUG: req.body type:', typeof req.body);
    console.log('🔍 DEBUG: req.body keys:', req.body ? Object.keys(req.body) : 'undefined');

    // ✅ PERFECT: Better validation with role context
    if (!meetingNumber && !meetingId) {
      return res.status(400).json({
        success: false,
        message: "Meeting number or ID is required"
      });
    }
    
    // 🛡️ Validate meeting ID format - must be numeric (real Zoom ID)
    if (meetingNumber && !/^\d+$/.test(meetingNumber)) {
      console.log('❌ Invalid meeting ID format:', meetingNumber);
      return res.status(400).json({
        success: false,
        message: "Invalid meeting ID format - must be numeric"
      });
    }
    
    let meeting = await Meeting.findOne(
      meetingNumber ? { meetingNumber: String(meetingNumber) } : { _id: meetingId }
    );
    
    console.log('🔍 Meeting lookup result:', {
      meetingNumber,
      meetingNumberType: typeof meetingNumber,
      meetingFound: !!meeting,
      meetingId: meeting?._id
    });

    // 🔍 DEBUG: Show all meetings in database
    console.log('🔍 ALL MEETINGS CHECK:');
    const allMeetings = await Meeting.find({});
    console.log('📋 All meetings in DB:', allMeetings.map(m => ({
      meetingNumber: m.meetingNumber,
      meetingNumberType: typeof m.meetingNumber,
      _id: m._id,
      status: m.status,
      scheduleId: m.scheduleId
    })));

    // 🔍 DEBUG: Check exact match
    const matchingMeetings = allMeetings.filter(m => 
      String(m.meetingNumber) === String(meetingNumber)
    );
    console.log('🔍 Matching meetings for:', meetingNumber, matchingMeetings.length, 'found');

    console.log('📋 Meeting found:', meeting ? 'Yes' : 'No');
    console.log('👤 User role for meeting:', userRole);

    // If meeting doesn't exist, return error instead of creating meeting
    if (!meeting) {
      console.log("❌ Meeting not found - cannot join non-existent meeting");
      return res.status(404).json({
        success: false,
        message: "Meeting not found. Please create the meeting first or check the meeting number.",
        debug: {
          meetingNumber,
          meetingNumberType: typeof meetingNumber,
          availableMeetings: allMeetings.map(m => ({
            meetingNumber: m.meetingNumber,
            status: m.status,
            _id: m._id
          }))
        }
      });
    }

    
    // Use provided user info or fallback to req.user
    const userId = bodyUserId || req.user?.id || "guest";
    const userName = bodyUserName || req.user?.name || "Guest";
    // userRole is already destructured from req.body above

    const already = meeting.participants.find(
      (p) => String(p.userId) === String(userId)
    );

    // Set role based on user type - only teachers can be hosts
    // PERFECT HOST CONFLICT RESOLUTION
    let participantRole = 0; // Default to participant
    let roleDescription = 'Participant';
    
    if (userRole === 'teacher') {
      // Check if there's already a host in the meeting
      const existingHost = meeting.participants.find(p => p.role === 1);
      
      if (!existingHost) {
        // No host exists - this teacher becomes the host
        participantRole = 1;
        roleDescription = 'Host (Teacher)';
        console.log(`👑 ${userName} promoted to host (first teacher)`);
      } else {
        // Host already exists - this teacher remains a participant
        participantRole = 0;
        roleDescription = 'Participant (Teacher)';
        console.log(`👤 ${userName} remains participant (host exists: ${existingHost.userName})`);
      }
    } else if (userRole === 'admin') {
      participantRole = 0; // Admins are always participants
      roleDescription = 'Participant (Admin)';
    } else if (userRole === 'student') {
      participantRole = 0; // Students are always participants
      roleDescription = 'Participant (Student)';
    } else {
      participantRole = 0; // Default to participant for other roles
      roleDescription = 'Participant (Other)';
    }
    
    console.log(`🔍 Role assignment: ${userName} -> ${roleDescription} (${participantRole})`);

    if (!already) {
      meeting.participants.push({
        userId,
        userName,
        role: participantRole,
        joinedAt: new Date(),
      });
      console.log(`✅ Added ${userName} to meeting as ${roleDescription}`);
    } else {
      // Update existing participant if role needs to change
      if (already.role !== participantRole) {
        const oldRole = already.role === 1 ? 'Host' : 'Participant';
        console.log(`� Updated ${userName} role: ${oldRole} -> ${roleDescription}`);
        already.role = participantRole;
      }
    }
    await meeting.save();

    const signature = await generateZoomSignature({
      meetingNumber: meeting.meetingNumber,
      role: participantRole,
    });

    // COMPREHENSIVE PASSWORD RETRIEVAL SYSTEM
    let realPassword = "123456"; // Ultimate fallback
    
    // Priority 1: Use zoomPassword from database (stored from Zoom API)
    if (meeting.zoomPassword && meeting.zoomPassword !== "123456") {
      realPassword = meeting.zoomPassword;
      console.log('✅ Using zoomPassword from database:', realPassword);
    }
    // Priority 2: Use plainPassword from database (stored from Zoom API)
    else if (meeting.plainPassword && meeting.plainPassword !== "123456") {
      realPassword = meeting.plainPassword;
      console.log('✅ Using plainPassword from database:', realPassword);
    }
    // Priority 3: Try to fetch from Zoom API if meetingNumber is valid
    else if (meeting.meetingNumber && /^\d+$/.test(meeting.meetingNumber)) {
      try {
        console.log('🔄 Fetching password from Zoom API for meeting:', meeting.meetingNumber);
        const accessToken = await getZoomAccessToken();
        if (accessToken) {
          const zoomResponse = await axios.get(
            `https://api.zoom.us/v2/meetings/${meeting.meetingNumber}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              }
            }
          );
          
          if (zoomResponse.data && zoomResponse.data.password) {
            realPassword = zoomResponse.data.password;
            console.log('✅ Retrieved password from Zoom API:', realPassword);
            
            // Update database with real password
            meeting.zoomPassword = realPassword;
            meeting.plainPassword = realPassword;
            await meeting.save();
            console.log('💾 Updated database with real password');
          }
        }
      } catch (zoomErr) {
        console.log('⚠️ Could not fetch from Zoom API, using fallback:', zoomErr.message);
      }
    }
    
    console.log('🔍 Final password debug:', {
      zoomPassword: meeting.zoomPassword,
      plainPassword: meeting.plainPassword,
      realPassword: realPassword,
      meetingNumber: meeting.meetingNumber,
      passwordSource: meeting.zoomPassword && meeting.zoomPassword !== "123456" ? 'database_zoomPassword' : 
                    meeting.plainPassword && meeting.plainPassword !== "123456" ? 'database_plainPassword' : 
                    'fallback_or_api'
    });

    res.json({
      success: true,
      message: "Joined class successfully",
      meeting: {
        id: meeting._id,
        meetingNumber: meeting.meetingNumber,
        password: realPassword, // ✅ Use REAL Zoom password
        topic: meeting.className || meeting.course || "Quran Class",
        signature,
        participantRole,
        sdkKey: process.env.ZOOM_SDK_KEY, // ✅ Include SDK key for frontend
      },
    });
  } catch (err) {
    console.log("JOIN ERROR:", err.message);

    res.status(500).json({
      success: false,
      message: "Join failed",
    });
  }
};

/* =====================
   OTHER APIs (UNCHANGED BUT SAFE)
===================== */
const getTeacherMeetings = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const targetTeacherId = teacherId || req.user?.id;
    
    const meetings = await Meeting.find({
      teacherId: targetTeacherId,
    }).sort({ createdAt: -1 });

    res.json({ success: true, meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

const getStudentMeetings = async (req, res) => {
  try {
    // Get meetings that are either live or scheduled (not ended)
    const meetings = await Meeting.find({
      status: { $in: ['live', 'scheduled'] },
    }).sort({ createdAt: -1 });

    res.json({ success: true, meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

const endClass = async (req, res) => {
  try {
    const { meetingNumber, meetingId } = req.params;
    
    // Support both meetingNumber and meetingId
    const filter = meetingNumber ? { meetingNumber } : { _id: meetingId };
    
    await Meeting.updateOne(
      filter,
      { 
        status: "ended",
        endedAt: new Date()
      }
    );

    res.json({ success: true, message: "Class ended successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to end class" });
  }
};

const createScheduledMeeting = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found"
      });
    }

    // Check if meeting already exists
    if (schedule.meetingStatus === 'created' || schedule.meetingStatus === 'started') {
      return res.status(400).json({
        success: false,
        message: "Meeting already created for this schedule"
      });
    }

    // Create Zoom meeting
    let zoom;
    try {
      const meetingDateTime = new Date();
      const [hours, minutes] = schedule.time.split(':');
      meetingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      zoom = await createZoomMeeting({
        topic: `${schedule.course} - ${schedule.studentName}`,
        startTime: meetingDateTime.toISOString(),
        duration: parseInt(schedule.duration) || 60
      });
    } catch (zErr) {
      console.error("Zoom meeting creation failed:", zErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to create Zoom meeting. Please check Zoom credentials.",
        error: zErr.message,
      });
    }

    // Validate Zoom meeting creation
    if (!zoom || !zoom.id) {
      return res.status(500).json({
        success: false,
        message: "Zoom returned no meeting ID",
        zoomResponse: zoom
      });
    }

    res.json({
      success: true,
      schedule,
      zoomMeeting: {
        meetingId: zoom.id,
        password: zoom.password,
        joinUrl: zoom.join_url,
        startUrl: zoom.start_url
      }
    });

  } catch (err) {
    console.error("CREATE SCHEDULED MEETING ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to create scheduled meeting"
    });
  }
};

const getMeetingDetails = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      meetingNumber: req.params.meetingNumber,
    }).sort({ createdAt: -1 });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found"
      });
    }

    // Check if this is a real Zoom meeting
    const isRealZoomMeeting = meeting.zoomMeetingId && 
      meeting.zoomMeetingId === meeting.meetingNumber &&
      meeting.zoomMeetingId.length > 8 &&
      meeting.zoomPassword;

    res.json({
      success: true,
      meeting,
      password: meeting.zoomPassword,
      isRealZoomMeeting,
      debug: {
        savedPassword: meeting.zoomPassword,
        plainPassword: meeting.plainPassword,
        meetingNumber: meeting.meetingNumber,
        zoomMeetingId: meeting.zoomMeetingId,
        hasZoomPassword: !!meeting.zoomPassword,
        hasPlainPassword: !!meeting.plainPassword,
        hasZoomJoinUrl: !!meeting.zoomJoinUrl,
        hasZoomStartUrl: !!meeting.zoomStartUrl
      }
    });
  } catch (err) {
    console.error("Get meeting details error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

const testZoomCredentials = async (req, res) => {
  try {
    console.log("Testing Zoom OAuth credentials...");
    
    const accessToken = await getZoomAccessToken();
    
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: "Failed to get Zoom access token",
        credentials: {
          hasClientId: !!process.env.ZOOM_CLIENT_ID,
          hasClientSecret: !!process.env.ZOOM_CLIENT_SECRET,
          hasAccountId: !!process.env.ZOOM_ACCOUNT_ID,
          hasSdkKey: !!process.env.ZOOM_SDK_KEY,
          hasSdkSecret: !!process.env.ZOOM_SDK_SECRET
        }
      });
    }

    // Test creating a meeting
    const testMeeting = await createZoomMeeting({
      topic: "Test Meeting - " + new Date().toISOString(),
      startTime: new Date().toISOString(),
      duration: 30
    });

    if (!testMeeting || !testMeeting.id) {
      return res.status(500).json({
        success: false,
        message: "Failed to create test Zoom meeting",
        accessToken: accessToken ? "valid" : "invalid",
        testResponse: testMeeting
      });
    }

    res.json({
      success: true,
      message: "Zoom credentials working correctly",
      accessToken: accessToken ? "valid" : "invalid",
      testMeeting: {
        id: testMeeting.id,
        topic: testMeeting.topic,
        join_url: testMeeting.join_url,
        start_url: testMeeting.start_url,
        password: testMeeting.password
      }
    });

  } catch (err) {
    console.error("Zoom credentials test error:", err);
    res.status(500).json({
      success: false,
      message: "Zoom credentials test failed",
      error: err.message,
      details: err.response?.data
    });
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete({
      meetingNumber: req.params.meetingNumber,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found"
      });
    }

    res.json({
      success: true,
      message: "Meeting deleted successfully",
      meeting
    });
  } catch (err) {
    console.error("Delete meeting error:", err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

module.exports = {
  startClass,
  joinClass,
  getTeacherMeetings,
  getStudentMeetings,
  endClass,
  getMeetingDetails,
  createZoomMeeting,
  createScheduledMeeting,
  deleteMeeting,
  testZoomCredentials,
  generateZoomSignature, // ✅ CRITICAL: Add missing function
};