"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { FeedCard } from "@/components/FeedCard";
import { apiFetch, ApiError } from "@/lib/api";
import type { Post } from "@/types";
import { inputClassName } from "@/components/AuthForm";
import { postTypeStyles, typeStyle } from "@/lib/postType";
import { gsap, useGSAP } from "@/lib/gsap";

type StreamProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  query: string;
  defaultType: string;
  typeOptions: string[];
  filters?: string[];
  titlePlaceholder: string;
  bodyPlaceholder: string;
  submitLabel: string;
  emptyText: string;
  sharePath: string;
  aside: ReactNode;
  allowCompose?: boolean;
};

export function PostStream({
  eyebrow,
  title,
  subtitle,
  query,
  defaultType,
  typeOptions,
  filters,
  titlePlaceholder,
  bodyPlaceholder,
  submitLabel,
  emptyText,
  sharePath,
  aside,
  allowCompose = false,
}: StreamProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState(filters?.[0] ?? "all");
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState(defaultType);
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".stream-head > *", {
          y: 20,
          autoAlpha: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: "power3.out",
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".feed-card", {
          y: 18,
          autoAlpha: 0,
          duration: 0.5,
          stagger: 0.07,
          ease: "power2.out",
        });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [posts], revertOnUpdate: true },
  );

  async function load() {
    const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
    if (filters && filter !== "all") {
      params.set("post_type", filter);
      params.delete("exclude_type");
    }
    const data = await apiFetch<Post[]>(`/api/posts?${params.toString()}`);
    setPosts(data);
  }

  useEffect(() => {
    load().catch(() => setError("Could not load posts."));
  }, [filter, query]);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then(() => setSignedIn(true))
      .catch(() => setSignedIn(false));
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await apiFetch<Post>("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          title: postTitle,
          content,
          post_type: postType,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          image_url: imageUrl || null,
        }),
      });
      setPostTitle("");
      setContent("");
      setTags("");
      setImageUrl("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in to publish.");
    }
  }

  return (
    <div ref={root} className="min-h-full">
      <Header />
      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
        <aside className="order-1 space-y-4 lg:hidden">{aside}</aside>
        <section className="order-2 min-w-0 space-y-5 lg:order-1">
          <div className="stream-head">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">{eyebrow}</p>
            <h1 className="font-display mt-2 text-3xl sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-ink-soft">{subtitle}</p>
          </div>

          {error ? <p className="text-sm text-accent-dark">{error}</p> : null}

          {!allowCompose && signedIn ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-teal/25 bg-muted p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-xl text-ink">You&apos;re in the room.</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Like, comment, and save posts. Questions belong in Q&amp;A so the feed stays readable.
                </p>
              </div>
              <Link
                href="/questions"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-teal px-4 font-semibold text-white"
              >
                Ask a question
              </Link>
            </div>
          ) : null}

          {allowCompose && signedIn ? (
          <form onSubmit={onCreate} className="rounded-2xl border border-line bg-card p-5 space-y-3">
            <input
              className={inputClassName}
              placeholder={titlePlaceholder}
              value={postTitle}
              onChange={(event) => setPostTitle(event.target.value)}
              required
            />
            <textarea
              className={`${inputClassName} min-h-28`}
              placeholder={bodyPlaceholder}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {typeOptions.length > 1 ? (
                <select
                  className={inputClassName}
                  value={postType}
                  onChange={(event) => setPostType(event.target.value)}
                >
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {postTypeStyles[type]?.label ?? type}
                    </option>
                  ))}
                </select>
              ) : null}
              <input
                className={inputClassName}
                placeholder="Tags, e.g. AI, internships"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
            </div>
            <input
              className={inputClassName}
              placeholder="Optional image URL (not video)"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
            />
            {error && allowCompose && signedIn ? <p className="text-sm text-accent-dark">{error}</p> : null}
            <button className="min-h-12 w-full rounded-full bg-accent px-5 py-2 font-semibold text-white sm:w-auto">
              {submitLabel}
            </button>
          </form>
          ) : allowCompose ? (
            <p className="rounded-2xl border border-dashed border-line bg-card p-5 text-sm text-ink-soft">
              <a href="/login" className="font-semibold text-teal">
                Log in
              </a>{" "}
              to post a question.
            </p>
          ) : null}

          {filters ? (
            <div className="flex flex-wrap gap-2">
              {filters.map((id) => {
                const style = typeStyle(id);
                const active = filter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilter(id)}
                    className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold ${
                      active ? style.chipActive : style.chip
                    }`}
                  >
                    {postTypeStyles[id].label}
                  </button>
                );
              })}
            </div>
          ) : null}

          {posts.map((post) => (
            <FeedCard
              key={post.id}
              post={post}
              sharePath={sharePath}
              onChange={(next) =>
                setPosts((current) => current.map((item) => (item.id === next.id ? next : item)))
              }
              onDelete={(postId) =>
                setPosts((current) => current.filter((item) => item.id !== postId))
              }
            />
          ))}
          {posts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">
              {emptyText}
            </p>
          ) : null}
        </section>
        <aside className="order-3 hidden space-y-4 lg:order-2 lg:block">{aside}</aside>
      </main>
    </div>
  );
}
