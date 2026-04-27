import { PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '@/config/env';
import { s3Client } from '@/lib/r2';
import { AppError } from './AppError';
export const uploadToR2 = async (fileBuffer: Buffer, fileName: string, contentType: string) => {
  //create unique file key where file live in R2
  const fileKey = `profiles/${Date.now()}-${fileName}`;
  //building request instruction
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME, //storage container
    Key: fileKey, //path inside bucket
    Body: fileBuffer, //actual buffer file
    ContentType: contentType, //tell browser how to display file
  });
  try {
    await s3Client.send(command);
    if (env.R2_PUBLIC_URL) {
      return `${env.R2_PUBLIC_URL}/${fileKey}`; //convert internal path to public URL
    }
    //if no public domain configured, return fileKey
    return fileKey;
  } catch (error) {
    //send error to controller
    console.error(error);
    throw new AppError('Failed to upload image to Storage', 500);
  }
};
