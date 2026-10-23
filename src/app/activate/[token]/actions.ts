"use server";

import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { hashToken, passwordProblems } from "@/lib/invite";

export type ActivateState = { error?: string; problems?: string[] };

/** Looks up a valid, unused invitation by its token. Runs with the service role; returns only safe fields. */
export async function findInvitation(token: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("invitations")
    .select("id, expires_at, used_at, membership:memberships(id, full_name, phone, email, role, user_id), school:schools(name)")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!data || data.used_at || new Date(data.expires_at) < new Date()) return null;
  return data as unknown as {
    id: string;
    expires_at: string;
    membership: { id: string; full_name: string; phone: string | null; email: string | null; role: string; user_id: string | null };
    school: { name: string };
  };
}

export async function activate(token: string, _: ActivateState, formData: FormData): Promise<ActivateState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const invite = await findInvitation(token);
  if (!invite) return { error: "This link has expired or was already used. Ask your school admin for a new one." };
  if (!invite.membership.email) return { error: "This invitation has no email address. Ask your school admin to add one." };

  const problems = passwordProblems(password, invite.membership.phone);
  if (problems.length) return { problems };
  if (password !== confirm) return { error: "The two passwords do not match." };

  const admin = createAdminClient();
  let userId = invite.membership.user_id;
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: invite.membership.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: invite.membership.full_name },
    });
    if (error || !data.user) return { error: error?.message ?? "Could not create the account." };
    userId = data.user.id;
  } else {
    await admin.auth.admin.updateUserById(userId, { password });
  }

  const now = new Date().toISOString();
  await admin.from("memberships").update({ user_id: userId, activated_at: now }).eq("id", invite.membership.id);
  await admin.from("invitations").update({ used_at: now }).eq("id", invite.id);

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: invite.membership.email, password });
  redirect("/");
}
