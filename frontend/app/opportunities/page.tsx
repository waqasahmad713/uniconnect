"use client";

import { FormEvent, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { OpportunityCard } from "@/components/OpportunityCard";
import { apiFetch } from "@/lib/api";
import { inputClassName } from "@/components/AuthForm";
import type { Opportunity } from "@/types";

const filters = [
  { id: "all", label: "All" },
  { id: "internship", label: "Internships" },
  { id: "job", label: "Jobs" },
  { id: "research", label: "Research" },
  { id: "project", label: "Projects" },
  { id: "freelance", label: "Freelance" },
];

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function load(nextQuery = query, nextFilter = filter) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextFilter !== "all") params.set("opportunity_type", nextFilter);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    setItems(await apiFetch<Opportunity[]>(`/api/opportunities${suffix}`));
  }

  useEffect(() => {
    load().catch(() => setError("Could not load opportunities."));
  }, [filter]);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await load(query, filter);
    } catch {
      setError("Could not search opportunities.");
    }
  }

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">AWKUM CS</p>
        <h1 className="font-display mt-2 text-3xl sm:text-4xl">Opportunities</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Internships, jobs, research, and projects for the Computer Science community. Find one
          that fits, then share it with classmates.
        </p>

        <form onSubmit={onSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            className={inputClassName}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search internships, companies, or roles"
          />
          <button className="min-h-11 rounded-full bg-ink px-5 font-semibold text-paper sm:w-auto">
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${
                filter === item.id
                  ? "border-teal bg-teal text-white"
                  : "border-line bg-card text-ink-soft"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error ? <p className="mt-4 text-sm text-accent-dark">{error}</p> : null}

        <div className="mt-8 space-y-4">
          {items.map((item) => (
            <OpportunityCard key={item.id} item={item} compact />
          ))}
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">
              No opportunities yet. Admins publish internships and jobs here.
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
