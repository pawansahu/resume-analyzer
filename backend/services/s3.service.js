import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Log S3 configuration on startup
console.log('🔧 S3 Configuration:');
console.log('  Region:', process.env.AWS_REGION || 'us-east-1');
console.log('  Bucket:', process.env.AWS_S3_BUCKET || 'resume-analyzer-uploads');
console.log('  Access Key:', process.env.AWS_ACCESS_KEY_ID ? '***' + process.env.AWS_ACCESS_KEY_ID.slice(-4) : 'NOT SET');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'resume-analyzer-uploads';

/**
 * Upload file to S3 with unique key
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} userId - User ID
 * @param {string} fileExtension - File extension (pdf, docx)
 * @returns {Promise<{key: string, bucket: string}>}
 */
export const uploadFileToS3 = async (fileBuffer, userId, fileExtension) => {
  try {
    console.log('📤 Starting S3 upload...');
    console.log('Region:', process.env.AWS_REGION);
    console.log('Bucket:', BUCKET_NAME);
    console.log('User ID:', userId);
    
    // Generate unique file key
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const key = `resumes/${userId}/${timestamp}-${randomString}.${fileExtension}`;
    
    console.log('File key:', key);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: fileExtension === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ServerSideEncryption: 'AES256',
      // Add metadata for lifecycle management
      Metadata: {
        uploadedAt: new Date().toISOString(),
        userId: userId
      }
    });

    const result = await s3Client.send(command);
    console.log('✅ S3 upload successful:', result);

    return {
      key,
      bucket: BUCKET_NAME
    };
  } catch (error) {
    console.error('❌ S3 upload error details:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.Code || error.$metadata?.httpStatusCode);
    console.error('Full error:', JSON.stringify(error, null, 2));
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Generate signed URL for file access
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiry in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>}
 */
export const generateSignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
export const deleteFileFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Schedule file deletion after specified hours
 * Note: This is a placeholder. In production, use S3 lifecycle policies
 * or a background job queue (BullMQ) for scheduled deletion
 * @param {string} key - S3 object key
 * @param {number} deleteAfterHours - Hours until deletion (default: 24)
 * @returns {Promise<void>}
 */
export const scheduleFileDeletion = async (key, deleteAfterHours = 24) => {
  // For now, we'll rely on S3 lifecycle policy
  // In production, you would add this to a job queue
  console.log(`File ${key} scheduled for deletion after ${deleteAfterHours} hours`);
  
  // TODO: Implement with BullMQ or similar job queue
  // const deleteAt = new Date(Date.now() + deleteAfterHours * 60 * 60 * 1000);
  // await jobQueue.add('deleteFile', { key }, { delay: deleteAfterHours * 60 * 60 * 1000 });
};

export default {
  uploadFileToS3,
  generateSignedUrl,
  deleteFileFromS3,
  scheduleFileDeletion
};
