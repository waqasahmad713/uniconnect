"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { apiFetch } from "@/lib/api";

type Note = {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    apiFetch<Note[]>("/api/notifications").then(setNotes).catch(() => setNotes([]));
  }, []);

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-4xl">Notifications</h1>
        <div className="mt-8 space-y-3">
          {notes.map((note) => (
            <article key={note.id} className="rounded-2xl border border-line bg-card p-4">
              <h2 className="font-semibold">{note.title}</h2>
              <p className="text-sm text-ink-soft">{note.body}</p>
            </article>
          ))}
          {notes.length === 0 ? <p className="text-ink-soft">No notifications yet.</p> : null}
        </div>
      </main>
    </div>
  );
}
