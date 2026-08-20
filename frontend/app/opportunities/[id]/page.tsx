"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { OpportunityCard } from "@/components/OpportunityCard";
import { apiFetch } from "@/lib/api";
import type { Opportunity } from "@/types";

export default function OpportunityDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<Opportunity | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    apiFetch<Opportunity>(`/api/opportunities/${params.id}`)
      .then(setItem)
      .catch(() => setMissing(true));
  }, [params.id]);

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/opportunities" className="text-sm font-semibold text-teal">
          ← All opportunities
        </Link>
        {item ? (
          <div className="mt-6">
            <OpportunityCard item={item} />
          </div>
        ) : (
          <p className="mt-6 text-ink-soft">
            {missing ? "This opportunity was removed or does not exist." : "Loading…"}
          </p>
        )}
      </main>
    </div>
  );
}
