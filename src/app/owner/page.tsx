import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, PageHeader, Pill, StatRow } from "@/components/ui";
import { rs, shortDate, STATUS_TONE } from "@/lib/format";

export default async function OwnerOverview() {
  const supabase = await createClient();
  const [{ data: subs }, { count: users }, { data: paid }] = await Promise.all([
    supabase.from("subscriptions").select("status, cycle, current_period_end, school:schools(name, city), plan:plans(name, price_monthly, price_yearly)"),
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("subscription_invoices").select("amount, paid_at").eq("status", "paid"),
  ]);

  type Sub = { status: keyof typeof STATUS_TONE; cycle: string; current_period_end: string; school: { name: string; city: string | null }; plan: { name: string; price_monthly: number; price_yearly: number } };
  const list = (subs ?? []) as unknown as Sub[];
  const count = (s: string) => list.filter((x) => x.status === s).length;
  const mrr = list
    .filter((s) => s.status === "active" || s.status === "grace")
    .reduce((sum, s) => sum + (s.cycle === "yearly" ? Math.round(s.plan.price_yearly / 12) : s.plan.price_monthly), 0);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const revenueThisMonth = (paid ?? []).filter((p) => p.paid_at && new Date(p.paid_at) >= monthStart).reduce((s, p) => s + p.amount, 0);
  const soon = list
    .filter((s) => new Date(s.current_period_end).getTime() - Date.now() < 14 * 864e5)
    .sort((a, b) => a.current_period_end.localeCompare(b.current_period_end));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Platform overview" actions={<Link href="/owner/schools/new" className="inline-flex h-9 items-center rounded-lg bg-accent px-3.5 font-medium text-white">+ New school</Link>} />
      <StatRow
        items={[
          { label: "Total schools", value: list.length },
          { label: "Active", value: count("active"), tone: "ok" },
          { label: "On trial", value: count("trial") },
          { label: "Expired / grace", value: count("grace") + count("suspended"), tone: "bad" },
          { label: "Total users", value: (users ?? 0).toLocaleString() },
          { label: "MRR", value: rs(mrr), sub: `${rs(revenueThisMonth)} collected this month` },
        ]}
      />
      <Card title="Renewals and expiries · next 14 days">
        {soon.length === 0 ? (
          <EmptyState title="Nothing due soon" body="Subscriptions that renew or expire in the next 14 days will show here." />
        ) : (
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left text-[12.5px] text-muted">
                <th className="px-4 py-2.5 font-medium">School</th>
                <th className="px-4 py-2.5 font-medium">Plan</th>
                <th className="px-4 py-2.5 font-medium">Ends</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {soon.map((s, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="px-4 py-2.5 font-medium">{s.school.name}<span className="ml-2 text-muted">{s.school.city}</span></td>
                  <td className="px-4 py-2.5">{s.plan.name} · {s.cycle}</td>
                  <td className="num px-4 py-2.5">{shortDate(s.current_period_end)}</td>
                  <td className="px-4 py-2.5"><Pill tone={STATUS_TONE[s.status]}>{s.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
