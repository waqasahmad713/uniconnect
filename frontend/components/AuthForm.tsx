"use client";

import { FormEvent, InputHTMLAttributes, ReactNode, useRef, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEnterMotion } from "@/lib/motion";
import { gsap, useGSAP } from "@/lib/gsap";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEnterMotion(root);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(".auth-orb", {
          y: 16,
          duration: 4.2,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          stagger: 0.5,
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="grid min-h-full lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[#16211e] px-10 py-10 text-[#fffaf3] lg:flex lg:flex-col">
        <span className="auth-orb absolute -left-10 top-16 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
        <span className="auth-orb absolute bottom-10 right-0 h-56 w-56 rounded-full bg-teal/30 blur-3xl" />
        <BrandMark inverted />
        <div className="relative mt-auto max-w-md pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e7c9a8]">
            Abdul Wali Khan University Mardan
          </p>
          <h2 className="font-display mt-4 text-4xl leading-tight">
            Ask. Share. Stay with the CS community.
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/70">
            A text-first space for students, alumni, and faculty — questions, the feed, and internships in one place.
          </p>
        </div>
      </aside>
      <div className="flex min-h-full flex-col bg-paper">
        <header className="flex items-center justify-between border-b border-line bg-card/80 px-4 py-3 sm:px-6 lg:hidden">
          <BrandMark compact />
          <ThemeToggle compact />
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
          <div className="mb-6 hidden justify-end lg:flex">
            <ThemeToggle compact />
          </div>
          <p data-enter className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
            Abdul Wali Khan University Mardan
          </p>
          <h1 data-enter className="font-display mt-3 text-3xl sm:text-4xl">
            {title}
          </h1>
          <p data-enter className="mt-3 text-ink-soft">
            {subtitle}
          </p>
          <div data-enter className="mt-8 rounded-3xl border border-line bg-card p-5 shadow-[0_16px_40px_rgba(22,33,30,0.06)] sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

export const inputClassName =
  "w-full min-h-11 rounded-xl border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20";

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${inputClassName} pr-16`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-1 top-1/2 inline-flex min-h-11 min-w-12 -translate-y-1/2 items-center justify-center text-sm font-semibold text-teal"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function SubmitButton({
  children,
  pending,
}: {
  children: ReactNode;
  pending?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full min-h-12 rounded-full bg-accent px-4 py-3 font-semibold text-white shadow-[0_10px_24px_rgba(196,92,38,0.28)] disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function onFormData(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  return new FormData(event.currentTarget);
}
