create type public.app_role as enum('admin','teacher','student','parent');
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,full_name text not null,role public.app_role not null default 'student',created_at timestamptz not null default now());
create table public.students(id uuid primary key default gen_random_uuid(),profile_id uuid unique references public.profiles(id) on delete set null,grade smallint not null check(grade between 5 and 9),guardian_profile_id uuid references public.profiles(id) on delete set null,created_at timestamptz not null default now());
create table public.questions(id uuid primary key default gen_random_uuid(),subject text not null check(subject in('Mathematics','English')),grade smallint not null check(grade between 5 and 9),topic text not null,difficulty text not null check(difficulty in('Foundation','Intermediate','Advanced')),prompt text not null,options jsonb not null,correct_option smallint not null,explanation text,created_by uuid references public.profiles(id) on delete set null,created_at timestamptz not null default now());
create table public.assessments(id uuid primary key default gen_random_uuid(),title text not null,subject text not null check(subject in('Mathematics','English')),grade smallint not null check(grade between 5 and 9),duration_minutes smallint not null check(duration_minutes between 1 and 180),created_by uuid not null references public.profiles(id));
create table public.assessment_questions(assessment_id uuid references public.assessments(id) on delete cascade,question_id uuid references public.questions(id),position smallint not null,primary key(assessment_id,question_id));
create table public.attempts(id uuid primary key default gen_random_uuid(),assessment_id uuid not null references public.assessments(id),user_id uuid not null references public.profiles(id),score smallint not null check(score between 0 and 100),letter text not null,total_questions smallint not null,correct_answers smallint not null,started_at timestamptz not null default now(),submitted_at timestamptz not null default now());
create or replace function public.my_role() returns public.app_role language sql stable security definer set search_path=public as $$select role from public.profiles where id=auth.uid()$$;
DO $$DECLARE t text;BEGIN FOR t IN SELECT unnest(ARRAY['profiles','students','questions','assessments','assessment_questions','attempts']) LOOP EXECUTE format('alter table public.%I enable row level security',t);END LOOP;END$$;
create policy profiles_self on public.profiles for select to authenticated using(id=auth.uid() or public.my_role() in('admin','teacher'));
create policy questions_read on public.questions for select to authenticated using(true);
create policy questions_staff_write on public.questions for all to authenticated using(public.my_role() in('admin','teacher')) with check(public.my_role() in('admin','teacher'));
create policy assessments_staff on public.assessments for all to authenticated using(public.my_role() in('admin','teacher')) with check(public.my_role() in('admin','teacher'));
create policy assessment_questions_staff on public.assessment_questions for all to authenticated using(public.my_role() in('admin','teacher')) with check(public.my_role() in('admin','teacher'));
create policy attempts_self on public.attempts for select to authenticated using(user_id=auth.uid() or public.my_role() in('admin','teacher'));
create policy attempts_insert on public.attempts for insert to authenticated with check(user_id=auth.uid());
create policy students_staff_or_owner on public.students for select to authenticated using(profile_id=auth.uid() or guardian_profile_id=auth.uid() or public.my_role() in('admin','teacher'));
create policy students_staff_write on public.students for all to authenticated using(public.my_role() in('admin','teacher')) with check(public.my_role() in('admin','teacher'));

-- Student assignment layer: students only see assessments explicitly assigned to them.
create table public.assessment_assignments (
  assessment_id uuid references public.assessments(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  primary key (assessment_id,student_id)
);
alter table public.assessment_assignments enable row level security;
create policy "assignment_staff_manage" on public.assessment_assignments for all to authenticated using (public.my_role() in ('admin','teacher')) with check (public.my_role() in ('admin','teacher'));
create policy "assignment_student_read" on public.assessment_assignments for select to authenticated using (student_id in (select id from public.students where profile_id=auth.uid()));

-- Allow students to read only assessment metadata that they have been assigned.
create policy "assigned_student_read_assessment" on public.assessments for select to authenticated using (
 public.my_role() in ('admin','teacher') or id in (select assessment_id from public.assessment_assignments aa join public.students s on s.id=aa.student_id where s.profile_id=auth.uid())
);
create policy "assigned_student_read_questions" on public.assessment_questions for select to authenticated using (
 assessment_id in (select assessment_id from public.assessment_assignments aa join public.students s on s.id=aa.student_id where s.profile_id=auth.uid())
);
create policy "assigned_student_read_question_content" on public.questions for select to authenticated using (
 public.my_role() in ('admin','teacher') or id in (select aq.question_id from public.assessment_questions aq join public.assessment_assignments aa on aa.assessment_id=aq.assessment_id join public.students s on s.id=aa.student_id where s.profile_id=auth.uid())
);
