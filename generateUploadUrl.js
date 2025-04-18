// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import express from 'express';

// const s3 = new S3Client({ region: 'us-east-1' });
// const router = express.Router();

// router.get('/generate-upload-url', async (req, res) => {
//   try {
//     const { fileName, fileType } = req.query;

//     if (!fileName || !fileType) {
//       return res.status(400).json({ error: 'Missing fileName or fileType' });
//     }

//     const command = new PutObjectCommand({
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: `uploads/${fileName}`,
//       ContentType: fileType,
//     });

//     const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
//     res.json({ signedUrl });
//   } catch (err) {
//     console.error('Error generating signed URL:', err);
//     res.status(500).json({ error: 'Could not generate signed URL' });
//   }
// });

// export default router;
