const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const isConfigured = () =>
  !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET);

const getClient = () => {
  const config = {
    region: process.env.AWS_REGION || 'auto',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  };
  // Cloudflare R2 (or any S3-compatible provider) uses a custom endpoint
  if (process.env.AWS_ENDPOINT_URL) config.endpoint = process.env.AWS_ENDPOINT_URL;
  return new S3Client(config);
};

const uploadFile = async (filePath, fileName, leadId) => {
  const client = getClient();
  const bucket = process.env.AWS_S3_BUCKET;
  const key = `crm/leads/${leadId}/${Date.now()}-${fileName}`;
  const body = fs.readFileSync(filePath);
  const ext = path.extname(fileName).toLowerCase();
  const contentTypeMap = {
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.webm': 'audio/webm',
    '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.mp4': 'video/mp4',
    '.txt': 'text/plain', '.vtt': 'text/vtt', '.srt': 'text/plain',
  };
  await client.send(new PutObjectCommand({
    Bucket: bucket, Key: key, Body: body,
    ContentType: contentTypeMap[ext] || 'application/octet-stream',
  }));
  // R2 public URL (if public access enabled) or S3 URL
  const base = process.env.AWS_PUBLIC_URL
    ? process.env.AWS_PUBLIC_URL.replace(/\/$/, '')
    : `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`;
  return `${base}/${key}`;
};

const deleteFile = async (fileUrl) => {
  const client = getClient();
  const bucket = process.env.AWS_S3_BUCKET;
  const base = process.env.AWS_PUBLIC_URL || `https://${bucket}.s3`;
  const key = fileUrl.includes('.amazonaws.com/')
    ? fileUrl.split('.amazonaws.com/')[1]
    : fileUrl.replace(base.replace(/\/$/, '') + '/', '');
  if (!key) return;
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
};

module.exports = { isConfigured, uploadFile, deleteFile };
