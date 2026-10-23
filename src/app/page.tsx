import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { homePath } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function Home() {
  const ctx = await requireSession();
  redirect(homePath(ctx));
}
