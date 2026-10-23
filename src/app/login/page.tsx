import { LoginForm } from "./login-form";
import { Logo } from "@/components/ui";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="flex flex-col px-6 py-10 md:px-16">
        <Logo />
        <div className="my-auto w-full max-w-[380px] py-10">
          <h1 className="text-[28px] font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1.5 text-muted">Use the email your school registered.</p>
          <LoginForm next={next} />
          <p className="mt-6 text-[12.5px] text-muted">Parents and teachers get their login link from the school. No account? Ask your school admin.</p>
        </div>
        <div className="text-xs text-muted">© 2026 SchoolDesk</div>
      </div>
      <div className="hidden flex-col justify-center gap-5 border-l border-line bg-surface-2 p-16 md:flex">
        <p className="max-w-[480px] text-3xl font-semibold leading-tight tracking-tight">Attendance, fees and results for your whole school, in one place.</p>
      </div>
    </div>
  );
}
