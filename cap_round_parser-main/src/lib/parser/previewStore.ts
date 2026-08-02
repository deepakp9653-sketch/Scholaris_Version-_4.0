import { ParsedBatch } from './parserTypes';

const previewCache = new Map<string, { data: ParsedBatch; expiresAt: number }>();

export function storePreview(parsedData: ParsedBatch): string {
  const previewId = 'prev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
  // Store for 30 minutes
  previewCache.set(previewId, {
    data: parsedData,
    expiresAt: Date.now() + 30 * 60 * 1000
  });
  return previewId;
}

export function getPreview(previewId: string): ParsedBatch | null {
  const cached = previewCache.get(previewId);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    previewCache.delete(previewId);
    return null;
  }
  return cached.data;
}

export function clearPreview(previewId: string) {
  previewCache.delete(previewId);
}
