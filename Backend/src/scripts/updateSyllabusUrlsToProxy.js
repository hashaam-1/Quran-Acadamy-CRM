const mongoose = require('mongoose');
const Syllabus = require('../models/Syllabus');
require('dotenv').config();

async function updateSyllabusUrlsToProxy() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all syllabi with public R2 URLs
    const syllabi = await Syllabus.find({});
    console.log(`📋 Found ${syllabi.length} syllabi`);

    let updatedCount = 0;

    for (const syllabus of syllabi) {
      if (syllabus.attachments && syllabus.attachments.length > 0) {
        let hasUpdates = false;
        
        for (const attachment of syllabus.attachments) {
          if (attachment.fileUrl && attachment.fileUrl.includes('pub-2e405e6947824c3698badabe18d25ab7.r2.dev')) {
            // Extract the key from the public URL
            const oldUrl = attachment.fileUrl;
            const keyMatch = oldUrl.match(/pub-2e405e6947824c3698badabe18d25ab7\.r2\.dev\/(.+)$/);
            
            if (keyMatch) {
              const key = keyMatch[1];
              // Construct new backend proxy URL
              const newUrl = `/api/syllabus/file/${key}`;
              
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

    console.log(`\n🎉 Updated ${updatedCount} syllabi to use backend proxy`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateSyllabusUrlsToProxy();
