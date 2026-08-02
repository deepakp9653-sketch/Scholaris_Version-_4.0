import { NextRequest } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME } from "@/lib/storage/s3-client";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const pathParts = await params;
  const key = pathParts.path.join("/");

  try {
    const { Body, ContentType } = await s3Client.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));

    const bytes = await Body?.transformToByteArray();
    if (!bytes) {
      return new Response("File not found", { status: 404 });
    }

    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": ContentType || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("File not found", { status: 404 });
  }
}
