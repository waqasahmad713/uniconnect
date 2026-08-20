"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { apiFetch } from "@/lib/api";
import type { UserPublic } from "@/types";
import { inputClassName } from "@/components/AuthForm";

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<UserPublic[]>([]);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    const data = await apiFetch<UserPublic[]>(`/api/users/search?${params.toString()}`);
    setPeople(data);
  }

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-4xl">Discover people</h1>
        <form onSubmit={onSearch} className="mt-6 flex gap-3">
          <input
            className={inputClassName}
            placeholder="Search name, skill, or job title"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper">
            Search
          </button>
        </form>
        <div className="mt-8 space-y-4">
          {people.map((person) => (
            <article key={person.id} className="rounded-2xl border border-line bg-card p-5">
              <h2 className="font-display text-2xl">{person.full_name}</h2>
              <p className="text-ink-soft">
                {person.current_job || person.department}
                {person.batch ? ` · Batch ${person.batch}` : ""}
              </p>
              <p className="mt-2 text-sm text-teal">{person.skills.join(" · ")}</p>
              <Link className="mt-3 inline-block text-sm font-semibold" href={`/profile/${person.username}`}>
                View profile
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
