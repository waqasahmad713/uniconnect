"use client";

import { useEffect, useState } from "react";
import { applyTheme, readTheme, type Theme } from "@/lib/theme";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  if (compact) {
    const next = theme === "dark" ? "light" : "dark";
    return (
      <button
        type="button"
        onClick={() => choose(next)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-paper text-ink-soft hover:text-ink"
        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        title={theme === "dark" ? "Light theme" : "Dark theme"}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <ThemeChoice
        label="Light"
        description="Warm paper, dark text"
        selected={theme === "light"}
        onClick={() => choose("light")}
      />
      <ThemeChoice
        label="Dark"
        description="Ink background, light text"
        selected={theme === "dark"}
        onClick={() => choose("dark")}
      />
    </div>
  );
}

function ThemeChoice({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-2xl border px-4 py-4 text-left transition ${
        selected ? "border-teal bg-muted font-semibold" : "border-line bg-paper hover:border-teal/60"
      }`}
    >
      <span className="block">{label}</span>
      <span className="mt-1 block text-sm font-normal text-ink-soft">{description}</span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16.5 13.5A7 7 0 0 1 10.5 4a7 7 0 1 0 8 10.5 5.5 5.5 0 0 1-2-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
