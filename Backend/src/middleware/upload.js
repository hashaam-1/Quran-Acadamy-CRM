const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "quran-academy/syllabus",
    resource_type: "raw", // 🔥 FIX: Use 'raw' for PDFs, docs, files
    access_mode: "public", // 🔥 FIX: Ensure public access
    allowed_formats: ["pdf", "doc", "docx", "xls", "xlsx"],
  },
  // Add logging to verify upload parameters
  transformation: (req, file) => {
    console.log('🔍 CLOUDINARY UPLOAD DEBUG:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      resource_type: "raw",
      access_mode: "public",
      folder: "quran-academy/syllabus"
    });
    return {};
  }
});

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

// Create multer upload instance with Cloudinary storage
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = upload;
