import { requirePlatformOwner } from "@/lib/auth";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requirePlatformOwner();
  const nav = [
    { label: "Overview", href: "/owner" },
    { label: "Schools", href: "/owner/schools" },
    { label: "Plans", href: "/owner/plans" },
    { label: "Subscriptions", href: "/owner/subscriptions" },
    { label: "Audit log", href: "/owner/audit" },
  ];
  return (
    <Shell
      nav={nav}
      header={<div className="mx-2.5 mb-4 self-start rounded-[5px] bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">PLATFORM OWNER</div>}
      footer={<div className="text-[13px] font-medium">{ctx.fullName}</div>}
    >
      {children}
    </Shell>
  );
}
