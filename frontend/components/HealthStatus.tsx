"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import type { ApiHealth } from "@/types";

type Status = "checking" | "ok" | "offline";

export function HealthStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [health, setHealth] = useState<ApiHealth | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(apiUrl("/health"), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Health check failed");
        }
        return (await response.json()) as ApiHealth;
      })
      .then((data) => {
        setHealth(data);
        setStatus("ok");
      })
      .catch(() => {
        setStatus("offline");
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="rounded-2xl border border-line bg-card p-6 shadow-[0_8px_30px_rgba(22,33,30,0.04)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
        Local setup
      </p>
      <h2 className="font-display mt-2 text-2xl text-ink">Service status</h2>
      <ul className="mt-5 space-y-3 text-sm">
        <li className="flex items-center justify-between rounded-xl bg-paper px-4 py-3">
          <span>Frontend</span>
          <StatusPill label="running" tone="ok" />
        </li>
        <li className="flex items-center justify-between rounded-xl bg-paper px-4 py-3">
          <span>Backend API</span>
          <StatusPill
            label={
              status === "checking"
                ? "checking"
                : status === "ok"
                  ? "connected"
                  : "offline"
            }
            tone={status === "ok" ? "ok" : status === "checking" ? "wait" : "bad"}
          />
        </li>
        <li className="flex items-center justify-between rounded-xl bg-paper px-4 py-3">
          <span>PostgreSQL</span>
          <StatusPill
            label={
              status === "checking"
                ? "checking"
                : health?.database === "connected"
                  ? "connected"
                  : "not connected"
            }
            tone={
              health?.database === "connected"
                ? "ok"
                : status === "checking"
                  ? "wait"
                  : "bad"
            }
          />
        </li>
      </ul>
    </section>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "wait" | "bad";
}) {
  const classes = {
    ok: "bg-[#e4efe8] text-teal",
    wait: "bg-[#f3ead6] text-ink-soft",
    bad: "bg-[#f8e5dc] text-accent-dark",
  }[tone];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}
