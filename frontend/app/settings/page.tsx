"use client";

import { FormEvent, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Avatar } from "@/components/Avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiFetch, ApiError } from "@/lib/api";
import { PasswordInput } from "@/components/AuthForm";

type Me = {
  full_name: string;
  profile_picture_url: string | null;
};

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    apiFetch<Me>("/api/users/me").then(setMe).catch(() => setMe(null));
  }, []);

  async function onPhoto(file: File) {
    if (!me) return;
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const updated = await apiFetch<Me>("/api/users/me/photo", {
        method: "POST",
        body: form,
      });
      setMe(updated);
      setMessage("Profile photo updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload photo.");
    } finally {
      setUploading(false);
    }
  }

  async function onPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setMessage("");
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: data.get("current_password"),
          password: data.get("password"),
          confirm_password: data.get("confirm_password"),
        }),
      });
      form.reset();
      setMessage("Password updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change password.");
    }
  }

  if (!me) {
    return (
      <div className="min-h-full">
        <Header />
        <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
          <h1 className="font-display text-3xl sm:text-4xl">Settings</h1>
          <p className="mt-2 text-ink-soft">Choose a theme, or log in to change your photo and password.</p>
          <section className="mt-8 rounded-2xl border border-line bg-card p-5">
            <h2 className="font-display text-2xl">Appearance</h2>
            <p className="mt-1 text-sm text-ink-soft">Choose a light or dark theme. It stays on this device.</p>
            <div className="mt-4">
              <ThemeToggle />
            </div>
          </section>
          <p className="mt-8">
            <a href="/login" className="font-semibold text-teal">
              Log in
            </a>{" "}
            to change your photo or password.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-3xl sm:text-4xl">Settings</h1>
        <p className="mt-2 text-ink-soft">Update your profile photo, theme, or password.</p>

        <section className="mt-8 rounded-2xl border border-line bg-card p-5">
          <h2 className="font-display text-2xl">Appearance</h2>
          <p className="mt-1 text-sm text-ink-soft">Choose a light or dark theme. It stays on this device.</p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </section>

        <div className="mt-8 flex items-center gap-4 rounded-2xl border border-line bg-card p-5">
          <Avatar name={me.full_name} src={me.profile_picture_url} size="lg" />
          <div>
            <p className="font-semibold">{me.full_name}</p>
            <label className="mt-2 inline-block cursor-pointer text-sm font-semibold text-teal">
              {uploading ? "Uploading…" : "Change profile photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onPhoto(file);
                }}
              />
            </label>
            <p className="mt-1 text-xs text-ink-soft">JPEG, PNG, or WebP. Max 2 MB.</p>
          </div>
        </div>

        <form className="mt-8 space-y-4 rounded-2xl border border-line bg-card p-5" onSubmit={onPassword}>
          <h2 className="font-display text-2xl">Change password</h2>
          <PasswordInput
            name="current_password"
            placeholder="Current password"
            autoComplete="current-password"
            required
          />
          <PasswordInput
            name="password"
            placeholder="New password"
            minLength={8}
            autoComplete="new-password"
            required
          />
          <PasswordInput
            name="confirm_password"
            placeholder="Confirm new password"
            minLength={8}
            autoComplete="new-password"
            required
          />
          {error ? <p className="text-sm text-accent-dark">{error}</p> : null}
          {message ? <p className="text-sm text-teal">{message}</p> : null}
          <button className="min-h-12 w-full rounded-full bg-accent px-5 py-3 font-semibold text-white sm:w-auto">
            Update password
          </button>
        </form>
      </main>
    </div>
  );
}
