# Object Storage Setup — Document Uploads
## Scholaris — Admission Module (Phase 1)

Covers wiring the Document Verification Workspace (Stage 2, PRD §4.2/§8) to an
S3-compatible bucket. The endpoint you have is Neon's own S3-compatible storage
service — it speaks the standard AWS S3 API, so the regular `@aws-sdk/client-s3`
package works unmodified; no Neon-specific SDK is needed.

---

## 0. Security — same rule as the DB credentials

- These are live keys. Put them in `.env` only, never in committed code.
- If they've been pasted anywhere outside your local `.env` / hosting provider's
  env var panel, rotate them from the Neon console before go-live.
- Confirm the **bucket name** in the Neon console (Storage → your bucket) — the
  endpoint hostname (`br-tiny-water-ay4ktjot...`) identifies the storage
  *instance*, not necessarily the bucket name itself. Use the actual bucket name
  the console shows you in `S3_BUCKET_NAME` below.

---

## 1. Environment variables

Add to `.env` (alongside the Neon DB vars from `08_NEON_DB_SETUP.md`):

```bash
# S3-compatible storage (Neon Storage)
AWS_ENDPOINT_URL_S3="https://br-tiny-water-ay4ktjot.storage.c-5.us-east-2.aws.neon.tech"
AWS_ACCESS_KEY_ID="<your nak_live_... key>"
AWS_SECRET_ACCESS_KEY="<your nsk_live_... secret>"
AWS_REGION="us-east-2"
S3_BUCKET_NAME="<confirm exact bucket name from Neon console>"
```

Add the placeholder-only version to `.env.example`:

```bash
AWS_ENDPOINT_URL_S3=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION=""
S3_BUCKET_NAME=""
```

---

## 2. Install the SDK

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## 3. S3 client singleton

Create `apps/web/lib/storage/s3-client.ts` — same singleton reasoning as the
Prisma client (avoid re-instantiating per request):

```typescript
import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // required for most S3-compatible (non-AWS) endpoints
});

export const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
```

`forcePathStyle: true` matters — without it, the SDK tries virtual-hosted-style
URLs (`bucket.endpoint.com`) which most S3-compatible providers other than AWS
itself don't support, and uploads will fail with a DNS/404 error that's
confusing to debug later.

---

## 4. Key design — tie every object back to its checklist row

Per `04_SCHEMA.md` §2.8, every upload maps to a `checklist_item_id`. Use a
predictable, hierarchical object key so files are easy to audit and never
collide:

```
admissions/{admission_record_id}/{checklist_item_id}/{uploaded_at_iso}-{original_filename}
```

Example:
```
admissions/3f9a1e2b-.../item-16-aadhar/2026-07-30T10-15-00Z-aadhar_card.pdf
```

---

## 5. Upload flow (Server Action, per Tech Spec's "Server Actions handle mutations")

```typescript
// lib/storage/upload-document.ts
"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME } from "./s3-client";
import { prisma } from "@/lib/db/prisma";

export async function uploadDocument(
  admissionRecordId: string,
  checklistItemId: string,
  file: File,
  uploadMethod: "scan" | "drag_drop" | "browse"
) {
  // 1. Server-side MIME/type validation — never trust client-reported type
  const allowed = ["image/jpeg", "image/png", "application/pdf"];
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!allowed.includes(file.type)) {
    throw new Error("Unsupported file type — only JPG, PNG, PDF allowed.");
  }

  const key = `admissions/${admissionRecordId}/${checklistItemId}/${new Date().toISOString()}-${file.name}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  // 2. Persist metadata — the DB row, not the file, is the source of truth for state
  const record = await prisma.documentUpload.create({
    data: {
      admissionRecordId,
      checklistItemId,
      fileRef: key,
      fileType: file.type === "application/pdf" ? "pdf" : "image",
      uploadMethod,
      status: "UPLOADED_PENDING_REVIEW",
      uploadedAt: new Date(),
    },
  });

  // 3. Trigger the background auto-check job (Rules doc §5 — system layer)
  //    e.g. await inngest.send({ name: "document/uploaded", data: { id: record.id } });

  return record;
}
```

---

## 6. Preview/retrieval — signed URLs, never public objects

Documents contain sensitive PII (mark sheets, Aadhar xerox, caste certificates) —
the bucket must stay **private**. Generate short-lived signed URLs for the
Preview action instead of exposing public object URLs:

```typescript
// lib/storage/get-preview-url.ts
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_NAME } from "./s3-client";

export async function getDocumentPreviewUrl(fileRef: string) {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileRef });
  return getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes
}
```

Call this from a Server Action or Route Handler when the operator clicks
**Preview** — never store or return a permanent public URL in the DB.

---

## 7. Checklist for correct behavior

- [ ] Bucket is private (no public-read bucket policy) — confirm in Neon console.
- [ ] `forcePathStyle: true` is set (step 3) — omitting this is the most common
      cause of "upload succeeds locally, fails in prod" bugs with non-AWS S3
      endpoints.
- [ ] Every upload writes both the S3 object **and** the `document_upload` row in
      the same request — if the DB write fails after a successful S3 put, the
      object becomes orphaned (acceptable for v1; a periodic orphan-cleanup job
      is a reasonable Phase 7 addition, not a Phase 3 blocker).
- [ ] Preview always uses a signed, time-limited URL — never a permanent link.
- [ ] Server re-validates file type from the actual upload, not the filename
      extension or client-reported `Content-Type` header alone (Rules §5).

---

## 8. Master prompt addition

Add this to the master prompt you give OpenCode for Phase 3 (Document Upload &
Verification):

```
Also read 10_S3_STORAGE_SETUP.md before building any upload/preview code in
Phase 3. Use the exact S3 client configuration and key-naming scheme it
specifies (forcePathStyle: true is mandatory — the storage endpoint is
S3-compatible but not AWS itself). Documents contain sensitive PII, so the
bucket must stay private and all preview access must go through short-lived
signed URLs (step 6) — never generate or store a permanent public object URL.
I've already created .env with the real AWS_ENDPOINT_URL_S3/AWS_ACCESS_KEY_ID/
AWS_SECRET_ACCESS_KEY/AWS_REGION/S3_BUCKET_NAME values — read them from there,
don't ask me to paste them again.
```
