"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Report = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  details: string | null;
  created_at: string;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setReports(await apiFetch<Report[]>("/api/admin/reports"));
  }

  useEffect(() => {
    load().catch(() => setError("Could not load reports."));
  }, []);

  async function act(path: string) {
    setError("");
    try {
      await apiFetch(path, { method: "POST" });
      await load();
    } catch {
      setError("Action failed.");
    }
  }

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-10">
      <h1 className="font-display text-3xl sm:text-4xl">Reports</h1>
      <p className="mt-2 text-ink-soft">Dismiss noise, or take action to remove the reported content.</p>
      {error ? <p className="mt-4 text-sm text-accent-dark">{error}</p> : null}
      <div className="mt-8 space-y-3">
        {reports.map((report) => (
          <article key={report.id} className="rounded-2xl border border-line bg-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-teal">
              {report.target_type} · {report.reason} · {report.status}
            </p>
            <p className="mt-2 font-semibold">{report.details || "No extra details."}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {new Date(report.created_at).toLocaleString()} · {report.target_id}
            </p>
            {report.status === "pending" ? (
              <div className="mt-3 flex gap-4 text-sm">
                <button
                  type="button"
                  className="text-teal"
                  onClick={() => act(`/api/admin/reports/${report.id}/dismiss`)}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  className="text-accent-dark"
                  onClick={() => act(`/api/admin/reports/${report.id}/action`)}
                >
                  Take action
                </button>
              </div>
            ) : null}
          </article>
        ))}
        {reports.length === 0 ? <p className="text-ink-soft">No reports yet.</p> : null}
      </div>
    </main>
  );
}
