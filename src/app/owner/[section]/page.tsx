import { notFound } from "next/navigation";
import { Card, EmptyState, PageHeader } from "@/components/ui";

const TITLES: Record<string, string> = { plans: "Plans", subscriptions: "Subscriptions", audit: "Audit log" };

// Placeholder pages for owner sections that are built in later milestones.
export default async function OwnerSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const title = TITLES[section];
  if (!title) notFound();
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={title} />
      <Card>
        <EmptyState title="Coming in the next milestone" body="The database and security rules for this section are ready; the screen follows the approved design." />
      </Card>
    </div>
  );
}
