import clsx from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({ variant = "secondary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <button
      className={clsx(
        "inline-flex h-9 items-center justify-center rounded-lg px-3.5 font-medium transition-colors disabled:opacity-50",
        variant === "primary" && "bg-accent text-white hover:opacity-90",
        variant === "secondary" && "border border-line bg-bg hover:bg-surface-2",
        variant === "danger" && "border border-line bg-bg text-bad hover:bg-bad-soft",
        className,
      )}
      {...props}
    />
  );
}

export function Field({ label, error, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = props.id ?? props.name;
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-[13px] font-medium">
      {label}
      <input id={id} className={clsx("h-10 rounded-lg border bg-bg px-3 text-sm font-normal outline-none focus:border-accent", error ? "border-bad" : "border-line")} {...props} />
      {error ? <span className="text-xs font-normal text-bad">{error}</span> : hint ? <span className="text-xs font-normal text-muted">{hint}</span> : null}
    </label>
  );
}

const PILL = {
  ok: "bg-ok-soft text-ok",
  bad: "bg-bad-soft text-bad",
  warn: "bg-warn-soft text-warn",
  info: "bg-accent-soft text-accent",
  grey: "bg-surface-2 text-muted",
};
export type Tone = keyof typeof PILL;

export function Pill({ tone = "grey", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={clsx("whitespace-nowrap rounded-[5px] px-2 py-0.5 text-xs", PILL[tone])}>{children}</span>;
}

export function Card({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-[10px] border border-line", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatRow({ items }: { items: { label: string; value: ReactNode; sub?: ReactNode; tone?: "ok" | "bad" | "warn" }[] }) {
  return (
    <div className="grid rounded-[10px] border border-line" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((s, i) => (
        <div key={s.label} className={clsx("px-5 py-4", i < items.length - 1 && "border-r border-line")}>
          <div className="text-[13px] text-muted">{s.label}</div>
          <div className={clsx("num mt-1 text-2xl tracking-tight", s.tone === "ok" && "text-ok", s.tone === "bad" && "text-bad", s.tone === "warn" && "text-warn")}>{s.value}</div>
          {s.sub && <div className="mt-0.5 text-xs text-muted">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {sub && <div className="mt-0.5 text-[13px] text-muted">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="font-medium">{title}</div>
      <p className="max-w-sm text-[13px] text-muted">{body}</p>
      {action}
    </div>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2 text-[15px] font-bold">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-fg text-xs text-bg">S</span>
      SchoolDesk
    </div>
  );
}
