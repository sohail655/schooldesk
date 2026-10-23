import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui";

export default function NoAccess() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Your account is not linked to a school yet</h1>
        <p className="mt-2 text-[13.5px] text-muted">Ask your school admin to add you, then open the activation link they send.</p>
        <form action={signOut} className="mt-5">
          <Button>Sign out</Button>
        </form>
      </div>
    </div>
  );
}
