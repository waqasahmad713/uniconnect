"use client";

import { useEffect, useState } from "react";
import { mediaUrl } from "@/lib/media";
import { initials } from "@/lib/time";

export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const imageSrc = mediaUrl(src);
  const classes =
    size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-24 w-24 text-2xl" : "h-11 w-11 text-sm";

  useEffect(() => {
    setFailed(false);
  }, [imageSrc]);

  if (imageSrc && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt={name}
        className={`inline-block shrink-0 rounded-full object-cover ${classes}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-paper ${classes}`}
    >
      {initials(name) || "U"}
    </span>
  );
}
