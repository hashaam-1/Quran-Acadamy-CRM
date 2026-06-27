const mongoose = require('mongoose');
const Syllabus = require('../models/Syllabus');
require('dotenv').config();

async function analyzeSyllabusUrls() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all syllabi
    const syllabi = await Syllabus.find({});
    console.log(`📋 Found ${syllabi.length} syllabi`);

    console.log('\n🔍 ANALYZING FILE URLs:\n');

    for (const syllabus of syllabi) {
      console.log(`\n📚 Syllabus: ${syllabus.title} (ID: ${syllabus._id})`);
      
      if (syllabus.attachments && syllabus.attachments.length > 0) {
        for (const attachment of syllabus.attachments) {
          console.log(`  📄 File: ${attachment.fileName}`);
          console.log(`     URL: ${attachment.fileUrl}`);
          console.log(`     Type: ${attachment.fileType}`);
          
          // Analyze URL pattern
          if (attachment.fileUrl.includes('localhost:5000')) {
            console.log(`     ⚠️  ISSUE: Localhost URL (will fail in production)`);
          } else if (attachment.fileUrl.includes('quran-acadamy-crm-backend-production.up.railway.app')) {
            console.log(`     ✅ CORRECT: Production backend URL`);
          } else if (attachment.fileUrl.includes('pub-2e405e6947824c3698badabe18d25ab7.r2.dev')) {
            console.log(`     ⚠️  ISSUE: Public R2 URL (may download instead of open inline)`);
          } else if (attachment.fileUrl.startsWith('/api/')) {
            console.log(`     ⚠️  ISSUE: Relative URL (will resolve to wrong domain)`);
          } else {
            console.log(`     ❓ UNKNOWN: Unrecognized URL pattern`);
          }
        }
      } else {
        console.log(`  No attachments`);
      }
    }

    console.log('\n✅ Analysis complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeSyllabusUrls();
