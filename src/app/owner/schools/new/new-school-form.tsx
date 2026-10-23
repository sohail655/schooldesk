"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, Field } from "@/components/ui";
import { createSchool, type NewSchoolState } from "./actions";

type Plan = { id: string; name: string; price_monthly: number; price_yearly: number };

export function NewSchoolForm({ plans }: { plans: Plan[] }) {
  const [state, action, pending] = useActionState<NewSchoolState, FormData>(createSchool, {});
  const [copied, setCopied] = useState(false);
  const e = state.fieldErrors ?? {};

  if (state.activationLink) {
    return (
      <div className="flex flex-col gap-3 rounded-[10px] border border-line p-5">
        <div className="font-semibold">{state.schoolName} is ready</div>
        <p className="text-[13px] text-muted">Send this one-time link to the school admin. It works once and expires in 7 days.</p>
        <div className="num break-all rounded-lg bg-surface-2 p-3 text-[12.5px]">{state.activationLink}</div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(state.activationLink!);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Link href="/owner/schools" className="inline-flex h-9 items-center rounded-lg border border-line px-3.5 font-medium">Back to schools</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      <fieldset className="grid gap-3 rounded-[10px] border border-line p-5 sm:grid-cols-2">
        <legend className="px-1 text-sm font-semibold">School</legend>
        <Field label="School name" name="name" required error={e.name} />
        <Field label="City" name="city" required error={e.city} />
        <Field label="Phone" name="phone" />
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          Plan
          <select name="planId" className="h-10 rounded-lg border border-line bg-bg px-3 font-normal" defaultValue={plans[1]?.id ?? plans[0]?.id}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · Rs {p.price_monthly.toLocaleString()}/mo</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          Billing
          <select name="cycle" className="h-10 rounded-lg border border-line bg-bg px-3 font-normal" defaultValue="monthly">
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>
      </fieldset>
      <fieldset className="grid gap-3 rounded-[10px] border border-line p-5 sm:grid-cols-2">
        <legend className="px-1 text-sm font-semibold">School admin</legend>
        <Field label="Full name" name="adminName" required error={e.adminName} />
        <Field label="Email" name="adminEmail" type="email" required error={e.adminEmail} />
        <Field label="Phone" name="adminPhone" />
      </fieldset>
      {state.error && <div role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-[13px] text-bad">{state.error}</div>}
      <div className="flex justify-end">
        <Button variant="primary" disabled={pending}>{pending ? "Creating…" : "Create school"}</Button>
      </div>
    </form>
  );
}
