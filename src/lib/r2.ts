import { Agent } from 'node:http';
import { S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { env } from '@/config/env';
//create client object that can talk to cloudflare R2
export const s3Client = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false, //controls URL format
  //customizing how HTTP request are made
  requestHandler: new NodeHttpHandler({
    httpAgent: new Agent({
      keepAlive: true, //reuse connection to be faster
    }),
    connectionTimeout: 30000, //max time to establish connection
    socketTimeout: 30000, //max time for data transfer
  }),
});
