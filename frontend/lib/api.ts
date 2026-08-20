export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

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

  const raw = await response.text();
  let data: {
    detail?:
      | string
      | { msg?: string; message?: string; verification_url?: string }[]
      | { message?: string; verification_url?: string };
    message?: string;
    verification_url?: string;
  } = {};
  if (raw) {
    try {
      data = JSON.parse(raw) as typeof data;
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    const detail = data.detail;
    let message = data.message;
    let verificationUrl = data.verification_url;

    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail[0]?.msg || message;
    } else if (detail && typeof detail === "object") {
      message = detail.message || message;
      verificationUrl = detail.verification_url ?? verificationUrl;
    }

    if (!message) {
      if (response.status >= 500) {
        message = "Server error. Please try again.";
      } else if (raw && !raw.trim().startsWith("{") && !raw.trim().startsWith("<")) {
        message = raw.trim().slice(0, 180);
      } else {
        message = "Request failed.";
      }
    }

    throw new ApiError(response.status, message, verificationUrl);
  }

  return (raw ? data : {}) as T;
}
