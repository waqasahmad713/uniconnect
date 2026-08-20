"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch } from "@/lib/api";
import {
  AuthShell,
  Field,
  SubmitButton,
  PasswordInput,
  onFormData,
} from "@/components/AuthForm";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <AuthShell title="Choose a new password" subtitle="This link can be used once.">
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          const form = onFormData(event);
          setPending(true);
          setError("");
          try {
            const result = await apiFetch<{ message: string }>("/api/auth/reset-password", {
              method: "POST",
              body: JSON.stringify({
                token,
                password: form.get("password"),
                confirm_password: form.get("confirm_password"),
              }),
            });
            setMessage(result.message);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not reset password.");
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="New password">
          <PasswordInput name="password" minLength={8} autoComplete="new-password" required />
        </Field>
        <Field label="Confirm password">
          <PasswordInput name="confirm_password" autoComplete="new-password" required />
        </Field>
        {error ? <p className="text-sm text-accent-dark">{error}</p> : null}
        {message ? (
          <p className="text-sm text-teal">
            {message} <Link href="/login">Log in</Link>
          </p>
        ) : null}
        <SubmitButton pending={pending}>Update password</SubmitButton>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
