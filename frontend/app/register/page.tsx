"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch } from "@/lib/api";
import {
  AuthShell,
  Field,
  SubmitButton,
  PasswordInput,
  inputClassName,
  onFormData,
} from "@/components/AuthForm";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [verifyUrl, setVerifyUrl] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <AuthShell
      title="Join Grad CS"
      subtitle="Create an account for the Computer Science graduate community."
    >
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          const form = onFormData(event);
          setPending(true);
          setError("");
          setMessage("");
          setVerifyUrl("");
          try {
            const result = await apiFetch<{
              message: string;
              verification_url?: string | null;
            }>("/api/auth/register", {
              method: "POST",
              body: JSON.stringify({
                full_name: form.get("full_name"),
                email: form.get("email"),
                password: form.get("password"),
                confirm_password: form.get("confirm_password"),
                university: form.get("university"),
                department: form.get("department"),
                role: form.get("role"),
                batch: form.get("batch") || null,
                registration_number: form.get("registration_number") || null,
              }),
            });
            setMessage(result.message);
            if (result.verification_url) {
              setVerifyUrl(result.verification_url);
            }
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not register.");
            if (err instanceof ApiError && err.verificationUrl) {
              setVerifyUrl(err.verificationUrl);
            }
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Full name">
          <input className={inputClassName} name="full_name" required />
        </Field>
        <Field label="Email">
          <input className={inputClassName} name="email" type="email" required />
        </Field>
        <Field label="Password">
          <PasswordInput name="password" minLength={8} autoComplete="new-password" required />
        </Field>
        <Field label="Confirm password">
          <PasswordInput name="confirm_password" autoComplete="new-password" required />
        </Field>
        <Field label="University">
          <input className={inputClassName} name="university" required placeholder="Your university or college" />
        </Field>
        <Field label="Department">
          <input className={inputClassName} name="department" required defaultValue="Computer Science" />
        </Field>
        <Field label="Role">
          <select className={inputClassName} name="role" defaultValue="student">
            <option value="student">Student</option>
            <option value="alumni">Alumni</option>
            <option value="faculty">Faculty</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Batch (optional)">
          <input className={inputClassName} name="batch" placeholder="2025" />
        </Field>
        <Field label="Registration number (optional, private by default)">
          <input className={inputClassName} name="registration_number" placeholder="Optional student ID" />
        </Field>
        {error ? <p className="text-sm text-accent-dark">{error}</p> : null}
        {message ? <p className="text-sm text-teal">{message}</p> : null}
        {verifyUrl ? (
          <Link
            href={verifyUrl}
            className="block rounded-full bg-teal px-4 py-3 text-center font-semibold text-white"
          >
            Verify email now
          </Link>
        ) : null}
        <SubmitButton pending={pending}>Create account</SubmitButton>
      </form>
      <p className="mt-6 text-sm text-ink-soft">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </AuthShell>
  );
}
