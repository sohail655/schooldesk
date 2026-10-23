"use server";

import { z } from "zod";
import { requirePlatformOwner } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { createInviteToken, inviteExpiry } from "@/lib/invite";
import { publicEnv } from "@/lib/env";
import { slugify } from "@/lib/format";

const schema = z.object({
  name: z.string().trim().min(3, "Enter the school name"),
  city: z.string().trim().min(2, "Enter the city"),
  phone: z.string().trim().optional(),
  planId: z.string().uuid("Choose a plan"),
  cycle: z.enum(["monthly", "yearly"]),
  adminName: z.string().trim().min(2, "Enter the admin's name"),
  adminEmail: z.string().trim().email("Enter a valid email"),
  adminPhone: z.string().trim().optional(),
});

export type NewSchoolState = { error?: string; fieldErrors?: Record<string, string | undefined>; activationLink?: string; schoolName?: string };

export async function createSchool(_: NewSchoolState, formData: FormData): Promise<NewSchoolState> {
  // Authorization is checked on the server before using the service-role client.
  const ctx = await requirePlatformOwner();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return { fieldErrors: Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v?.[0]])) };
  }
  const d = parsed.data;
  const admin = createAdminClient();

  const { data: plan } = await admin.from("plans").select("id, trial_days").eq("id", d.planId).single();
  if (!plan) return { error: "That plan no longer exists." };

  let slug = slugify(`${d.name}-${d.city}`);
  const { count } = await admin.from("schools").select("id", { count: "exact", head: true }).like("slug", `${slug}%`);
  if (count) slug = `${slug}-${count + 1}`;

  const { data: school, error: schoolErr } = await admin
    .from("schools")
    .insert({ name: d.name, city: d.city, phone: d.phone || null, slug, status: "trial" })
    .select("id")
    .single();
  if (schoolErr || !school) return { error: schoolErr?.message ?? "Could not create the school." };

  const trialEnds = new Date(Date.now() + plan.trial_days * 864e5).toISOString();
  await admin.from("subscriptions").insert({ school_id: school.id, plan_id: plan.id, cycle: d.cycle, status: "trial", trial_ends_at: trialEnds, current_period_end: trialEnds });

  const year = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  await admin.from("academic_years").insert({ school_id: school.id, name: `${year}-${String(year + 1).slice(2)}`, starts_on: `${year}-04-01`, ends_on: `${year + 1}-03-31`, is_current: true });

  const { data: membership, error: mErr } = await admin
    .from("memberships")
    .insert({ school_id: school.id, role: "school_admin", full_name: d.adminName, email: d.adminEmail, phone: d.adminPhone || null, invited_at: new Date().toISOString() })
    .select("id")
    .single();
  if (mErr || !membership) return { error: mErr?.message ?? "Could not add the admin." };

  const { token, hash } = createInviteToken();
  await admin.from("invitations").insert({ membership_id: membership.id, school_id: school.id, token_hash: hash, expires_at: inviteExpiry().toISOString(), created_by: ctx.userId });

  // The link is shown once to the owner to send by WhatsApp/email; the token itself is never stored.
  return { activationLink: `${publicEnv.siteUrl}/activate/${token}`, schoolName: d.name };
}
