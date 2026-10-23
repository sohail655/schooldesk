import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SchoolRole } from "@/lib/roles";

export type Membership = {
  id: string;
  role: SchoolRole;
  full_name: string;
  school: { id: string; name: string; slug: string; city: string | null; status: string };
};

export type SessionContext = {
  userId: string;
  email: string | null;
  fullName: string;
  isPlatformOwner: boolean;
  memberships: Membership[];
};

/** Loads the signed-in user, their profile and active school memberships. Redirects to /login if signed out. */
export async function requireSession(): Promise<SessionContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("full_name, is_platform_owner").eq("id", user.id).maybeSingle(),
    supabase
      .from("memberships")
      .select("id, role, full_name, school:schools(id, name, slug, city, status)")
      .eq("user_id", user.id)
      .eq("is_active", true),
  ]);

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name || user.email || "User",
    isPlatformOwner: Boolean(profile?.is_platform_owner),
    memberships: ((rows ?? []) as unknown as Membership[]).filter((m) => m.school),
  };
}

export async function requirePlatformOwner() {
  const ctx = await requireSession();
  if (!ctx.isPlatformOwner) redirect("/");
  return ctx;
}

/** Ensures the user belongs to the school identified by slug, optionally with one of the given roles. */
export async function requireSchool(slug: string, roles?: SchoolRole[]) {
  const ctx = await requireSession();
  const forSchool = ctx.memberships.filter((m) => m.school.slug === slug);
  const allowed = roles ? forSchool.filter((m) => roles.includes(m.role)) : forSchool;
  if (allowed.length === 0) redirect("/");
  return { ctx, membership: allowed[0], school: allowed[0].school };
}
