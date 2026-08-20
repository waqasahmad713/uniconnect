"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { ApiError, apiFetch } from "@/lib/api";
import { timeAgo } from "@/lib/time";
import { typeStyle } from "@/lib/postType";
import type { Post, UserPublic } from "@/types";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  author: UserPublic;
};

export function FeedCard({
  post,
  onChange,
  onDelete,
  sharePath = "/community",
}: {
  post: Post;
  onChange: (next: Post) => void;
  onDelete?: (postId: string) => void;
  sharePath?: string;
}) {
  const [openComments, setOpenComments] = useState(post.post_type === "question");
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!openComments) return;
    apiFetch<Comment[]>(`/api/posts/${post.id}/comments`)
      .then(setComments)
      .catch(() => setComments([]));
  }, [openComments, post.id]);

  async function requireAuth<T>(work: () => Promise<T>) {
    try {
      return await work();
    } catch (err) {
      setMessage(
        err instanceof ApiError && (err.status === 401 || err.status === 403)
          ? "Log in to like, comment, or save."
          : err instanceof ApiError
            ? err.message
            : "Something went wrong."
      );
      return null;
    }
  }

  async function toggleLike() {
    const result = await requireAuth(() =>
      apiFetch<{ liked: boolean; like_count: number }>(`/api/posts/${post.id}/like`, {
        method: "POST",
      })
    );
    if (!result) return;
    onChange({ ...post, liked: result.liked, like_count: result.like_count });
  }

  async function toggleSave() {
    const result = await requireAuth(() =>
      apiFetch<{ saved: boolean }>(`/api/posts/${post.id}/save`, { method: "POST" })
    );
    if (!result) return;
    onChange({ ...post, saved: result.saved });
  }

  async function share() {
    const url = `${window.location.origin}${sharePath}#${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMessage("Link copied.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      await navigator.clipboard.writeText(url);
      setMessage("Link copied.");
    }
  }

  async function removePost() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    const failed = (await requireAuth(() =>
      apiFetch(`/api/posts/${post.id}`, { method: "DELETE" })
    )) === null;
    if (failed) return;
    onDelete?.(post.id);
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    const result = await requireAuth(() =>
      apiFetch<Comment>(`/api/posts/${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify({
          content: draft,
          parent_id: replyTo?.id ?? null,
        }),
      })
    );
    if (!result) return;
    setComments((current) => [...current, result]);
    setDraft("");
    setReplyTo(null);
    onChange({ ...post, comment_count: post.comment_count + 1 });
  }

  const roots = comments.filter((comment) => !comment.parent_id);
  const repliesOf = (id: string) => comments.filter((comment) => comment.parent_id === id);

  return (
    <article id={post.id} className="feed-card card-hover overflow-hidden rounded-2xl border border-line border-l-4 bg-card p-4 shadow-[0_8px_24px_rgba(22,33,30,0.04)] sm:p-5" style={{ borderLeftColor: typeStyle(post.post_type).bar }}>
      <div className="flex gap-3">
        <Avatar name={post.author.full_name} src={post.author.profile_picture_url} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link href={`/profile/${post.author.username}`} className="font-semibold">
              {post.author.full_name}
            </Link>
            <span className="text-sm text-ink-soft">
              {post.author.current_job || post.author.department}
              {post.author.batch ? ` · Batch ${post.author.batch}` : ""}
            </span>
            <span className="text-sm text-ink-soft">{timeAgo(post.created_at)}</span>
          </div>
          <p
            className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${typeStyle(post.post_type).badge}`}
          >
            {typeStyle(post.post_type).label}
          </p>
        </div>
        {post.is_owner ? (
          <button
            type="button"
            onClick={removePost}
            className="self-start min-h-11 px-2 text-sm font-semibold text-accent-dark"
          >
            Delete
          </button>
        ) : null}
      </div>

      <h2 className="font-display mt-4 text-xl leading-tight break-words sm:text-2xl">{post.title}</h2>
      <p className="mt-3 whitespace-pre-wrap break-words leading-7">{post.content}</p>
      {post.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image_url}
          alt=""
          className="mt-4 max-h-96 w-full rounded-xl object-cover"
        />
      ) : null}
      {post.github_url || post.external_url ? (
        <p className="mt-3 text-sm">
          {post.github_url ? (
            <a className="text-teal" href={post.github_url}>
              GitHub
            </a>
          ) : null}
          {post.external_url ? (
            <a className="ml-3 text-teal" href={post.external_url}>
              Link
            </a>
          ) : null}
        </p>
      ) : null}
      {post.tags.length > 0 ? (
        <p className="mt-3 text-sm text-teal">{post.tags.map((tag) => `#${tag}`).join(" ")}</p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3 sm:flex sm:flex-wrap">
        <ActionButton active={post.liked} onClick={toggleLike}>
          {post.liked ? "Liked" : "Like"} · {post.like_count}
        </ActionButton>
        <ActionButton active={openComments} onClick={() => setOpenComments((value) => !value)}>
          Comment · {post.comment_count}
        </ActionButton>
        <ActionButton active={post.saved} onClick={toggleSave}>
          {post.saved ? "Saved" : "Save"}
        </ActionButton>
        <ActionButton onClick={share}>Share</ActionButton>
      </div>

      {message ? <p className="mt-3 text-sm text-accent-dark">{message}</p> : null}

      {openComments ? (
        <div className="mt-4 space-y-4 border-t border-line pt-4">
          {roots.map((comment) => (
            <div key={comment.id} className="space-y-3">
              <CommentRow comment={comment} onReply={() => setReplyTo(comment)} />
              {repliesOf(comment.id).map((reply) => (
                <div key={reply.id} className="ml-6 sm:ml-10">
                  <CommentRow comment={reply} onReply={() => setReplyTo(reply)} />
                </div>
              ))}
            </div>
          ))}

          <form onSubmit={submitComment} className="flex flex-col gap-2">
            {replyTo ? (
              <p className="text-xs text-ink-soft">
                Replying to {replyTo.author.full_name}{" "}
                <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                  cancel
                </button>
              </p>
            ) : null}
            <textarea
              className="min-h-20 w-full rounded-xl border border-line bg-paper px-4 py-3 text-base outline-none focus:border-teal"
              placeholder={replyTo ? "Write a reply…" : "Write a comment…"}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              required
            />
            <button className="min-h-11 w-full rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper sm:w-auto sm:self-end">
              Post comment
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

function CommentRow({ comment, onReply }: { comment: Comment; onReply: () => void }) {
  return (
    <div className="flex min-w-0 gap-3">
      <Avatar name={comment.author.full_name} src={comment.author.profile_picture_url} size="sm" />
      <div className="min-w-0 rounded-2xl bg-paper px-4 py-3">
        <p className="text-sm font-semibold break-words">
          {comment.author.full_name}{" "}
          <span className="font-normal text-ink-soft">{timeAgo(comment.created_at)}</span>
        </p>
        <p className="mt-1 break-words leading-6">{comment.content}</p>
        <button type="button" className="mt-1 min-h-10 text-xs font-semibold text-teal" onClick={onReply}>
          Reply
        </button>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  active = false,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-full px-3 py-2 text-sm font-semibold ${
        active ? "bg-[#f3ead6] text-accent-dark" : "bg-paper text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
