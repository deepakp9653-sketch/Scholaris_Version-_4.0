// In-memory preview store for CAP batch pre-import summaries
import type { ParsedBatch } from './parserTypes';

interface PreviewEntry {
  batch: ParsedBatch;
  expiresAt: number;
}

const store = new Map<string, PreviewEntry>();
const TTL_MS = 30 * 60 * 1000; // 30 minutes

export function storePreview(id: string, batch: ParsedBatch): void {
  store.set(id, { batch, expiresAt: Date.now() + TTL_MS });
}

export function getPreview(id: string): ParsedBatch | null {
  const entry = store.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(id);
    return null;
  }
  return entry.batch;
}

export function deletePreview(id: string): void {
  store.delete(id);
}

export function generatePreviewId(): string {
  return `prev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
