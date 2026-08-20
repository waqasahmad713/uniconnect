"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { apiFetch } from "@/lib/api";
import type { EventItem } from "@/types";

export default function EventsPage() {
  const [items, setItems] = useState<EventItem[]>([]);

  useEffect(() => {
    apiFetch<EventItem[]>("/api/events").then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-4xl">Events</h1>
        <p className="mt-3 text-ink-soft">Workshops, meetups, seminars, hackathons, and career events.</p>
        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-line bg-card p-6">
              <h2 className="font-display text-2xl">{item.title}</h2>
              <p className="text-ink-soft">
                {new Date(item.starts_at).toLocaleString()} · {item.is_online ? "Online" : item.location}
              </p>
              <p className="mt-3 leading-7">{item.description}</p>
              <p className="mt-3 text-sm text-ink-soft">Organized by {item.organizer_name}</p>
            </article>
          ))}
          {items.length === 0 ? <p className="text-ink-soft">No events yet.</p> : null}
        </div>
      </main>
    </div>
  );
}
