const mongoose = require('mongoose');
const Syllabus = require('../models/Syllabus');
require('dotenv').config();

async function fixLocalhostUrls() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Use production backend URL
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
          // Fix localhost URLs
          if (attachment.fileUrl && attachment.fileUrl.includes('localhost:5000')) {
            const oldUrl = attachment.fileUrl;
            const keyMatch = oldUrl.match(/localhost:5000\/api\/syllabus\/file\/(.+)$/);
            
            if (keyMatch) {
              const key = keyMatch[1];
              const newUrl = `${backendUrl}/api/syllabus/file/${key}`;
              
              console.log(`🔄 Updating: ${oldUrl}`);
              console.log(`   To: ${newUrl}`);
              
              attachment.fileUrl = newUrl;
              hasUpdates = true;
            }
          }
          
          // Also fix any remaining relative URLs
          if (attachment.fileUrl && attachment.fileUrl.startsWith('/api/syllabus/file/')) {
            const oldUrl = attachment.fileUrl;
            const keyMatch = oldUrl.match(/\/api\/syllabus\/file\/(.+)$/);
            
            if (keyMatch) {
              const key = keyMatch[1];
              const newUrl = `${backendUrl}/api/syllabus/file/${key}`;
              
              console.log(`🔄 Updating relative URL: ${oldUrl}`);
              console.log(`   To: ${newUrl}`);
              
              attachment.fileUrl = newUrl;
              hasUpdates = true;
            }
          }
          
          // Fix public R2 URLs to use backend proxy
          if (attachment.fileUrl && attachment.fileUrl.includes('pub-2e405e6947824c3698badabe18d25ab7.r2.dev')) {
            const oldUrl = attachment.fileUrl;
            const keyMatch = oldUrl.match(/pub-2e405e6947824c3698badabe18d25ab7\.r2\.dev\/(.+)$/);
            
            if (keyMatch) {
              const key = keyMatch[1];
              const newUrl = `${backendUrl}/api/syllabus/file/${key}`;
              
              console.log(`🔄 Updating public R2 URL: ${oldUrl}`);
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

    console.log(`\n🎉 Updated ${updatedCount} syllabi to use production backend URL`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixLocalhostUrls();
