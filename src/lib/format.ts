export const rs = (n: number) => `Rs ${n.toLocaleString("en-PK")}`;

export const shortDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" });

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export const STATUS_TONE = { active: "ok", trial: "info", grace: "warn", suspended: "bad", cancelled: "grey" } as const;
