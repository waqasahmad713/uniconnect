"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type AdminUser = {
  id: string;
  email: string;
  username: string;
  full_name: string;
  university: string;
  department: string;
  role: string;
  email_verified: boolean;
  is_admin: boolean;
  is_suspended: boolean;
  affiliation_verified: boolean;
  created_at: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const data = await apiFetch<AdminUser[]>("/api/admin/users");
    setUsers(data);
  }

  useEffect(() => {
    load().catch(() => setError("Could not load users."));
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
      <h1 className="font-display text-3xl sm:text-4xl">Users</h1>
      <p className="mt-2 text-ink-soft">Suspend accounts, restore them, or verify affiliation.</p>
      {error ? <p className="mt-4 text-sm text-accent-dark">{error}</p> : null}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Campus</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-line last:border-0">
                <td className="px-4 py-4">
                  <p className="font-semibold">{user.full_name}</p>
                  <p className="text-ink-soft">{user.email}</p>
                  <p className="text-xs text-ink-soft">@{user.username}</p>
                </td>
                <td className="px-4 py-4 text-ink-soft">
                  {user.department}
                  <br />
                  {user.role}
                </td>
                <td className="px-4 py-4">
                  {user.is_admin ? <p className="font-semibold text-teal">Admin</p> : null}
                  {user.is_suspended ? <p className="text-accent-dark">Suspended</p> : <p>Active</p>}
                  <p className="text-xs text-ink-soft">
                    {user.email_verified ? "Email verified" : "Unverified"}
                    {user.affiliation_verified ? " · Affiliation verified" : ""}
                  </p>
                </td>
                <td className="px-4 py-4 space-y-2">
                  {user.is_suspended ? (
                    <button
                      type="button"
                      className="block text-teal"
                      onClick={() => act(`/api/admin/users/${user.id}/unsuspend`)}
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="block text-accent-dark"
                      onClick={() => act(`/api/admin/users/${user.id}/suspend`)}
                    >
                      Suspend
                    </button>
                  )}
                  {!user.affiliation_verified ? (
                    <button
                      type="button"
                      className="block text-teal"
                      onClick={() => act(`/api/admin/users/${user.id}/verify-affiliation`)}
                    >
                      Verify affiliation
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
