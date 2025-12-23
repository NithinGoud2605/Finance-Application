// utils/s3Uploader.js - Now using Supabase Storage instead of AWS S3
require('dotenv').config();
const logger = require('./logger');
const supabaseStorage = require('./supabaseStorage');

// Default bucket name
const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'documents';

// Validate Supabase configuration
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  logger.warn('Supabase environment variables not fully configured. Storage operations may fail.');
}

/**
 * Upload file to Supabase Storage
 * Maintains same interface as the old S3 uploader for backward compatibility
 */
async function uploadToS3(buffer, key, contentType = 'application/pdf') {
  try {
    const result = await supabaseStorage.uploadFile(buffer, key, contentType, DEFAULT_BUCKET);
    logger.info('Storage upload success', { Key: key });
    // Return format compatible with old S3 uploader
    return { 
      Key: key, 
      Location: result.url 
    };
  } catch (err) {
    logger.error('Storage upload error', err);
    throw err;
  }
}

/**
 * Get pre-signed URL for secure file download
 * Uses Supabase signed URLs
 */
async function getPreSignedUrl(key, expiresIn = 900) {
  try {
    // Supabase signed URLs work for private buckets
    const signedUrl = await supabaseStorage.getSignedUrl(key, expiresIn, DEFAULT_BUCKET);
    return signedUrl;
  } catch (err) {
    logger.error('Get signed URL error', err);
    throw err;
  }
}

/**
 * Get streaming URL for viewing files (without forced download)
 */
async function getStreamingUrl(key, expiresIn = 600) {
  try {
    const signedUrl = await supabaseStorage.getSignedUrl(key, expiresIn, DEFAULT_BUCKET);
    return signedUrl;
  } catch (err) {
    logger.error('Get streaming URL error', err);
    throw err;
  }
}

/**
 * Get long-term public access URL (for public invoices/contracts)
 */
async function getPublicAccessUrl(key, expiresIn = 604800) { // 7 days default
  try {
    const signedUrl = await supabaseStorage.getSignedUrl(key, expiresIn, DEFAULT_BUCKET);
    return signedUrl;
  } catch (err) {
    logger.error('Get public access URL error', err);
    throw err;
  }
}

/**
 * Delete file from storage
 */
async function deleteFromS3(key) {
  try {
    const result = await supabaseStorage.deleteFile(key, DEFAULT_BUCKET);
    logger.info('Storage delete success', { Key: key });
    return result;
  } catch (err) {
    logger.error('Storage delete error', err);
    throw err;
  }
}

/**
 * Check if file exists in storage
 */
async function fileExists(key) {
  try {
    return await supabaseStorage.fileExists(key, DEFAULT_BUCKET);
  } catch (err) {
    if (err.message?.includes('not found')) {
      return false;
    }
    throw err;
  }
}

/**
 * Download file from storage
 * Returns file buffer
 */
async function downloadFile(key) {
  try {
    const result = await supabaseStorage.downloadFile(key, DEFAULT_BUCKET);
    return result;
  } catch (err) {
    logger.error('Storage download error', err);
    throw err;
  }
}

module.exports = { 
  uploadToS3, 
  getPreSignedUrl, 
  getStreamingUrl,
  getPublicAccessUrl,
  deleteFromS3, 
  fileExists,
  downloadFile
};
