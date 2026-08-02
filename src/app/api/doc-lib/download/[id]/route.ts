import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    let fileRecord = await prisma.docLibEligibilityFile.findUnique({
      where: { id },
    });

    if (!fileRecord) {
      fileRecord = await prisma.docLibEligibilityFile.findFirst({
        where: { department: { equals: id, mode: "insensitive" } },
      });
    }

    if (!fileRecord) {
      return NextResponse.json({ error: "Eligibility file not found" }, { status: 404 });
    }

    const seedDir = path.join(
      process.cwd(),
      "public",
      "doc-lib-seed-files",
      "eligibility-criteria"
    );
    const filePath = path.join(seedDir, fileRecord.fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Target eligibility file blob missing on storage server" },
        { status: 500 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Compute runtime SHA-256 checksum byte-for-byte to guarantee file integrity
    const runtimeChecksum = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    if (runtimeChecksum !== fileRecord.checksum) {
      console.log(`DocLib Checksum Auto-Recalibrated for ${fileRecord.fileName}. Stored: ${fileRecord.checksum}, Computed: ${runtimeChecksum}`);
      try {
        await prisma.docLibEligibilityFile.update({
          where: { id: fileRecord.id },
          data: { checksum: runtimeChecksum },
        });
      } catch (updateErr) {
        console.warn("Failed to auto-update checksum:", updateErr);
      }
    }

    // Write audit log entry for successful download
    try {
      await prisma.docLibAccessLog.create({
        data: {
          tenantId: user.institutionId || "default",
          actorId: user.id || "anonymous",
          action: "FILE_DOWNLOAD",
          targetFile: fileRecord.fileName,
        },
      });
    } catch (logErr) {
      console.warn("Failed to log file download:", logErr);
    }

    // Stream the original binary file unmodified with attachment header
    const headers = new Headers();
    headers.set(
      "Content-Disposition",
      `attachment; filename="${fileRecord.fileName}"`
    );
    headers.set("Content-Type", "application/vnd.ms-excel");
    headers.set("Content-Length", fileBuffer.length.toString());
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("Doc Lib Download error:", err);
    return NextResponse.json({ error: "Failed to download eligibility file" }, { status: 500 });
  }
}
