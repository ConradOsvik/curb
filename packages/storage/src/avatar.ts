import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@curb/env/server";

import { bucket, s3 } from "./client";
import { nunitoBoldBase64 } from "./fonts/index";

export const AVATAR_COLORS = [
  "f44336",
  "e91e63",
  "9c27b0",
  "673ab7",
  "3f51b5",
  "2196f3",
  "03a9f4",
  "00bcd4",
  "009688",
  "4caf50",
  "ff9800",
  "ff5722",
  "795548",
  "607d8b",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function generateAvatarSvg(
  name: string,
  backgroundColor: string
): string {
  const initials = getInitials(name);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <style>
      @font-face {
        font-family: 'Nunito';
        font-weight: 700;
        src: url('data:font/woff2;base64,${nunitoBoldBase64}') format('woff2');
      }
    </style>
  </defs>
  <rect width="128" height="128" rx="0" fill="#${backgroundColor}" />
  <text x="64" y="64" fill="#fff" font-family="'Nunito', sans-serif" font-weight="700" font-size="52" text-anchor="middle" dominant-baseline="central">${initials}</text>
</svg>`;
}

function pickColor(): string {
  return (
    AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] ?? "607d8b"
  );
}

export function generateAvatarDataUri(name: string): string {
  const svg = generateAvatarSvg(name, pickColor());
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function generateAndUploadAvatar(
  name: string,
  id: string
): Promise<string> {
  const color = pickColor();
  const svg = generateAvatarSvg(name, color);
  const key = `avatars/${id}.svg`;

  try {
    await s3.send(
      new PutObjectCommand({
        Body: Buffer.from(svg),
        Bucket: bucket,
        ContentType: "image/svg+xml",
        Key: key,
      })
    );

    if (env.S3_PUBLIC_URL) {
      return `${env.S3_PUBLIC_URL}/${key}`;
    }
  } catch {
    // S3 unavailable — fall through to data URI
  }

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
