const mongoose = require('mongoose');
const Syllabus = require('../models/Syllabus');
require('dotenv').config();

async function updateSyllabusUrls() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all syllabi with old R2 URLs
    const syllabi = await Syllabus.find({});
    console.log(`📋 Found ${syllabi.length} syllabi`);

    let updatedCount = 0;

    for (const syllabus of syllabi) {
      if (syllabus.attachments && syllabus.attachments.length > 0) {
        let hasUpdates = false;
        
        for (const attachment of syllabus.attachments) {
          if (attachment.fileUrl && attachment.fileUrl.includes('r2.cloudflarestorage.com')) {
            // Extract the key from the old URL
            const oldUrl = attachment.fileUrl;
            const keyMatch = oldUrl.match(/quran-academy-syllabus\/(.+)$/);
            
            if (keyMatch) {
              const key = keyMatch[1];
              // Construct new public URL
              const newUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
              
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

    console.log(`\n🎉 Updated ${updatedCount} syllabi`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateSyllabusUrls();
