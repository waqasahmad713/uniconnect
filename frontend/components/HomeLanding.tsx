"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { HomeHub } from "@/components/HomeHub";
import { apiFetch } from "@/lib/api";
import { gsap, useGSAP } from "@/lib/gsap";
import type { UserMe } from "@/types";

const sections = [
  {
    title: "Feed",
    body: "Ideas, discussions, and resources from CS graduates, students, and professionals.",
    href: "/community",
  },
  {
    title: "Questions",
    body: "Stuck on an assignment, project, or concept? Ask the CS community.",
    href: "/questions",
  },
  {
    title: "Opportunities",
    body: "Find internships, jobs, and research posts — then share them with the community.",
    href: "/opportunities",
  },
];

export function HomeLanding() {
  const [me, setMe] = useState<UserMe | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    apiFetch<UserMe>("/api/auth/me")
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-full flex-col">
        <Header />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6">
          <div className="h-8 w-40 animate-pulse rounded-full bg-line/70" />
          <div className="mt-6 h-16 w-3/4 max-w-xl animate-pulse rounded-2xl bg-line/60" />
          <div className="mt-4 h-20 w-full max-w-lg animate-pulse rounded-2xl bg-line/50" />
        </div>
      </div>
    );
  }

  if (me) {
    return <HomeHub me={me} />;
  }

  return <PublicHome />;
}

function PublicHome() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from(".hero-mark", { y: 20, autoAlpha: 0, duration: 0.6 })
          .from(".hero-title", { y: 36, autoAlpha: 0, duration: 0.8 }, "-=0.35")
          .from(".hero-copy", { y: 24, autoAlpha: 0, duration: 0.7 }, "-=0.45")
          .from(".hero-actions a", { y: 16, autoAlpha: 0, duration: 0.5, stagger: 0.1 }, "-=0.4")
          .from(".hero-panel", { x: 28, autoAlpha: 0, duration: 0.8 }, "-=0.7")
          .from(".home-card", { y: 28, autoAlpha: 0, duration: 0.6, stagger: 0.12 }, "-=0.45");

        gsap.to(".float-orb", {
          y: 18,
          duration: 4.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          stagger: { each: 0.6 },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative flex min-h-full flex-col">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="float-orb absolute -left-16 top-24 h-56 w-56 rounded-full bg-teal/15 blur-3xl" />
        <span className="float-orb absolute right-[-4rem] top-40 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
        <span className="float-orb absolute bottom-20 left-1/3 h-40 w-40 rounded-full bg-[#7eb6d0]/20 blur-3xl" />
      </div>
      <Header />
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12 md:gap-16 md:py-16">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="hero-mark text-[11px] font-semibold uppercase tracking-[0.16em] text-teal sm:text-xs sm:tracking-[0.2em]">
              CS Graduate Community
            </p>
            <h1 className="hero-title font-display mt-4 max-w-xl text-4xl leading-tight text-ink sm:text-5xl md:text-6xl">
              For CS graduates, by CS graduates.
            </h1>
            <p className="hero-copy mt-5 max-w-lg text-base leading-7 text-ink-soft sm:mt-6 sm:text-lg sm:leading-8">
              A text-first space to ask questions, follow the feed, and stay connected
              with Computer Science graduates, students, and professionals.
            </p>
            <div className="hero-actions mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-5 font-semibold text-white shadow-[0_10px_24px_rgba(196,92,38,0.28)]"
              >
                Log in and stay
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-card px-5 font-semibold"
              >
                Join the community
              </Link>
              <Link
                href="/community"
                className="inline-flex min-h-12 items-center justify-center px-2 font-semibold text-teal"
              >
                Browse the feed
              </Link>
            </div>
          </div>
          <aside className="hero-panel rounded-3xl border border-line bg-card p-5 shadow-[0_16px_40px_rgba(22,33,30,0.06)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Community</p>
            <h2 className="font-display mt-2 text-3xl">Grad CS</h2>
            <ul className="mt-6 space-y-3 text-sm leading-6 text-ink-soft">
              <li className="rounded-xl bg-paper px-4 py-3">Graduates share work, notes, and ideas.</li>
              <li className="rounded-xl bg-paper px-4 py-3">Peers can answer questions and open doors.</li>
              <li className="rounded-xl bg-paper px-4 py-3">No video feed — write, discuss, and help.</li>
            </ul>
          </aside>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="home-card card-hover rounded-2xl border border-line bg-card p-6"
            >
              <h2 className="font-display text-2xl">{section.title}</h2>
              <p className="mt-3 leading-7 text-ink-soft">{section.body}</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
