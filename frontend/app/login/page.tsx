"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { markJustSignedIn } from "@/lib/session";
import {
  AuthShell,
  Field,
  SubmitButton,
  PasswordInput,
  inputClassName,
  onFormData,
} from "@/components/AuthForm";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [verifyUrl, setVerifyUrl] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <AuthShell title="Welcome back" subtitle="Log in and land in your CS home — the feed, questions, and internships waiting for you.">
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          const form = onFormData(event);
          setPending(true);
          setError("");
          setVerifyUrl("");
          try {
            await apiFetch("/api/auth/login", {
              method: "POST",
              body: JSON.stringify({
                email: form.get("email"),
                password: form.get("password"),
              }),
            });
            markJustSignedIn();
            router.push("/");
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not log in.");
            if (err instanceof ApiError && err.verificationUrl) {
              setVerifyUrl(err.verificationUrl);
            }
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Email">
          <input className={inputClassName} name="email" type="email" required />
        </Field>
        <Field label="Password">
          <PasswordInput name="password" autoComplete="current-password" required />
        </Field>
        {error ? <p className="text-sm text-accent-dark">{error}</p> : null}
        {verifyUrl ? (
          <Link
            href={verifyUrl}
            className="block rounded-full bg-teal px-4 py-3 text-center font-semibold text-white"
          >
            Verify email now
          </Link>
        ) : null}
        <SubmitButton pending={pending}>Log in</SubmitButton>
      </form>
      <p className="mt-6 text-sm text-ink-soft">
        <Link href="/forgot-password">Forgot password?</Link>
        <span className="mx-2">·</span>
        <Link href="/register">Create an account</Link>
      </p>
    </AuthShell>
  );
}
