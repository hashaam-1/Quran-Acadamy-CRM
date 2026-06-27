const mongoose = require('mongoose');
const Syllabus = require('../models/Syllabus');
require('dotenv').config();

async function updateSyllabusUrlsToFullBackend() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Use production backend URL directly
    const backendUrl = 'https://quran-acadamy-crm-backend-production.up.railway.app';
    console.log(`🔧 Using backend URL: ${backendUrl}`);

    // Find all syllabi
    const syllabi = await Syllabus.find({});
    console.log(`📋 Found ${syllabi.length} syllabi`);

    let updatedCount = 0;

    for (const syllabus of syllabi) {
      if (syllabus.attachments && syllabus.attachments.length > 0) {
        let hasUpdates = false;
        
        for (const attachment of syllabus.attachments) {
          if (attachment.fileUrl) {
            const oldUrl = attachment.fileUrl;
            let key = null;
            
            // Check if it's a relative URL
            if (oldUrl.startsWith('/api/syllabus/file/')) {
              const keyMatch = oldUrl.match(/\/api\/syllabus\/file\/(.+)$/);
              if (keyMatch) key = keyMatch[1];
            }
            // Check if it's localhost URL
            else if (oldUrl.includes('localhost:5000/api/syllabus/file/')) {
              const keyMatch = oldUrl.match(/localhost:5000\/api\/syllabus\/file\/(.+)$/);
              if (keyMatch) key = keyMatch[1];
            }
            // Check if it's already production URL (no change needed)
            else if (oldUrl.includes(backendUrl)) {
              continue;
            }
            
            if (key) {
              // Construct new full backend URL
              const newUrl = `${backendUrl}/api/syllabus/file/${key}`;
              
              console.log(`🔄 Updating: ${oldUrl}`);
              console.log(`   To: ${newUrl}`);
              
              attachment.fileUrl = newUrl;
              hasUpdates = true;
            }
          }
        }
        
        if (hasUpdates) {
          await syllabus.save();
          updatedCount++;
          console.log(`✅ Updated syllabus: ${syllabus.title}`);
        }
      }
    }

    console.log(`\n🎉 Updated ${updatedCount} syllabi to use full backend URL`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateSyllabusUrlsToFullBackend();
