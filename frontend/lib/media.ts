export function mediaUrl(src?: string | null): string {
  if (!src) return "";
  if (src.startsWith("/")) return src;
  try {
    const parsed = new URL(src);
    if (
      parsed.pathname.startsWith("/api/files/") ||
      parsed.pathname.startsWith("/uploads/")
    ) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return src;
  }
  return src;
}
