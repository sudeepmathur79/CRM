const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isConfigured = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const uploadFile = async (filePath, fileName, leadId) => {
  if (!isConfigured()) return null;
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: 'auto',
    folder: `crm/leads/${leadId}`,
    public_id: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
    use_filename: false,
  });
  return result.secure_url;
};

const deleteFile = async (fileUrl) => {
  if (!isConfigured() || !fileUrl?.includes('cloudinary')) return;
  try {
    // Extract public_id from URL
    const parts = fileUrl.split('/');
    const uploadIdx = parts.findIndex(p => p === 'upload');
    if (uploadIdx === -1) return;
    const publicIdWithExt = parts.slice(uploadIdx + 2).join('/'); // skip version segment
    const publicId = publicIdWithExt.replace(/\.[^.]+$/, '');
    await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
  } catch (e) {
    console.error('Cloudinary delete error:', e.message);
  }
};

module.exports = { uploadFile, deleteFile, isConfigured };
