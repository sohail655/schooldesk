-- Tenant-isolation checks. Run after stub_supabase.sql and the migrations.
\set ON_ERROR_STOP on
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@schooldesk.pk'),
  ('00000000-0000-0000-0000-0000000000a1', 'admin@alnoor.pk'),
  ('00000000-0000-0000-0000-0000000000b1', 'admin@citizen.pk'),
  ('00000000-0000-0000-0000-0000000000a2', 'teacher@alnoor.pk'),
  ('00000000-0000-0000-0000-0000000000a3', 'parent@alnoor.pk');
update public.profiles set is_platform_owner = true where id = '00000000-0000-0000-0000-000000000001';

insert into public.schools (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111', 'Al-Noor Model School', 'al-noor'),
  ('22222222-2222-2222-2222-222222222222', 'The Citizen School', 'citizen');
insert into public.subscriptions (school_id, plan_id, status, current_period_end)
  select s.id, (select id from public.plans where name = 'Standard'), 'active', now() + interval '30 days' from public.schools s;

insert into public.memberships (id, school_id, user_id, role, full_name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-0000000000a1', 'school_admin', 'Imran Saeed'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-0000000000a2', 'teacher', 'Nazia Kausar'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-0000000000a3', 'parent', 'Shahid Iqbal'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-0000000000b1', 'school_admin', 'Rabia Anwar');

insert into public.academic_years (id, school_id, name, starts_on, ends_on, is_current) values
  ('cccccccc-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2026-27', '2026-04-01', '2027-03-31', true);
insert into public.classes (id, school_id, academic_year_id, name, section, class_teacher_id) values
  ('dddddddd-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cccccccc-0000-0000-0000-000000000001', 'Class 5', 'A', 'aaaaaaaa-0000-0000-0000-000000000002');
insert into public.students (id, school_id, admission_no, full_name) values
  ('eeeeeeee-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '2204', 'Ali Hassan'),
  ('eeeeeeee-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '2205', 'Zainab Bibi');
insert into public.student_guardians (school_id, student_id, guardian_id) values
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003');

create or replace function pg_temp.check(label text, ok boolean) returns void language plpgsql as $$
begin
  if not ok then raise exception 'FAIL: %', label; end if;
  raise notice 'ok  %', label;
end $$;

set role authenticated;

-- Other school's admin sees nothing of Al-Noor
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b1';
select pg_temp.check('citizen admin cannot see al-noor students', (select count(*) from public.students) = 0);
select pg_temp.check('citizen admin sees only own school', (select count(*) from public.schools) = 1);

-- Al-Noor admin sees both students
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select pg_temp.check('al-noor admin sees its 2 students', (select count(*) from public.students) = 2);

-- Parent sees only their own child
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a3';
select pg_temp.check('parent sees only own child', (select count(*) from public.students) = 1);

-- Teacher can mark attendance for own class
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
insert into public.student_attendance (school_id, student_id, class_id, on_date, status, marked_by)
values ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', current_date, 'absent', 'aaaaaaaa-0000-0000-0000-000000000002');
select pg_temp.check('teacher marked attendance', (select count(*) from public.student_attendance) = 1);

-- Duplicate attendance for same day is rejected
do $$ begin
  insert into public.student_attendance (school_id, student_id, class_id, on_date, status, marked_by)
  values ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', current_date, 'present', 'aaaaaaaa-0000-0000-0000-000000000002');
  raise exception 'FAIL: duplicate allowed';
exception when unique_violation then raise notice 'ok  duplicate attendance rejected';
end $$;

-- Parent cannot mark attendance
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a3';
do $$ begin
  insert into public.student_attendance (school_id, student_id, class_id, on_date, status, marked_by)
  values ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000001', current_date, 'present', 'aaaaaaaa-0000-0000-0000-000000000003');
  raise exception 'FAIL: parent could mark attendance';
exception when insufficient_privilege then raise notice 'ok  parent cannot mark attendance';
end $$;

-- A user cannot make themselves platform owner
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
do $$ begin
  update public.profiles set is_platform_owner = true where id = '00000000-0000-0000-0000-0000000000a1';
  raise exception 'FAIL: privilege escalation';
exception when raise_exception then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'ok  cannot self-promote to owner';
end $$;

-- Cross-school write is rejected
do $$ begin
  insert into public.students (school_id, admission_no, full_name) values ('22222222-2222-2222-2222-222222222222', '9999', 'Intruder');
  raise exception 'FAIL: cross-school insert';
exception when insufficient_privilege then raise notice 'ok  cannot write into another school';
end $$;

-- Suspended school becomes read-only
reset role;
update public.subscriptions set status = 'suspended' where school_id = '11111111-1111-1111-1111-111111111111';
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
do $$ begin
  insert into public.students (school_id, admission_no, full_name) values ('11111111-1111-1111-1111-111111111111', '2299', 'New Kid');
  raise exception 'FAIL: suspended school writable';
exception when insufficient_privilege then raise notice 'ok  suspended school is read-only';
end $$;
select pg_temp.check('suspended school data still readable', (select count(*) from public.students) = 2);

-- Audit log captured the attendance change history
reset role;
select pg_temp.check('audit log has membership entries', (select count(*) from public.audit_logs where module = 'users') >= 4);
