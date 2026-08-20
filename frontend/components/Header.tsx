"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import { BrandMark } from "@/components/BrandMark";
import { gsap, useGSAP } from "@/lib/gsap";
import type { UserMe } from "@/types";

const links = [
  { href: "/community", label: "Feed" },
  { href: "/questions", label: "Questions" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/events", label: "Events" },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<UserMe | null>(null);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    apiFetch<UserMe>("/api/auth/me")
      .then((user) => {
        setMe(user);
        apiFetch<{ is_read: boolean }[]>("/api/notifications")
          .then((notes) => setUnread(notes.filter((note) => !note.is_read).length))
          .catch(() => setUnread(0));
      })
      .catch(() => {
        setMe(null);
        setUnread(0);
      });
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(headerRef.current, { y: -16, autoAlpha: 0, duration: 0.55, ease: "power2.out" });
      });
      return () => mm.revert();
    },
    { scope: headerRef },
  );

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setMe(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  function navClass(href: string) {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return `rounded-full px-3 py-2 transition ${
      active ? "bg-paper font-semibold text-ink" : "text-ink-soft hover:text-ink"
    }`;
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 border-b border-line/80 bg-card/90 backdrop-blur-xl"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <BrandMark compact />
        <nav className="hidden items-center gap-1 text-sm lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={navClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 text-sm lg:flex">
          {me ? (
            <>
              {me.is_admin === true ? (
                <Link href="/admin" className="rounded-full px-3 py-2 font-semibold text-teal">
                  Admin
                </Link>
              ) : null}
              <Link
                href="/notifications"
                className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-paper text-ink-soft hover:text-ink"
                aria-label={unread ? `${unread} unread notifications` : "Notifications"}
              >
                <BellIcon />
                {unread > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-card" />
                ) : null}
              </Link>
              <Link
                href={`/profile/${me.username}`}
                className="flex items-center gap-2 rounded-full border border-line bg-paper py-1 pl-1 pr-3 hover:border-teal"
              >
                <Avatar name={me.full_name} src={me.profile_picture_url} size="sm" />
                <span className="max-w-[8rem] truncate font-semibold">{me.full_name.split(" ")[0]}</span>
              </Link>
              <Link href="/settings" className="rounded-full px-3 py-2 text-ink-soft hover:text-ink">
                Settings
              </Link>
              <button type="button" onClick={logout} className="rounded-full px-3 py-2 text-ink-soft hover:text-ink">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-2 text-ink-soft hover:text-ink">
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 font-semibold text-white shadow-[0_8px_20px_rgba(196,92,38,0.28)]"
              >
                Join
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line text-ink lg:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          <span className="flex flex-col gap-1.5">
            <span className={`block h-0.5 w-5 bg-ink transition ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-ink transition ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-ink transition ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </span>
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-line bg-card px-4 py-4 lg:hidden">
          {me ? (
            <Link href={`/profile/${me.username}`} className="mb-3 flex items-center gap-3 rounded-2xl bg-paper p-3">
              <Avatar name={me.full_name} src={me.profile_picture_url} />
              <span>
                <span className="block font-semibold">{me.full_name}</span>
                <span className="text-sm text-ink-soft">View profile</span>
              </span>
            </Link>
          ) : null}
          <nav className="flex flex-col gap-1 text-base">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-3 py-3 font-medium ${
                  pathname === link.href ? "bg-paper" : "hover:bg-paper"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {me ? (
              <>
                <Link href="/notifications" className="rounded-xl px-3 py-3 hover:bg-paper">
                  Notifications{unread ? ` · ${unread}` : ""}
                </Link>
                <Link href="/discover" className="rounded-xl px-3 py-3 hover:bg-paper">
                  Discover people
                </Link>
                {me.is_admin === true ? (
                  <Link href="/admin" className="rounded-xl px-3 py-3 font-semibold text-teal">
                    Admin
                  </Link>
                ) : null}
                <Link href="/settings" className="rounded-xl px-3 py-3 hover:bg-paper">
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl px-3 py-3 text-left hover:bg-paper"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-xl px-3 py-3 hover:bg-paper">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="mt-2 inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-4 font-semibold text-white"
                >
                  Join the community
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9a6 6 0 1 1 12 0c0 3.2.8 4.8 1.5 6H4.5C5.2 13.8 6 12.2 6 9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
