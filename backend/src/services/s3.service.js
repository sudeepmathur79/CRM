const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const isConfigured = () =>
  !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET);

const getClient = () => new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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
  return `https://${bucket}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
};

const deleteFile = async (fileUrl) => {
  const client = getClient();
  const bucket = process.env.AWS_S3_BUCKET;
  const key = fileUrl.split('.amazonaws.com/')[1];
  if (!key) return;
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
};

module.exports = { isConfigured, uploadFile, deleteFile };
