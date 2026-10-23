import { notFound } from "next/navigation";
import { requireSchool } from "@/lib/auth";
import { navFor } from "@/lib/roles";
import { Card, EmptyState, PageHeader } from "@/components/ui";

// Placeholder for sections delivered in later milestones. Only sections in the user's own menu resolve.
export default async function SchoolSection({ params }: { params: Promise<{ slug: string; section: string }> }) {
  const { slug, section } = await params;
  const { membership } = await requireSchool(slug);
  const item = navFor(membership.role, `/school/${slug}`).find((n) => n.href.endsWith(`/${section}`));
  if (!item) notFound();
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={item.label} />
      <Card>
        <EmptyState title="Coming in the next milestone" body="This screen follows the approved design and is built in the module roadmap." />
      </Card>
    </div>
  );
}
