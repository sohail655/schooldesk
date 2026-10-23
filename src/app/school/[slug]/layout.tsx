import { requireSchool } from "@/lib/auth";
import { navFor, ROLE_LABEL } from "@/lib/roles";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function SchoolLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { ctx, membership, school } = await requireSchool(slug);
  const blocked = school.status === "suspended" || school.status === "cancelled";

  return (
    <Shell
      nav={navFor(membership.role, `/school/${slug}`)}
      header={
        <div className="mx-1.5 mb-3 rounded-lg border border-line px-2.5 py-2">
          <div className="text-[13px] font-semibold">{school.name}</div>
          <div className="text-xs text-muted">{school.city ?? ""}</div>
        </div>
      }
      footer={
        <div className="text-[13px]">
          <div className="font-medium">{membership.full_name || ctx.fullName}</div>
          <div className="text-xs text-muted">{ROLE_LABEL[membership.role]}</div>
        </div>
      }
    >
      {blocked && (
        <div role="alert" className="mb-4 rounded-lg bg-bad-soft px-4 py-2.5 text-[13.5px] text-bad">
          This school&apos;s subscription is {school.status}. You can view data, but changes are disabled until the plan is renewed.
        </div>
      )}
      {school.status === "trial" && (
        <div className="mb-4 rounded-lg bg-accent-soft px-4 py-2.5 text-[13.5px] text-accent">You are on a free trial.</div>
      )}
      {children}
    </Shell>
  );
}
