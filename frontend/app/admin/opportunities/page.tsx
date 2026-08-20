"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { inputClassName } from "@/components/AuthForm";
import type { Opportunity } from "@/types";

export default function AdminOpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setItems(await apiFetch<Opportunity[]>("/api/opportunities"));
  }

  useEffect(() => {
    load().catch(() => setError("Could not load opportunities."));
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    try {
      await apiFetch("/api/opportunities", {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"),
          organization: data.get("organization"),
          description: data.get("description"),
          opportunity_type: data.get("opportunity_type"),
          location: data.get("location") || null,
          work_mode: data.get("work_mode"),
          application_url: data.get("application_url") || null,
          skills: String(data.get("skills") || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create opportunity.");
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      await apiFetch(`/api/opportunities/${id}`, { method: "DELETE" });
      await load();
    } catch {
      setError("Could not remove opportunity.");
    }
  }

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="font-display text-3xl sm:text-4xl">Opportunities</h1>
      <p className="mt-2 text-ink-soft">Jobs, internships, research, and freelance posts for the community.</p>

      <form onSubmit={onCreate} className="mt-8 max-w-2xl space-y-3 rounded-2xl border border-line bg-card p-5">
        <input className={inputClassName} name="title" placeholder="Title" required />
        <input className={inputClassName} name="organization" placeholder="Organization" required />
        <textarea className={`${inputClassName} min-h-24`} name="description" placeholder="Description" required />
        <div className="grid gap-3 sm:grid-cols-2">
          <select className={inputClassName} name="opportunity_type" defaultValue="internship">
            <option value="job">Job</option>
            <option value="internship">Internship</option>
            <option value="project">Project</option>
            <option value="research">Research</option>
            <option value="freelance">Freelance</option>
          </select>
          <select className={inputClassName} name="work_mode" defaultValue="hybrid">
            <option value="remote">Remote</option>
            <option value="on-site">On-site</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <input className={inputClassName} name="location" placeholder="Location (optional)" />
        <input className={inputClassName} name="application_url" placeholder="Application URL (optional)" />
        <input className={inputClassName} name="skills" placeholder="Skills, comma separated" />
        {error ? <p className="text-sm text-accent-dark">{error}</p> : null}
        <button className="min-h-12 w-full rounded-full bg-accent px-5 py-2 font-semibold text-white sm:w-auto">Publish opportunity</button>
      </form>

      <div className="mt-8 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-teal">{item.opportunity_type}</p>
                <h2 className="font-display mt-1 text-2xl">{item.title}</h2>
                <p className="text-sm text-ink-soft">
                  {item.organization} · {item.work_mode}
                  {item.location ? ` · ${item.location}` : ""}
                </p>
              </div>
              <button type="button" className="text-sm text-accent-dark" onClick={() => remove(item.id)}>
                Remove
              </button>
            </div>
            <p className="mt-3 leading-7 text-ink-soft">{item.description}</p>
          </article>
        ))}
        {items.length === 0 ? <p className="mt-6 text-ink-soft">No opportunities yet.</p> : null}
      </div>
    </main>
  );
}
