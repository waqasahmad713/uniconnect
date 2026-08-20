"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Avatar } from "@/components/Avatar";
import { apiFetch } from "@/lib/api";
import type { UserPublic } from "@/types";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const [user, setUser] = useState<UserPublic | null>(null);

  useEffect(() => {
    apiFetch<UserPublic>(`/api/users/${params.username}`)
      .then(setUser)
      .catch(() => setUser(null));
  }, [params.username]);

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {user ? (
          <>
            <div className="flex items-center gap-4">
              <Avatar name={user.full_name} src={user.profile_picture_url} size="lg" />
              <div>
                <h1 className="font-display text-4xl">{user.full_name}</h1>
                <p className="mt-2 text-lg text-ink-soft">
                  {user.current_job || user.role} · {user.department}
                  {user.batch ? ` · Batch ${user.batch}` : ""}
                </p>
              </div>
            </div>
            {user.affiliation_verified ? (
              <p className="mt-2 text-sm text-teal">University affiliation verified</p>
            ) : null}
            <p className="mt-6 leading-7">{user.bio}</p>
            <p className="mt-6 text-sm text-teal">{user.skills.join(" · ")}</p>
            <div className="mt-6 space-y-1 text-sm">
              {user.github_url ? <p>GitHub: {user.github_url}</p> : null}
              {user.linkedin_url ? <p>LinkedIn: {user.linkedin_url}</p> : null}
              {user.portfolio_url ? <p>Portfolio: {user.portfolio_url}</p> : null}
            </div>
          </>
        ) : (
          <p>Profile not found.</p>
        )}
      </main>
    </div>
  );
}
