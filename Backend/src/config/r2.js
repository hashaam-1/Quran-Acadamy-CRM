const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Upload file to R2
const uploadToR2 = async (file, folder = 'syllabus') => {
  try {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await r2Client.send(command);

    // Use R2_PUBLIC_URL for public access (no authentication required)
    const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    return {
      fileName: file.originalname,
      fileUrl: fileUrl,
      fileType: file.mimetype,
      key: fileName,
    };
  } catch (error) {
    console.error('R2 Upload Error:', error);
    throw new Error('Failed to upload file to R2');
  }
};

// Delete file from R2
const deleteFromR2 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error('R2 Delete Error:', error);
    throw new Error('Failed to delete file from R2');
  }
};

module.exports = {
  r2Client,
  uploadToR2,
  deleteFromR2,
};
