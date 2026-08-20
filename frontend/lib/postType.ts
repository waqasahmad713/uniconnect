export const postTypeStyles: Record<
  string,
  { label: string; chip: string; chipActive: string; badge: string; bar: string }
> = {
  all: {
    label: "All",
    chip: "border-line bg-card text-ink-soft",
    chipActive: "border-ink bg-ink text-paper",
    badge: "bg-ink text-paper",
    bar: "#16211e",
  },
  question: {
    label: "Questions",
    chip: "border-[#7eb6d0] bg-[#e7f4fa] text-[#1d5f7a]",
    chipActive: "border-[#1d5f7a] bg-[#1d5f7a] text-white",
    badge: "bg-[#e7f4fa] text-[#1d5f7a]",
    bar: "#1d5f7a",
  },
  idea: {
    label: "Ideas",
    chip: "border-[#e0b45c] bg-[#fbf3de] text-[#8a5a12]",
    chipActive: "border-[#8a5a12] bg-[#c45c26] text-white",
    badge: "bg-[#fbf3de] text-[#8a5a12]",
    bar: "#c45c26",
  },
  discussion: {
    label: "Discussions",
    chip: "border-[#c4a3d4] bg-[#f4eaf8] text-[#6b3d7a]",
    chipActive: "border-[#6b3d7a] bg-[#6b3d7a] text-white",
    badge: "bg-[#f4eaf8] text-[#6b3d7a]",
    bar: "#6b3d7a",
  },
  resource: {
    label: "Resources",
    chip: "border-[#7aaa84] bg-[#e7f3ea] text-[#2a6b63]",
    chipActive: "border-[#2a6b63] bg-[#2a6b63] text-white",
    badge: "bg-[#e7f3ea] text-[#2a6b63]",
    bar: "#2a6b63",
  },
  job: {
    label: "Jobs",
    chip: "border-[#8aa0c7] bg-[#edf2fa] text-[#2f4d7a]",
    chipActive: "border-[#2f4d7a] bg-[#2f4d7a] text-white",
    badge: "bg-[#edf2fa] text-[#2f4d7a]",
    bar: "#2f4d7a",
  },
  internship: {
    label: "Internships",
    chip: "border-[#d4a07a] bg-[#f8eee6] text-[#8a4b22]",
    chipActive: "border-[#8a4b22] bg-[#8a4b22] text-white",
    badge: "bg-[#f8eee6] text-[#8a4b22]",
    bar: "#8a4b22",
  },
  collaboration: {
    label: "Collaboration",
    chip: "border-[#7aa8a8] bg-[#e7f4f4] text-[#2c5f5f]",
    chipActive: "border-[#2c5f5f] bg-[#2c5f5f] text-white",
    badge: "bg-[#e7f4f4] text-[#2c5f5f]",
    bar: "#2c5f5f",
  },
};

export function typeStyle(type: string) {
  return postTypeStyles[type] ?? postTypeStyles.all;
}
