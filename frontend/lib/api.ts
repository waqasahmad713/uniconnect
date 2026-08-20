export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

export class ApiError extends Error {
  status: number;
  verificationUrl?: string;

  constructor(status: number, message: string, verificationUrl?: string) {
    super(message);
    this.status = status;
    this.verificationUrl = verificationUrl;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json().catch(() => ({}))) as {
    detail?:
      | string
      | { msg?: string; message?: string; verification_url?: string }[]
      | { message?: string; verification_url?: string };
    message?: string;
    verification_url?: string;
  };

  if (!response.ok) {
    const detail = data.detail;
    let message = data.message ?? "Request failed.";
    let verificationUrl = data.verification_url;

    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail[0]?.msg || message;
    } else if (detail && typeof detail === "object") {
      message = detail.message || message;
      verificationUrl = detail.verification_url ?? verificationUrl;
    }

    throw new ApiError(response.status, message || "Request failed.", verificationUrl);
  }

  return data as T;
}
