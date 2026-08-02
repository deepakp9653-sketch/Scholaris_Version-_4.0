interface SystemCheckResult {
  passed: boolean;
  notes: string[];
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function systemCheck(
  buffer: Buffer,
  mimeType: string
): Promise<SystemCheckResult> {
  const notes: string[] = [];
  let passed = true;

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    notes.push(`Invalid file type: ${mimeType}. Allowed: JPG, PNG, PDF`);
    passed = false;
  }

  if (buffer.length > MAX_FILE_SIZE) {
    notes.push(`File too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Max: 10MB`);
    passed = false;
  }

  if (buffer.length === 0) {
    notes.push("File is empty");
    passed = false;
  }

  if (mimeType === "application/pdf" && buffer.length < 100) {
    notes.push("PDF appears to be empty or corrupted");
    passed = false;
  }

  if (mimeType.startsWith("image/")) {
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
    if (!isJpeg && !isPng) {
      notes.push("Image file signature does not match declared type");
      passed = false;
    }
  }

  return { passed, notes };
}
