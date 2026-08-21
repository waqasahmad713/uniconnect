"use client";

import { useState } from "react";
import Link from "next/link";
import type { Opportunity } from "@/types";
import { pageUrl, shareLink } from "@/lib/share";

const typeLabels: Record<string, string> = {
  job: "Job",
  internship: "Internship",
  project: "Project",
  research: "Research",
  freelance: "Freelance",
};

export function OpportunityCard({
  item,
  compact = false,
}: {
  item: Opportunity;
  compact?: boolean;
}) {
  const [message, setMessage] = useState("");
  const path = `/opportunities/${item.id}`;

  async function share() {
    const result = await shareLink({
      title: `${item.title} at ${item.organization}`,
      text: `Opportunity for CS graduates: ${item.title} at ${item.organization}`,
      url: pageUrl(path),
    });
    if (result === "copied") setMessage("Link copied. You can paste it in WhatsApp or email.");
    if (result === "shared") setMessage("Shared.");
  }

  return (
    <article className="card-hover rounded-2xl border border-line bg-card p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
        {typeLabels[item.opportunity_type] ?? item.opportunity_type}
      </p>
      <h2 className="font-display mt-2 text-2xl leading-tight break-words">
        {compact ? <Link href={path}>{item.title}</Link> : item.title}
      </h2>
      <p className="mt-1 text-ink-soft">
        {item.organization} · {item.work_mode}
        {item.location ? ` · ${item.location}` : ""}
      </p>
      {item.deadline ? (
        <p className="mt-1 text-sm text-accent-dark">
          Deadline {new Date(item.deadline).toLocaleDateString()}
        </p>
      ) : null}
      <p className={`mt-3 leading-7 break-words ${compact ? "line-clamp-4" : ""}`}>
        {item.description}
      </p>
      {item.skills.length > 0 ? (
        <p className="mt-3 text-sm text-teal">{item.skills.join(" · ")}</p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {item.application_url ? (
          <a
            href={item.application_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-4 font-semibold text-white"
          >
            Apply
          </a>
        ) : null}
        {compact ? (
          <Link
            href={path}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-paper px-4 font-semibold"
          >
            View details
          </Link>
        ) : null}
        <button
          type="button"
          onClick={share}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-paper px-4 font-semibold"
        >
          Share
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-teal">{message}</p> : null}
    </article>
  );
}
