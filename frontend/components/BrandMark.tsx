import Link from "next/link";

export function BrandMark({
  compact = false,
  href = "/",
  inverted = false,
}: {
  compact?: boolean;
  href?: string;
  inverted?: boolean;
}) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-2 sm:gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tracking-wide sm:h-10 sm:w-10 ${
          inverted ? "bg-paper text-ink" : "bg-ink text-paper"
        }`}
      >
        CS
      </span>
      <span className="min-w-0 leading-tight">
        <span
          className={`font-display block truncate text-lg tracking-tight sm:text-xl ${
            inverted ? "text-paper" : "text-ink"
          }`}
        >
          AWKUM CS
        </span>
        {compact ? null : (
          <span
            className={`block text-[10px] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.16em] ${
              inverted ? "text-white/60" : "text-ink-soft"
            }`}
          >
            Computer Science Community
          </span>
        )}
      </span>
    </Link>
  );
}
