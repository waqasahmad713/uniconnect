"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { apiFetch } from "@/lib/api";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/posts", label: "Feed posts" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/opportunities", label: "Opportunities" },
  { href: "/admin/events", label: "Events" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ is_admin: boolean }>("/api/auth/me")
      .then((me) => {
        if (cancelled) return;
        if (me.is_admin === true) {
          setAllowed(true);
          return;
        }
        router.replace("/");
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/login");
  }

  if (!allowed) {
    return <p className="p-6 text-ink-soft sm:p-8">Loading…</p>;
  }

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <div className="sticky top-0 z-30 flex items-center justify-between bg-ink px-4 py-3 text-paper lg:hidden">
        <BrandMark compact inverted href="/admin" />
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/20"
          aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          Menu
        </button>
      </div>

      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col bg-ink px-5 py-6 text-paper transition-transform duration-200 lg:static lg:flex lg:w-64 lg:max-w-none lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="hidden lg:block">
          <BrandMark compact inverted href="/admin" />
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55 lg:mt-4">
          Site control
        </p>
        <p className="font-display mt-1 text-2xl">Admin</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1 text-sm">
          {nav.map((item) => {
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-3 ${
                  active ? "bg-white/15 font-semibold" : "text-white/75 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 text-sm">
          <Link href="/community" className="block rounded-xl px-3 py-3 text-white/70 hover:text-white">
            View public site
          </Link>
          <button
            type="button"
            onClick={logout}
            className="block w-full rounded-xl px-3 py-3 text-left text-white/70 hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1 bg-paper">{children}</div>
    </div>
  );
}
