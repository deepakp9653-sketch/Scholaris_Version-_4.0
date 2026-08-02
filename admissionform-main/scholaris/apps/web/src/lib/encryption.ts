import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_ENV = "FIELD_ENCRYPTION_KEY";

function getKey(): Buffer {
  const raw = process.env[KEY_ENV];
  if (!raw) {
    throw new Error(`${KEY_ENV} environment variable is not set`);
  }
  return crypto.scryptSync(raw, "scholaris-salt", 32);
}

export function encryptField(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return iv.toString("hex") + ":" + tag.toString("hex") + ":" + encrypted;
}

export function decryptField(ciphertext: string): string {
  if (!ciphertext || !ciphertext.includes(":")) return ciphertext;
  const key = getKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) return ciphertext;
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function redactAadhar(aadhar: string | null | undefined): string {
  if (!aadhar) return "********####";
  const clean = aadhar.replace(/\s+/g, "");
  if (clean.length < 4) return `********${clean}`;
  return `********${clean.slice(-4)}`;
}

export function encryptAadharToBuffer(plaintext: string | null | undefined): Buffer | null {
  if (!plaintext) return null;
  const encrypted = encryptField(plaintext);
  return Buffer.from(encrypted, "utf8");
}

export function decryptAadharFromBuffer(buf: Buffer | Uint8Array | null | undefined): string {
  if (!buf) return "";
  const str = Buffer.from(buf).toString("utf8");
  return decryptField(str);
}
