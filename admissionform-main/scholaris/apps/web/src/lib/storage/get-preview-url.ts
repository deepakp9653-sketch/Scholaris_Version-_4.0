import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_NAME } from "./s3-client";

export async function getDocumentPreviewUrl(fileRef: string) {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileRef });
  return getSignedUrl(s3Client, command, { expiresIn: 300 });
}
