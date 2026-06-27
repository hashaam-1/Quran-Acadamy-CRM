const mongoose = require('mongoose');
const Syllabus = require('../models/Syllabus');
require('dotenv').config();

async function updateSyllabusUrlsToFullBackend() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Use production backend URL
    const backendUrl = 'https://quran-acadamy-crm-backend-production.up.railway.app';
    console.log(`🔧 Using backend URL: ${backendUrl}`);

    // Find all syllabi with relative proxy URLs
    const syllabi = await Syllabus.find({});
    console.log(`📋 Found ${syllabi.length} syllabi`);

    let updatedCount = 0;

    for (const syllabus of syllabi) {
      if (syllabus.attachments && syllabus.attachments.length > 0) {
        let hasUpdates = false;
        
        for (const attachment of syllabus.attachments) {
          if (attachment.fileUrl && attachment.fileUrl.startsWith('/api/syllabus/file/')) {
            // Extract the key from the relative URL
            const oldUrl = attachment.fileUrl;
            const keyMatch = oldUrl.match(/\/api\/syllabus\/file\/(.+)$/);
            
            if (keyMatch) {
              const key = keyMatch[1];
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
