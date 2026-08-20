"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { inputClassName } from "@/components/AuthForm";

type AdminPost = {
  id: string;
  title: string;
  content: string;
  post_type: string;
  tags: string[];
  is_featured: boolean;
  is_removed: boolean;
  created_at: string;
  author_name: string;
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("idea");
  const [tags, setTags] = useState("");

  async function load() {
    setPosts(await apiFetch<AdminPost[]>("/api/admin/posts"));
  }

  useEffect(() => {
    load().catch(() => setError("Could not load posts."));
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          title,
          content,
          post_type: postType,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });
      setTitle("");
      setContent("");
      setTags("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not publish.");
    }
  }

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
      <h1 className="font-display text-3xl sm:text-4xl">Feed posts</h1>
      <p className="mt-2 text-ink-soft">
        Publish ideas, discussions, and resources to the public feed. Members cannot post here.
      </p>

      <form onSubmit={onCreate} className="mt-8 max-w-2xl space-y-3 rounded-2xl border border-line bg-card p-5">
        <input
          className={inputClassName}
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <textarea
          className={`${inputClassName} min-h-28`}
          placeholder="Write the post. No videos."
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className={inputClassName}
            value={postType}
            onChange={(event) => setPostType(event.target.value)}
          >
            <option value="idea">Idea</option>
            <option value="discussion">Discussion</option>
            <option value="resource">Resource</option>
            <option value="job">Job</option>
            <option value="internship">Internship</option>
            <option value="collaboration">Collaboration</option>
          </select>
          <input
            className={inputClassName}
            placeholder="Tags, comma separated"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-accent-dark">{error}</p> : null}
        <button className="min-h-12 w-full rounded-full bg-accent px-5 py-2 font-semibold text-white sm:w-auto">Publish to feed</button>
      </form>

      <div className="mt-8 space-y-3">
        {posts.map((post) => (
          <article key={post.id} className="rounded-2xl border border-line bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-teal">{post.post_type}</p>
                <h2 className="font-display mt-1 text-2xl">{post.title}</h2>
                <p className="text-sm text-ink-soft">
                  {post.author_name} · {new Date(post.created_at).toLocaleString()}
                  {post.is_featured ? " · Featured" : ""}
                  {post.is_removed ? " · Removed" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <button type="button" className="text-teal" onClick={() => act(`/api/admin/posts/${post.id}/feature`)}>
                  {post.is_featured ? "Unfeature" : "Feature"}
                </button>
                {post.is_removed ? (
                  <button type="button" className="text-teal" onClick={() => act(`/api/admin/posts/${post.id}/restore`)}>
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-accent-dark"
                    onClick={() => act(`/api/admin/posts/${post.id}/remove`)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="mt-3 line-clamp-3 leading-7 text-ink-soft">{post.content}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
