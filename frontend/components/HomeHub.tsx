"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Avatar } from "@/components/Avatar";
import { apiFetch } from "@/lib/api";
import { gsap, useGSAP } from "@/lib/gsap";
import { consumeJustSignedIn, firstName, greetingForNow } from "@/lib/session";
import { timeAgo } from "@/lib/time";
import { typeStyle } from "@/lib/postType";
import type { EventItem, Opportunity, Post, UserMe, UserPublic } from "@/types";

const actions = [
  {
    href: "/questions",
    kicker: "Ask",
    title: "Post a question",
    body: "Stuck on code, an assignment, or a concept? The department is here.",
    className: "from-[#1d5f7a] to-[#2a6b63]",
  },
  {
    href: "/community",
    kicker: "Read",
    title: "Open the feed",
    body: "Ideas, discussions, and resources from CS students and faculty.",
    className: "from-[#c45c26] to-[#9b4318]",
  },
  {
    href: "/opportunities",
    kicker: "Apply",
    title: "Find internships",
    body: "Jobs, research, and internships shared with AWKUM CS.",
    className: "from-[#2a6b63] to-[#1d4a45]",
  },
  {
    href: "/discover",
    kicker: "Meet",
    title: "Find classmates",
    body: "Search students, alumni, and faculty by name, skill, or batch.",
    className: "from-[#6b3d7a] to-[#3d2a4a]",
  },
];

export function HomeHub({ me }: { me: UserMe }) {
  const root = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<"boot" | "welcome" | "hub">("boot");
  const [posts, setPosts] = useState<Post[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [people, setPeople] = useState<UserPublic[]>([]);
  const name = firstName(me.full_name);
  const greeting = greetingForNow();
  const profileGaps = [
    !me.bio && "a short bio",
    !me.profile_picture_url && "a photo",
    me.skills.length === 0 && "your skills",
  ].filter(Boolean) as string[];

  useEffect(() => {
    setScene(consumeJustSignedIn() ? "welcome" : "hub");
    apiFetch<Post[]>("/api/posts?exclude_type=question")
      .then((data) => setPosts(data.slice(0, 4)))
      .catch(() => setPosts([]));
    apiFetch<Opportunity[]>("/api/opportunities")
      .then((data) => setOpportunities(data.slice(0, 3)))
      .catch(() => setOpportunities([]));
    apiFetch<EventItem[]>("/api/events")
      .then((data) => setEvents(data.slice(0, 2)))
      .catch(() => setEvents([]));
    apiFetch<UserPublic[]>("/api/users/search")
      .then((data) => setPeople(data.filter((person) => person.id !== me.id).slice(0, 5)))
      .catch(() => setPeople([]));
  }, [me.id]);

  useGSAP(
    () => {
      if (scene === "boot") return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(".float-orb", {
          y: 18,
          duration: 4.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          stagger: { each: 0.6 },
        });

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        const welcomed = scene === "welcome";

        if (welcomed) {
          gsap.set(".welcome-overlay", { autoAlpha: 1 });
          tl.from(".welcome-kicker", { y: 16, autoAlpha: 0, duration: 0.45 })
            .from(".welcome-name", { y: 28, autoAlpha: 0, duration: 0.7 }, "-=0.2")
            .from(".welcome-sub", { y: 16, autoAlpha: 0, duration: 0.5 }, "-=0.35")
            .to(".welcome-overlay", { autoAlpha: 0, duration: 0.55, delay: 0.85, ease: "power2.inOut" });
        } else {
          gsap.set(".welcome-overlay", { autoAlpha: 0 });
        }

        tl.from(".hub-hero > *", { y: 22, autoAlpha: 0, duration: 0.6, stagger: 0.08 }, welcomed ? "-=0.15" : 0)
          .from(".hub-action", { y: 24, autoAlpha: 0, duration: 0.5, stagger: 0.08 }, "-=0.35")
          .from(".hub-panel", { y: 20, autoAlpha: 0, duration: 0.55, stagger: 0.1 }, "-=0.3");
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".welcome-overlay", { autoAlpha: 0 });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [scene, me.full_name] },
  );

  return (
    <div ref={root} className="relative flex min-h-full flex-col">
      <div className="welcome-overlay pointer-events-none invisible fixed inset-0 z-50 flex items-center justify-center bg-ink px-6 text-center text-paper opacity-0">
        <div>
          <p className="welcome-kicker text-xs font-semibold uppercase tracking-[0.22em] text-[#e7c9a8]">
            You&apos;re in
          </p>
          <h1 className="welcome-name font-display mt-4 text-4xl sm:text-6xl">Welcome back, {name}</h1>
          <p className="welcome-sub mt-4 text-lg text-white/70">The CS community is live. Stay a while.</p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="float-orb absolute -left-16 top-24 h-56 w-56 rounded-full bg-teal/15 blur-3xl" />
        <span className="float-orb absolute right-[-4rem] top-32 h-64 w-64 rounded-full bg-accent/18 blur-3xl" />
        <span className="float-orb absolute bottom-24 left-1/3 h-40 w-40 rounded-full bg-[#7eb6d0]/20 blur-3xl" />
      </div>

      <Header />

      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12">
        <section className="hub-hero">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal sm:text-xs sm:tracking-[0.2em]">
            {greeting} · AWKUM CS
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display max-w-2xl text-4xl leading-tight text-ink sm:text-5xl md:text-6xl">
              {name}, pick up where the department left off.
            </h1>
            <Link href={`/profile/${me.username}`} className="flex items-center gap-3 rounded-full border border-line bg-card py-2 pl-2 pr-4">
              <Avatar name={me.full_name} src={me.profile_picture_url} />
              <span className="text-sm">
                <span className="block font-semibold">{me.full_name}</span>
                <span className="text-ink-soft">
                  {me.role}
                  {me.batch ? ` · Batch ${me.batch}` : ""}
                </span>
              </span>
            </Link>
          </div>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink-soft sm:text-lg">
            Ask a question, scan the feed, or find an internship — this is your desk in the CS community.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`hub-action card-hover group relative overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white ${action.className}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                {action.kicker}
              </p>
              <h2 className="font-display mt-3 text-2xl">{action.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/80">{action.body}</p>
              <span className="mt-4 inline-flex text-sm font-semibold text-white/90 group-hover:translate-x-1">
                Continue →
              </span>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_0.85fr]">
          <div className="hub-panel rounded-3xl border border-line bg-card/90 p-5 shadow-[0_16px_40px_rgba(22,33,30,0.05)] sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Live feed</p>
                <h2 className="font-display mt-1 text-2xl">What people are sharing</h2>
              </div>
              <Link href="/community" className="text-sm font-semibold text-teal">
                See all
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community#${post.id}`}
                  className="block rounded-2xl bg-paper px-4 py-3 transition hover:bg-[#efe7d8]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={post.author.full_name} src={post.author.profile_picture_url} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        <span className="font-semibold">{post.author.full_name}</span>
                        <span className="text-ink-soft"> · {timeAgo(post.created_at)}</span>
                      </p>
                      <p
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${typeStyle(post.post_type).badge}`}
                      >
                        {typeStyle(post.post_type).label}
                      </p>
                    </div>
                  </div>
                  <p className="font-display mt-2 text-lg leading-snug">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-soft">{post.content}</p>
                </Link>
              ))}
              {posts.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-soft">
                  The feed is quiet. Ask a question or check back after the next lecture.
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {profileGaps.length > 0 ? (
              <Link
                href="/settings"
                className="hub-panel card-hover block rounded-3xl border border-accent/30 bg-[#f8eee6] p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-dark">Your space</p>
                <h2 className="font-display mt-1 text-2xl">Finish your profile</h2>
                <p className="mt-2 text-sm leading-6 text-ink-soft">
                  Add {profileGaps.join(", ")} so classmates recognize you in the feed.
                </p>
              </Link>
            ) : null}

            <div className="hub-panel rounded-3xl border border-line bg-card p-5">
              <div className="flex items-end justify-between">
                <h2 className="font-display text-2xl">Opportunities</h2>
                <Link href="/opportunities" className="text-sm font-semibold text-teal">
                  Browse
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {opportunities.map((item) => (
                  <Link key={item.id} href={`/opportunities/${item.id}`} className="block rounded-xl bg-paper px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">
                      {item.opportunity_type}
                    </p>
                    <p className="mt-1 font-semibold leading-snug">{item.title}</p>
                    <p className="text-sm text-ink-soft">{item.organization}</p>
                  </Link>
                ))}
                {opportunities.length === 0 ? (
                  <p className="text-sm text-ink-soft">No openings posted yet.</p>
                ) : null}
              </div>
            </div>

            <div className="hub-panel rounded-3xl border border-line bg-card p-5">
              <div className="flex items-end justify-between">
                <h2 className="font-display text-2xl">Events</h2>
                <Link href="/events" className="text-sm font-semibold text-teal">
                  All events
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {events.map((item) => (
                  <div key={item.id} className="rounded-xl bg-paper px-4 py-3">
                    <p className="font-semibold leading-snug">{item.title}</p>
                    <p className="text-sm text-ink-soft">
                      {new Date(item.starts_at).toLocaleString()} · {item.is_online ? "Online" : item.location}
                    </p>
                  </div>
                ))}
                {events.length === 0 ? (
                  <p className="text-sm text-ink-soft">No upcoming events yet.</p>
                ) : null}
              </div>
            </div>

            {people.length > 0 ? (
              <div className="hub-panel rounded-3xl border border-line bg-card p-5">
                <div className="flex items-end justify-between">
                  <h2 className="font-display text-2xl">People around you</h2>
                  <Link href="/discover" className="text-sm font-semibold text-teal">
                    Discover
                  </Link>
                </div>
                <ul className="mt-4 space-y-3">
                  {people.map((person) => (
                    <li key={person.id}>
                      <Link href={`/profile/${person.username}`} className="flex items-center gap-3">
                        <Avatar name={person.full_name} src={person.profile_picture_url} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{person.full_name}</span>
                          <span className="block truncate text-sm text-ink-soft">
                            {person.current_job || person.department}
                            {person.batch ? ` · ${person.batch}` : ""}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
