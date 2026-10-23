"use client";

import { useActionState } from "react";
import { Button, Field } from "@/components/ui";
import { activate, type ActivateState } from "./actions";

export function ActivateForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ActivateState, FormData>(activate.bind(null, token), {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="New password" name="password" type="password" autoComplete="new-password" required />
      <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" required />
      {state.problems && (
        <ul className="rounded-lg bg-warn-soft px-3 py-2 text-[13px] text-warn">
          {state.problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {state.error && <div role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-[13px] text-bad">{state.error}</div>}
      <Button variant="primary" className="h-11 text-[15px]" disabled={pending}>
        {pending ? "Activating…" : "Activate account"}
      </Button>
    </form>
  );
}
