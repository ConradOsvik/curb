import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const fontPath = fileURLToPath(new URL("Nunito-Bold.woff2", import.meta.url));
export const nunitoBoldBase64 = readFileSync(fontPath).toString("base64");
