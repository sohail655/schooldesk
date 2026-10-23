# SchoolDesk

Multi-school management SaaS: attendance, fees, payroll, homework, exams and parent portal. Each school is an isolated tenant on a monthly or yearly subscription, managed by the platform owner.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, Row Level Security) · Zod · React Hook Form · Recharts.

## What is built (milestone 1: foundation)

- Database schema with RLS for schools, plans, subscriptions, memberships, invitations, academic years, holidays, classes, subjects, students, guardians, student and staff attendance, and audit logs (`supabase/migrations/0001_foundation.sql`).
- Tenant isolation, parent-only-sees-own-child, no duplicate attendance, read-only when a subscription is suspended, and audit triggers. Covered by `supabase/tests/rls_test.sql`.
- Email/password sign-in, one-time activation links (only a hash is stored), role-based home routing.
- Platform Owner panel: overview (schools by status, users, MRR, renewals) and schools list, plus **create school** which starts a trial and produces the admin's activation link.
- School shell with a per-role menu (admin, principal, teacher, parent, student), trial/suspended banners, and an admin dashboard with live attendance counts.

Next milestones: school setup screens (students, teachers, classes) → attendance and teacher GPS check-in → fees → payroll → homework and exams → parent/student portal and messaging → WhatsApp and payment integrations.

## Setup

1. **Supabase project.** Create one at supabase.com (region Singapore or Mumbai).
2. **Database.** In Supabase → SQL Editor, run `supabase/migrations/0001_foundation.sql`.
3. **Environment.** Copy `.env.example` to `.env.local` and fill in values from Supabase → Project Settings → API. `SUPABASE_SERVICE_ROLE_KEY` is server-only; never put it in client code or commit it.
4. **Install and run.**
   ```bash
   npm install
   npm run dev
   ```
5. **Make yourself the platform owner.** Sign up a user in Supabase → Authentication → Users (Add user, auto-confirm), then in the SQL editor:
   ```sql
   update public.profiles set is_platform_owner = true where id = (select id from auth.users where email = 'you@example.com');
   ```
   Sign in at `/login`. You land on `/owner`. Use **New school** to create a school and copy the admin's activation link.

## Deploy

Vercel or Cloudflare. Set the same four environment variables in the hosting dashboard, with `NEXT_PUBLIC_SITE_URL` set to your real domain so activation links point to it. In Supabase → Authentication → URL Configuration, add the same domain.

## Tests

```bash
npm test                 # unit tests (attendance %, GPS distance, late check, invites, roles)
npm run typecheck
DATABASE_URL=postgres://postgres@localhost:5432/postgres npm run test:db   # schema + RLS tests on a throwaway Postgres
```

## Security rules

- Every school-owned table has `school_id` and RLS; the server never trusts a school id, role or payment status sent from the browser.
- The service-role client (`createAdminClient`) is used only in server actions after an explicit permission check.
- Users cannot grant themselves platform-owner rights (trigger `protect_owner_flag`).
- When a subscription is suspended or past its grace period, data stays readable but writes are blocked in the database.
