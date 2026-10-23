import { isSupabaseConfigured } from "@/lib/env";

export default function Setup() {
  const ok = isSupabaseConfigured();
  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Finish setup</h1>
      {ok ? (
        <p className="mt-3 text-muted">Supabase is configured. Go to <a className="text-accent" href="/login">/login</a>.</p>
      ) : (
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-[14px]">
          <li>Copy <code>.env.example</code> to <code>.env.local</code>.</li>
          <li>Fill in your Supabase Project URL, anon key and service role key.</li>
          <li>Run the SQL in <code>supabase/migrations</code> in the Supabase SQL editor.</li>
          <li>Restart <code>npm run dev</code>.</li>
        </ol>
      )}
    </div>
  );
}
