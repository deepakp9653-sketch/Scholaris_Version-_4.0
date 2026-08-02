export function istStartOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+05:30`);
}

export function istEndOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59+05:30`);
}
