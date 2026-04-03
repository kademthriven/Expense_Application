const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

exports.uploadToS3 = async (fileBuffer, fileName) => {
  try {
    let contentType = 'application/octet-stream';

    if (fileName.endsWith('.xlsx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (fileName.endsWith('.pdf')) {
      contentType = 'application/pdf';
    }

    const key = `expense-reports/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType
    });

    await s3Client.send(command);
    return key;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

exports.generatePresignedUrl = async (fileKey, expirationSeconds = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey
    });

    return await getSignedUrl(s3Client, command, { expiresIn: expirationSeconds });
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

exports.generateFileName = (userId, view, label, extension = 'pdf') => {
  const timestamp = Date.now();
  const safeLabel = label.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `user_${userId}_${view}_${safeLabel}_${timestamp}.${extension}`;
};

exports.getDownloadUrl = async (fileKey, fileName = '') => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      ResponseContentDisposition: fileName
        ? `attachment; filename="${fileName}"`
        : undefined
    });

    return await getSignedUrl(s3Client, command, {
      expiresIn: 7 * 24 * 60 * 60
    });
  } catch (error) {
    console.error('Signed download URL error:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

exports.getViewUrl = async (fileKey, fileName = '') => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      ResponseContentDisposition: fileName
        ? `inline; filename="${fileName}"`
        : undefined
    });

    return await getSignedUrl(s3Client, command, {
      expiresIn: 7 * 24 * 60 * 60
    });
  } catch (error) {
    console.error('Signed view URL error:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

exports.getFileAccessUrl = async (fileKey, fileName = '') => {
  if (fileName && fileName.toLowerCase().endsWith('.pdf')) {
    return exports.getViewUrl(fileKey, fileName);
  }

  return exports.getDownloadUrl(fileKey, fileName);
};