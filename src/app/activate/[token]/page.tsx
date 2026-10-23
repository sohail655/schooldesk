import { ROLE_LABEL, type SchoolRole } from "@/lib/roles";
import { findInvitation } from "./actions";
import { ActivateForm } from "./activate-form";

export const dynamic = "force-dynamic";

export default async function ActivatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await findInvitation(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-2 p-4">
      <div className="flex w-full max-w-[440px] flex-col gap-4 rounded-2xl border border-line bg-bg p-8">
        {!invite ? (
          <>
            <h1 className="text-xl font-semibold">This link no longer works</h1>
            <p className="text-[13.5px] text-muted">It has expired or was already used. Ask your school admin to send a new activation link.</p>
          </>
        ) : (
          <>
            <div>
              <div className="text-[12.5px] text-muted">You&apos;re invited to</div>
              <div className="font-semibold">{invite.school.name}</div>
            </div>
            <div>
              <h1 className="text-[22px] font-semibold">Activate your account</h1>
              <p className="mt-1 text-[13.5px] text-muted">
                You were added as <b className="font-medium text-fg">{ROLE_LABEL[invite.membership.role as SchoolRole]}</b>. Set a password to finish.
              </p>
            </div>
            <div className="grid grid-cols-[90px_1fr] gap-1.5 rounded-lg bg-surface-2 p-3 text-[13px]">
              <span className="text-muted">Name</span>
              <span>{invite.membership.full_name}</span>
              <span className="text-muted">Email</span>
              <span>{invite.membership.email}</span>
            </div>
            <ActivateForm token={token} />
            <p className="text-xs text-muted">This link expires on {new Date(invite.expires_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })} and works only once. Your school never sees your password.</p>
          </>
        )}
      </div>
    </div>
  );
}
