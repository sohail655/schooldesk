"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui";
import { signOut } from "@/app/login/actions";

export type ShellNav = { label: string; href: string; badge?: string };

/** Desktop sidebar + mobile bottom tabs, shared by every role. */
export function Shell({ nav, header, footer, children }: { nav: ShellNav[]; header?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  const path = usePathname();
  const active = (href: string) => (href === nav[0]?.href ? path === href : path.startsWith(href));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-[232px] shrink-0 flex-col gap-0.5 border-r border-line px-3 py-[18px] md:flex">
        <div className="px-2.5 pb-3.5">
          <Logo />
        </div>
        {header}
        <nav className="flex flex-col gap-0.5">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={clsx("flex justify-between rounded-md px-2.5 py-[7px]", active(n.href) ? "bg-surface-2 font-medium text-fg" : "text-muted hover:text-fg")}>
              <span>{n.label}</span>
              {n.badge && <span className="text-[11.5px]">{n.badge}</span>}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 px-2.5 pt-4">
          {footer}
          <form action={signOut}>
            <button className="text-[13px] text-muted hover:text-fg">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 pt-5 pb-24 md:px-7 md:pb-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 grid border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] md:hidden" style={{ gridTemplateColumns: `repeat(${Math.min(nav.length, 5)}, 1fr)` }}>
        {nav.slice(0, 5).map((n) => (
          <Link key={n.href} href={n.href} className={clsx("py-3 text-center text-[11px]", active(n.href) ? "font-semibold text-accent" : "text-muted")}>
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
