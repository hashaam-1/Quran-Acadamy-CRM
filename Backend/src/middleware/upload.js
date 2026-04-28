const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const path = require("path");

// File filter for PDFs and documents
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, XLS, and XLSX files are allowed'), false);
  }
};

// Custom storage engine with direct Cloudinary upload
const storage = multer.memoryStorage();

// Custom upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Custom upload function to handle direct Cloudinary upload
const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    console.log('🔍 CLOUDINARY DIRECT UPLOAD DEBUG:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      resource_type: "auto",
      folder: "quran-academy/syllabus"
    });

    // Upload to Cloudinary with resource_type: "auto" for proper file viewing
    cloudinary.uploader.upload_stream(
      {
        resource_type: "auto", // ✅ FIXED: Auto-detect file type for proper viewing
        folder: "quran-academy/syllabus",
        access_mode: "public",
        public_id: `${Date.now()}-${path.parse(file.originalname).name}`,
        format: path.extname(file.originalname).substring(1)
      },
      (error, result) => {
        if (error) {
          console.error('❌ CLOUDINARY UPLOAD ERROR:', error);
          reject(error);
        } else {
          console.log('✅ CLOUDINARY UPLOAD SUCCESS:', {
            public_id: result.public_id,
            secure_url: result.secure_url,
            resource_type: result.resource_type,
            format: result.format
          });
          resolve(result);
        }
      }
    ).end(file.buffer);
  });
};

module.exports = { upload, uploadToCloudinary };
