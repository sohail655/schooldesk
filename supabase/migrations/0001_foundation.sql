-- SchoolDesk foundation: tenancy, users, roles, academics, attendance, subscriptions, audit.
-- Every school-owned row carries school_id and is protected by Row Level Security.

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type public.school_role as enum ('school_admin', 'principal', 'admin', 'teacher', 'student', 'parent');
create type public.school_status as enum ('trial', 'active', 'grace', 'suspended', 'cancelled');
create type public.billing_cycle as enum ('monthly', 'yearly');
create type public.attendance_status as enum ('present', 'absent', 'late', 'leave', 'half_day');
create type public.invoice_status as enum ('draft', 'open', 'paid', 'overdue', 'void');

-- ---------- platform ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_url text,
  is_platform_owner boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price_monthly integer not null check (price_monthly >= 0),   -- PKR
  price_yearly integer not null check (price_yearly >= 0),     -- PKR
  max_students integer,                                        -- null = unlimited
  max_staff integer,
  max_admin_seats integer not null default 1,
  storage_gb integer not null default 3,
  trial_days integer not null default 14,
  features jsonb not null default '[]'::jsonb,                 -- e.g. ["attendance","fees","payroll"]
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text,
  address text,
  phone text,
  email text,
  registration_no text,
  logo_path text,
  timezone text not null default 'Asia/Karachi',
  school_opens_at time not null default '08:00',
  teacher_late_after time not null default '08:15',
  checkin_lat double precision,
  checkin_lng double precision,
  checkin_radius_m integer not null default 100,
  weekly_off smallint[] not null default '{0}',                -- 0 = Sunday
  status public.school_status not null default 'trial',
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null unique references public.schools (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  cycle public.billing_cycle not null default 'monthly',
  status public.school_status not null default 'trial',
  trial_ends_at timestamptz,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  grace_days integer not null default 7,
  auto_renew boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscription_invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  school_id uuid not null references public.schools (id) on delete cascade,
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount integer not null check (amount >= 0),
  status public.invoice_status not null default 'open',
  paid_at timestamptz,
  payment_method text,
  payment_reference text,
  created_at timestamptz not null default now()
);

-- ---------- membership & roles ----------
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,   -- null until invite accepted
  role public.school_role not null,
  full_name text not null,
  phone text,
  email text,
  is_active boolean not null default true,
  invited_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (school_id, user_id, role)
);
create index memberships_user_idx on public.memberships (user_id) where is_active;
create index memberships_school_idx on public.memberships (school_id, role);

-- One-time activation links. Only a hash of the token is stored.
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- ---------- academics ----------
create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  check (ends_on > starts_on)
);
create unique index one_current_year on public.academic_years (school_id) where is_current;

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  on_date date not null,
  title text not null,
  unique (school_id, on_date)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  academic_year_id uuid not null references public.academic_years (id) on delete cascade,
  name text not null,                 -- "Class 5"
  section text not null default 'A',
  class_teacher_id uuid references public.memberships (id) on delete set null,
  room text,
  unique (academic_year_id, name, section)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  unique (school_id, name)
);

create table public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  teacher_id uuid references public.memberships (id) on delete set null,
  periods_per_week smallint not null default 5,
  unique (class_id, subject_id)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  membership_id uuid references public.memberships (id) on delete set null, -- student login (optional)
  admission_no text not null,
  full_name text not null,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  b_form_no text,
  address text,
  photo_path text,
  status text not null default 'active' check (status in ('active', 'left', 'graduated')),
  admitted_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (school_id, admission_no)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  roll_no integer,
  unique (student_id, class_id)
);

create table public.student_guardians (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  guardian_id uuid not null references public.memberships (id) on delete cascade, -- role = parent
  relation text not null default 'father',
  is_primary boolean not null default false,
  whatsapp_consent boolean not null default false,
  unique (student_id, guardian_id)
);

-- ---------- attendance ----------
create table public.student_attendance (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  on_date date not null,
  status public.attendance_status not null,
  note text,
  marked_by uuid not null references public.memberships (id),
  marked_at timestamptz not null default now(),
  unique (student_id, on_date)                     -- no duplicate entries
);
create index student_attendance_class_day on public.student_attendance (class_id, on_date);

create table public.staff_attendance (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  membership_id uuid not null references public.memberships (id) on delete cascade,
  on_date date not null,
  status public.attendance_status not null,
  check_in_at timestamptz,
  check_out_at timestamptz,
  check_in_lat double precision,
  check_in_lng double precision,
  distance_m integer,
  selfie_path text,
  corrected_by uuid references public.memberships (id),
  correction_reason text,
  unique (membership_id, on_date)
);

-- ---------- audit ----------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  school_id uuid references public.schools (id) on delete set null,
  actor_id uuid references auth.users (id),
  module text not null,
  action text not null,
  record_table text not null,
  record_id text not null,
  before jsonb,
  after jsonb,
  reason text,
  ip inet,
  created_at timestamptz not null default now()
);
create index audit_logs_school_time on public.audit_logs (school_id, created_at desc);

-- ---------- helper functions (security definer, fixed search_path) ----------
create or replace function public.is_platform_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_platform_owner from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.has_school_role(p_school uuid, p_roles public.school_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.school_id = p_school and m.user_id = auth.uid() and m.is_active and m.role = any (p_roles)
  );
$$;

create or replace function public.is_school_member(p_school uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.school_id = p_school and m.user_id = auth.uid() and m.is_active
  );
$$;

create or replace function public.is_school_staff(p_school uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_school_role(p_school, array['school_admin','principal','admin','teacher']::public.school_role[]);
$$;

create or replace function public.is_school_manager(p_school uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_school_role(p_school, array['school_admin','principal','admin']::public.school_role[]);
$$;

-- Students the current user may see as a parent or as the student themself.
create or replace function public.my_student_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select sg.student_id from public.student_guardians sg
    join public.memberships m on m.id = sg.guardian_id
   where m.user_id = auth.uid() and m.is_active
  union
  select s.id from public.students s
    join public.memberships m on m.id = s.membership_id
   where m.user_id = auth.uid() and m.is_active;
$$;

-- Subscription gate: false when suspended/cancelled or past grace period.
create or replace function public.school_is_writable(p_school uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where s.school_id = p_school
      and s.status in ('trial','active','grace')
      and now() <= s.current_period_end + make_interval(days => s.grace_days)
  );
$$;

-- Teacher may mark attendance for classes they teach or are class teacher of.
create or replace function public.teaches_class(p_class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.classes c join public.memberships m on m.id = c.class_teacher_id
     where c.id = p_class and m.user_id = auth.uid() and m.is_active
  ) or exists (
    select 1 from public.class_subjects cs join public.memberships m on m.id = cs.teacher_id
     where cs.class_id = p_class and m.user_id = auth.uid() and m.is_active
  );
$$;

-- ---------- audit trigger ----------
create or replace function public.audit_changes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (school_id, actor_id, module, action, record_table, record_id, before, after)
  values (
    coalesce((case when tg_op = 'DELETE' then old.school_id else new.school_id end), null),
    auth.uid(),
    tg_argv[0],
    lower(tg_op),
    tg_table_name,
    (case when tg_op = 'DELETE' then old.id else new.id end)::text,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

create trigger audit_student_attendance after update or delete on public.student_attendance
  for each row execute function public.audit_changes('attendance');
create trigger audit_staff_attendance after update or delete on public.staff_attendance
  for each row execute function public.audit_changes('attendance');
create trigger audit_memberships after insert or update or delete on public.memberships
  for each row execute function public.audit_changes('users');
create trigger audit_subscriptions after insert or update on public.subscriptions
  for each row execute function public.audit_changes('subscription');

-- New auth user -> profile row
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.phone)
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may never grant themselves platform-owner rights.
create or replace function public.protect_owner_flag() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() is null only for the SQL editor / service role, which is how the first owner is set.
  if new.is_platform_owner is distinct from old.is_platform_owner
     and auth.uid() is not null and not public.is_platform_owner() then
    raise exception 'not allowed';
  end if;
  return new;
end $$;
create trigger protect_owner_flag before update on public.profiles
  for each row execute function public.protect_owner_flag();

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.schools enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_invoices enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.academic_years enable row level security;
alter table public.holidays enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.class_subjects enable row level security;
alter table public.students enable row level security;
alter table public.enrollments enable row level security;
alter table public.student_guardians enable row level security;
alter table public.student_attendance enable row level security;
alter table public.staff_attendance enable row level security;
alter table public.audit_logs enable row level security;

-- profiles
create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_platform_owner());
create policy "update own profile" on public.profiles for update using (id = auth.uid() or public.is_platform_owner());

-- plans: anyone signed in can read active plans; only owner writes
create policy "read plans" on public.plans for select using (auth.uid() is not null);
create policy "owner manages plans" on public.plans for all using (public.is_platform_owner()) with check (public.is_platform_owner());

-- schools
create policy "members read school" on public.schools for select using (public.is_school_member(id) or public.is_platform_owner());
create policy "managers update school" on public.schools for update using (public.has_school_role(id, array['school_admin','principal']::public.school_role[]) or public.is_platform_owner());
create policy "owner creates schools" on public.schools for insert with check (public.is_platform_owner());
create policy "owner deletes schools" on public.schools for delete using (public.is_platform_owner());

-- subscriptions & invoices: school admins read, owner manages
create policy "school reads subscription" on public.subscriptions for select using (public.has_school_role(school_id, array['school_admin','principal']::public.school_role[]) or public.is_platform_owner());
create policy "owner manages subscription" on public.subscriptions for all using (public.is_platform_owner()) with check (public.is_platform_owner());
create policy "school reads invoices" on public.subscription_invoices for select using (public.has_school_role(school_id, array['school_admin','principal']::public.school_role[]) or public.is_platform_owner());
create policy "owner manages invoices" on public.subscription_invoices for all using (public.is_platform_owner()) with check (public.is_platform_owner());

-- memberships
create policy "read memberships" on public.memberships for select using (user_id = auth.uid() or public.is_school_staff(school_id) or public.is_platform_owner());
create policy "managers write memberships" on public.memberships for all
  using (public.is_school_manager(school_id) or public.is_platform_owner())
  with check ((public.is_school_manager(school_id) and public.school_is_writable(school_id)) or public.is_platform_owner());

-- invitations: never readable from the client; created/consumed by server code with the service role
create policy "no client access" on public.invitations for select using (false);

-- academic structure: members read, managers write
create policy "read years" on public.academic_years for select using (public.is_school_member(school_id) or public.is_platform_owner());
create policy "write years" on public.academic_years for all using (public.is_school_manager(school_id)) with check (public.is_school_manager(school_id) and public.school_is_writable(school_id));
create policy "read holidays" on public.holidays for select using (public.is_school_member(school_id) or public.is_platform_owner());
create policy "write holidays" on public.holidays for all using (public.is_school_manager(school_id)) with check (public.is_school_manager(school_id) and public.school_is_writable(school_id));
create policy "read classes" on public.classes for select using (public.is_school_member(school_id) or public.is_platform_owner());
create policy "write classes" on public.classes for all using (public.is_school_manager(school_id)) with check (public.is_school_manager(school_id) and public.school_is_writable(school_id));
create policy "read subjects" on public.subjects for select using (public.is_school_member(school_id) or public.is_platform_owner());
create policy "write subjects" on public.subjects for all using (public.is_school_manager(school_id)) with check (public.is_school_manager(school_id) and public.school_is_writable(school_id));
create policy "read class_subjects" on public.class_subjects for select using (public.is_school_member(school_id) or public.is_platform_owner());
create policy "write class_subjects" on public.class_subjects for all using (public.is_school_manager(school_id)) with check (public.is_school_manager(school_id) and public.school_is_writable(school_id));

-- students: staff see all in school; parents/students see only their own
create policy "staff read students" on public.students for select using (public.is_school_staff(school_id) or id in (select public.my_student_ids()) or public.is_platform_owner());
create policy "managers write students" on public.students for all using (public.is_school_manager(school_id)) with check (public.is_school_manager(school_id) and public.school_is_writable(school_id));
create policy "read enrollments" on public.enrollments for select using (public.is_school_staff(school_id) or student_id in (select public.my_student_ids()));
create policy "write enrollments" on public.enrollments for all using (public.is_school_manager(school_id)) with check (public.is_school_manager(school_id) and public.school_is_writable(school_id));
create policy "read guardians" on public.student_guardians for select using (public.is_school_staff(school_id) or student_id in (select public.my_student_ids()));
create policy "write guardians" on public.student_guardians for all using (public.is_school_manager(school_id)) with check (public.is_school_manager(school_id) and public.school_is_writable(school_id));

-- student attendance
create policy "read student attendance" on public.student_attendance for select
  using (public.is_school_staff(school_id) or student_id in (select public.my_student_ids()));
create policy "mark student attendance" on public.student_attendance for insert
  with check (public.school_is_writable(school_id) and (public.is_school_manager(school_id) or public.teaches_class(class_id)));
create policy "correct student attendance" on public.student_attendance for update
  using (public.is_school_manager(school_id) or (public.teaches_class(class_id) and on_date = current_date))
  with check (public.school_is_writable(school_id));

-- staff attendance: staff see their own; managers see all and correct
create policy "read staff attendance" on public.staff_attendance for select
  using (public.is_school_manager(school_id) or membership_id in (select id from public.memberships where user_id = auth.uid()));
create policy "managers correct staff attendance" on public.staff_attendance for update
  using (public.is_school_manager(school_id)) with check (public.school_is_writable(school_id));
-- Teacher self check-in is inserted by a server action after GPS/radius validation (service role).

-- audit logs: read-only for managers and owner; nobody edits
create policy "read audit" on public.audit_logs for select using (public.is_school_manager(school_id) or public.is_platform_owner());

-- ---------- seed plans ----------
insert into public.plans (name, price_monthly, price_yearly, max_students, max_staff, max_admin_seats, storage_gb, features) values
  ('Starter', 2500, 27000, 200, 15, 1, 3, '["attendance","students","reports","parent_portal"]'),
  ('Standard', 5000, 54000, 500, 40, 3, 10, '["attendance","students","reports","parent_portal","fees","payroll","exams","homework","whatsapp"]'),
  ('Premium', 9500, 102000, null, null, 10, 50, '["attendance","students","reports","parent_portal","fees","payroll","exams","homework","whatsapp","multi_campus","branding"]');
