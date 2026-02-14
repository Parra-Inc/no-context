import { put } from "@vercel/blob";
import { randomBytes } from "crypto";

export async function uploadImage(
  imageBuffer: Buffer,
  workspaceId: string,
  quoteId: string,
): Promise<string> {
  const hash = randomBytes(8).toString("hex");
  const pathname = `${workspaceId}/${quoteId}-${hash}.png`;

  const blob = await put(pathname, imageBuffer, {
    access: "public",
    contentType: "image/png",
  });

  return blob.url;
}
