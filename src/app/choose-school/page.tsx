import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function ChooseSchool() {
  const ctx = await requireSession();
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-semibold">Choose a school</h1>
        <div className="mt-4 flex flex-col gap-2">
          {ctx.memberships.map((m) => (
            <Link key={m.id} href={`/school/${m.school.slug}`} className="flex justify-between rounded-[10px] border border-line px-4 py-3 hover:bg-surface-2">
              <span className="font-medium">{m.school.name}</span>
              <span className="text-[13px] text-muted">{ROLE_LABEL[m.role]}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
