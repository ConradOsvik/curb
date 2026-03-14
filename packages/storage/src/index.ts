import {
  DeleteObjectCommand,
  DeleteObjectTaggingCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@curb/env/server";

import { bucket, s3 } from "./client";

export const storage = {
  async confirmObject(key: string): Promise<void> {
    await s3.send(new DeleteObjectTaggingCommand({ Bucket: bucket, Key: key }));
  },

  async deleteByUrl(url: string): Promise<void> {
    const key = storage.getKeyFromUrl(url);
    if (key) {
      await storage.deleteObject(key);
    }
  },

  async deleteObject(key: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },

  getKeyFromUrl(url: string): string | null {
    if (!env.S3_PUBLIC_URL || !url.startsWith(env.S3_PUBLIC_URL)) {
      return null;
    }
    return url.slice(env.S3_PUBLIC_URL.length + 1);
  },

  getPublicUrl(key: string): string | null {
    if (!env.S3_PUBLIC_URL) {
      return null;
    }
    return `${env.S3_PUBLIC_URL}/${key}`;
  },

  getUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      ContentType: contentType,
      Key: key,
      Tagging: "status=pending",
    });
    return getSignedUrl(s3, command, { expiresIn: 3600 });
  },

  async putObject(
    key: string,
    body: string | Buffer,
    contentType: string
  ): Promise<void> {
    await s3.send(
      new PutObjectCommand({
        Body: typeof body === "string" ? Buffer.from(body) : body,
        Bucket: bucket,
        ContentType: contentType,
        Key: key,
      })
    );
  },
};

export type Storage = typeof storage;

export {
  AVATAR_COLORS,
  generateAndUploadAvatar,
  generateAvatarDataUri,
  generateAvatarSvg,
} from "./avatar";
