import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { NewSchoolForm } from "./new-school-form";

export default async function NewSchoolPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase.from("plans").select("id, name, price_monthly, price_yearly").eq("is_active", true).order("price_monthly");
  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <PageHeader title="New school" sub="Creates the school on a free trial and an activation link for its admin." />
      <NewSchoolForm plans={plans ?? []} />
    </div>
  );
}
