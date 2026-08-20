export async function shareLink({
  title,
  text,
  url,
}: {
  title: string;
  text?: string;
  url: string;
}): Promise<"shared" | "copied" | "cancelled"> {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return "shared";
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return "cancelled";
    }
  }

  await navigator.clipboard.writeText(url);
  return "copied";
}

export function pageUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}
