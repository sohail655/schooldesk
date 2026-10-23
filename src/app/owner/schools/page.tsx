import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader, Pill } from "@/components/ui";
import { shortDate, STATUS_TONE } from "@/lib/format";

export default async function OwnerSchools({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("schools")
    .select("id, name, slug, city, status, created_at, subscription:subscriptions(cycle, current_period_end, plan:plans(name))")
    .order("created_at", { ascending: false });
  if (q) query = query.or(`name.ilike.%${q.replace(/[%,()]/g, "")}%,city.ilike.%${q.replace(/[%,()]/g, "")}%`);
  const { data } = await query;

  type Row = { id: string; name: string; slug: string; city: string | null; status: keyof typeof STATUS_TONE; created_at: string; subscription: { cycle: string; current_period_end: string; plan: { name: string } } | null };
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Schools" sub={`${rows.length} schools`} actions={<Link href="/owner/schools/new" className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 font-medium text-white">+ New school</Link>} />
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search by school or city" aria-label="Search schools" className="h-9 w-72 rounded-lg border border-line bg-bg px-3" />
      </form>
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No schools yet" body="Create the first school and send its admin an activation link." action={<Link href="/owner/schools/new" className="text-accent">Create a school</Link>} />
        ) : (
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left text-[12.5px] text-muted">
                <th className="px-4 py-2.5 font-medium">School</th>
                <th className="px-4 py-2.5 font-medium">Plan</th>
                <th className="px-4 py-2.5 font-medium">Renews</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-2.5"><div className="font-medium">{r.name}</div><div className="text-xs text-muted">{r.city}</div></td>
                  <td className="px-4 py-2.5">{r.subscription ? `${r.subscription.plan.name} · ${r.subscription.cycle}` : "—"}</td>
                  <td className="num px-4 py-2.5">{r.subscription ? shortDate(r.subscription.current_period_end) : "—"}</td>
                  <td className="num px-4 py-2.5 text-muted">{shortDate(r.created_at)}</td>
                  <td className="px-4 py-2.5"><Pill tone={STATUS_TONE[r.status]}>{r.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
