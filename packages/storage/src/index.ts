import {
  DeleteObjectCommand,
  DeleteObjectTaggingCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@curb/env/server";

const s3 = new S3Client({
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? "",
  },
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: true,
  region: "auto",
});

const bucket = env.S3_BUCKET_NAME ?? "curb";

export const storage = {
  async confirmObject(key: string): Promise<void> {
    await s3.send(new DeleteObjectTaggingCommand({ Bucket: bucket, Key: key }));
  },

  async deleteObject(key: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },

  getPublicUrl(key: string): string | null {
    if (!env.S3_PUBLIC_URL) {
      return null;
    }
    return `${env.S3_PUBLIC_URL}/${key}`;
  },

  async getUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      ContentType: contentType,
      Key: key,
      Tagging: "status=pending",
    });
    return await getSignedUrl(s3, command, { expiresIn: 3600 });
  },
};

export type Storage = typeof storage;
