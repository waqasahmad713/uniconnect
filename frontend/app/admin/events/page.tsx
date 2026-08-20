"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { inputClassName } from "@/components/AuthForm";
import type { EventItem } from "@/types";

export default function AdminEventsPage() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setItems(await apiFetch<EventItem[]>("/api/events"));
  }

  useEffect(() => {
    load().catch(() => setError("Could not load events."));
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    try {
      await apiFetch("/api/events", {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"),
          description: data.get("description"),
          starts_at: new Date(String(data.get("starts_at"))).toISOString(),
          location: data.get("location") || null,
          is_online: data.get("is_online") === "on",
          registration_url: data.get("registration_url") || null,
        }),
      });
      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create event.");
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      await apiFetch(`/api/events/${id}`, { method: "DELETE" });
      await load();
    } catch {
      setError("Could not remove event.");
    }
  }

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="font-display text-3xl sm:text-4xl">Events</h1>
      <p className="mt-2 text-ink-soft">Workshops, meetups, seminars, and career events.</p>

      <form onSubmit={onCreate} className="mt-8 max-w-2xl space-y-3 rounded-2xl border border-line bg-card p-5">
        <input className={inputClassName} name="title" placeholder="Title" required />
        <textarea className={`${inputClassName} min-h-24`} name="description" placeholder="Description" required />
        <input className={inputClassName} name="starts_at" type="datetime-local" required />
        <input className={inputClassName} name="location" placeholder="Location (optional)" />
        <input className={inputClassName} name="registration_url" placeholder="Registration URL (optional)" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_online" />
          Online event
        </label>
        {error ? <p className="text-sm text-accent-dark">{error}</p> : null}
        <button className="min-h-12 w-full rounded-full bg-accent px-5 py-2 font-semibold text-white sm:w-auto">Publish event</button>
      </form>

      <div className="mt-8 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl">{item.title}</h2>
                <p className="text-sm text-ink-soft">
                  {new Date(item.starts_at).toLocaleString()} · {item.is_online ? "Online" : item.location}
                </p>
              </div>
              <button type="button" className="text-sm text-accent-dark" onClick={() => remove(item.id)}>
                Remove
              </button>
            </div>
            <p className="mt-3 leading-7 text-ink-soft">{item.description}</p>
          </article>
        ))}
        {items.length === 0 ? <p className="mt-6 text-ink-soft">No events yet.</p> : null}
      </div>
    </main>
  );
}
