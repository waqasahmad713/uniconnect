"use client";

import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import {
  AuthShell,
  Field,
  SubmitButton,
  inputClassName,
  onFormData,
} from "@/components/AuthForm";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll send a reset link if that email is registered. The response is the same either way."
    >
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          const form = onFormData(event);
          setPending(true);
          setError("");
          try {
            const result = await apiFetch<{ message: string }>("/api/auth/forgot-password", {
              method: "POST",
              body: JSON.stringify({ email: form.get("email") }),
            });
            setMessage(result.message);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not send reset email.");
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Email">
          <input className={inputClassName} name="email" type="email" required />
        </Field>
        {error ? <p className="text-sm text-accent-dark">{error}</p> : null}
        {message ? <p className="text-sm text-teal">{message}</p> : null}
        <SubmitButton pending={pending}>Send reset link</SubmitButton>
      </form>
    </AuthShell>
  );
}
