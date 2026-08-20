"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { AuthShell } from "@/components/AuthForm";

function Verify() {
  const token = useSearchParams().get("token") ?? "";
  const [message, setMessage] = useState("Verifying your email…");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Missing verification token.");
      return;
    }
    apiFetch<{ message: string }>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then((result) => setMessage(result.message))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Verification failed.")
      );
  }, [token]);

  return (
    <AuthShell title="Email verification" subtitle="Confirming the link from your inbox.">
      {error ? <p className="text-accent-dark">{error}</p> : <p className="text-teal">{message}</p>}
      <Link href="/login" className="mt-6 inline-block font-semibold text-accent">
        Go to login
      </Link>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
}
