"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { gsap, useGSAP } from "@/lib/gsap";

type Stats = {
  users: number;
  posts: number;
  comments: number;
  opportunities: number;
  events: number;
  pending_reports: number;
};

const labels: Record<keyof Stats, string> = {
  users: "Members",
  posts: "Live posts",
  comments: "Comments",
  opportunities: "Opportunities",
  events: "Events",
  pending_reports: "Pending reports",
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    apiFetch<Stats>("/api/admin/stats").then(setStats).catch(() => setStats(null));
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".admin-stat", {
          y: 18,
          autoAlpha: 0,
          duration: 0.5,
          stagger: 0.07,
          ease: "power2.out",
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [stats] },
  );

  return (
    <main ref={root} className="px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="font-display text-3xl sm:text-4xl">Overview</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Manage the CS graduate community: members, feed posts, reports,
        opportunities, and events. Members can ask questions, comment, like, and update
        their profile.
      </p>
      {stats ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {(Object.keys(labels) as Array<keyof Stats>).map((key) => (
            <article key={key} className="admin-stat card-hover rounded-2xl border border-line bg-card p-5">
              <p className="text-sm text-ink-soft">{labels[key]}</p>
              <p className="font-display mt-2 text-3xl">{stats[key]}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-ink-soft">Loading stats…</p>
      )}
    </main>
  );
}
