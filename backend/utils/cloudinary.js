import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary if CLOUDINARY_URL environment variable is provided
if (process.env.CLOUDINARY_URL) {
  const url = process.env.CLOUDINARY_URL;
  const regex = /cloudinary:\/\/([^:]+):([^@]+)@(.+)/;
  const matches = url.match(regex);
  if (matches) {
    const [, apiKey, apiSecret, cloudName] = matches;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
  } else {
    cloudinary.config();
  }
}

/**
 * Uploads a local file to Cloudinary.
 * If CLOUDINARY_URL is not set, falls back to returning the local file path.
 *
 * @param {string} filePath - Absolute or relative path to the local file.
 * @param {string} folder - The Cloudinary folder to upload into.
 * @returns {Promise<string>} The file URL (Cloudinary secure_url or local path).
 */
export const uploadToCloudinary = async (filePath, folder = 'vendorbridge') => {
  try {
    if (!filePath) return null;

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_URL) {
      // Fallback: file is already saved locally in uploads folder by multer.
      // Return the local relative URL path.
      const filename = path.basename(filePath);
      return `/uploads/${filename}`;
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto', // Auto detect file type (pdf, doc, png, jpg, etc.)
    });

    // Successfully uploaded to Cloudinary: Clean up the local temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result.secure_url;
  } catch (error) {
    // Clean up local file even if upload fails to avoid storage leaks
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        // Silently catch unlink errors during failure
      }
    }
    throw error;
  }
};
