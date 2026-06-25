const multer = require("multer");
const { uploadToR2: uploadToR2Storage } = require("../config/r2");

// File filter for PDFs and documents
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF, DOC, DOCX, XLS, and XLSX files are allowed"
      ),
      false
    );
  }
};

// Memory storage
const storage = multer.memoryStorage();

// Upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Upload to R2
const uploadToR2 = async (file) => {
  try {
    console.log('Uploading to R2:', file.originalname);
    const result = await uploadToR2Storage(file, 'syllabus');
    console.log('R2 upload success:', result);
    return result;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw error;
  }
};

module.exports = {
  upload,
  uploadToR2,
};