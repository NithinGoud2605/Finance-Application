const { supabaseAdmin } = require('./supabaseAuth');
const logger = require('./logger');

const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'documents';

// Upload file to Supabase Storage
async function uploadFile(buffer, path, contentType = 'application/pdf', bucketName = DEFAULT_BUCKET) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(path, buffer, {
        contentType,
        upsert: true // Allow overwriting existing files
      });

    if (error) {
      logger.error('Supabase storage upload error:', error);
      throw error;
    }

    logger.info('File uploaded successfully:', { path, bucket: bucketName });
    return {
      Key: path,
      path: path,
      url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucketName}/${path}`
    };
  } catch (error) {
    logger.error('File upload error:', error);
    throw error;
  }
}

// Get public URL (no expiration)
function getPublicUrl(path, bucketName = DEFAULT_BUCKET) {
  const { data } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(path);
  return data.publicUrl;
}

// Get signed URL (temporary access with expiration)
async function getSignedUrl(path, expiresIn = 3600, bucketName = DEFAULT_BUCKET) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(path, expiresIn);

    if (error) {
      logger.error('Signed URL error:', error);
      throw error;
    }
    
    return data.signedUrl;
  } catch (error) {
    logger.error('Signed URL error:', error);
    throw error;
  }
}

// Get streaming URL (for viewing without download)
async function getStreamingUrl(path, expiresIn = 600, bucketName = DEFAULT_BUCKET) {
  // Same as signed URL for Supabase
  return await getSignedUrl(path, expiresIn, bucketName);
}

// Get public access URL (for public invoices/contracts)
async function getPublicAccessUrl(path, expiresIn = 604800, bucketName = DEFAULT_BUCKET) {
  // For public access, use signed URL with longer expiration
  return await getSignedUrl(path, expiresIn, bucketName);
}

// Delete file
async function deleteFile(path, bucketName = DEFAULT_BUCKET) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      logger.error('File delete error:', error);
      throw error;
    }
    
    logger.info('File deleted successfully:', { path, bucket: bucketName });
    return data;
  } catch (error) {
    logger.error('File delete error:', error);
    throw error;
  }
}

// Check if file exists
async function fileExists(path, bucketName = DEFAULT_BUCKET) {
  try {
    const pathParts = path.split('/');
    const fileName = pathParts.pop();
    const folderPath = pathParts.join('/');
    
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .list(folderPath || '', {
        search: fileName
      });

    if (error) {
      logger.error('File exists check error:', error);
      return false;
    }
    
    return data && data.length > 0 && data.some(file => file.name === fileName);
  } catch (error) {
    logger.error('File exists check error:', error);
    return false;
  }
}

// Download file as buffer
async function downloadFile(path, bucketName = DEFAULT_BUCKET) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .download(path);

    if (error) {
      logger.error('File download error:', error);
      throw error;
    }
    
    // Convert blob to buffer
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    logger.error('File download error:', error);
    throw error;
  }
}

// Get file as stream (for piping to response)
async function getFileStream(path, bucketName = DEFAULT_BUCKET) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .download(path);

    if (error) {
      logger.error('File stream error:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    logger.error('File stream error:', error);
    throw error;
  }
}

module.exports = {
  uploadFile,
  getPublicUrl,
  getSignedUrl,
  getStreamingUrl,
  getPublicAccessUrl,
  deleteFile,
  fileExists,
  downloadFile,
  getFileStream
};
