const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const path = require("path");

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

// Upload to Cloudinary
// const uploadToCloudinary = async (file) => {
//   return new Promise((resolve, reject) => {
//     console.log("📄 Uploading file:", {
//       originalname: file.originalname,
//       mimetype: file.mimetype,
//       size: file.size,
//     });

//     cloudinary.uploader
//       .upload_stream(
//         {
//           resource_type: "auto", // Automatically detects PDF/DOCX/XLSX
//           folder: "quran-academy/syllabus",
//           public_id: `${Date.now()}-${path.parse(file.originalname).name}`,
//           use_filename: true,
//           unique_filename: true,
//           overwrite: false,
//         },
//         (error, result) => {
//           if (error) {
//             console.error("❌ Cloudinary Upload Error:", error);
//             return reject(error);
//           }

//           console.log("✅ Cloudinary Upload Success");
//           console.log(JSON.stringify(result, null, 2));

//           resolve({
//             public_id: result.public_id,
//             secure_url: result.secure_url,
//             url: result.url,
//             resource_type: result.resource_type,
//             format: result.format,
//             original_filename: result.original_filename,
//           });
//         }
//       )
//       .end(file.buffer);
//   });
// };
const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    console.log("\n==================== FILE UPLOAD START ====================");
    console.log("📄 File Details:");
    console.log("Name:", file.originalname);
    console.log("Mime Type:", file.mimetype);
    console.log("Size:", file.size);
    console.log("==========================================================\n");

    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
          folder: "quran-academy/syllabus",
          public_id: `${Date.now()}-${path.parse(file.originalname).name}`,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            console.error("\n❌ CLOUDINARY UPLOAD ERROR");
            console.error(error);
            console.error("==========================================================\n");
            return reject(error);
          }

          console.log("\n✅ CLOUDINARY UPLOAD SUCCESS");
          console.log("==========================================================");

          console.log("Public ID:", result.public_id);
          console.log("Resource Type:", result.resource_type);
          console.log("Format:", result.format);
          console.log("Version:", result.version);
          console.log("URL:", result.url);
          console.log("Secure URL:", result.secure_url);
          console.log("Original Filename:", result.original_filename);
          console.log("Bytes:", result.bytes);

          console.log("\n📦 FULL CLOUDINARY RESPONSE:");
          console.log(JSON.stringify(result, null, 2));

          console.log("==========================================================\n");

          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            url: result.url,
            resource_type: result.resource_type,
            format: result.format,
            original_filename: result.original_filename,
          });
        }
      )
      .end(file.buffer);
  });
};

module.exports = {
  upload,
  uploadToCloudinary,
};