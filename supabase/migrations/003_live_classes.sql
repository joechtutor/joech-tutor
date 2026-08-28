create table public.live_classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  topic text,
  class_code text not null unique,
  scheduled_at timestamptz,
  duration_minutes smallint not null default 60
    check (duration_minutes between 1 and 240),
  created_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'ended')),
  created_at timestamptz not null default now()
);

create table public.live_class_students (
  live_class_id uuid not null references public.live_classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  joined_at timestamptz,
  left_at timestamptz,
  primary key (live_class_id, student_id)
);

alter table public.live_classes enable row level security;
alter table public.live_class_students enable row level security;

create policy "live_classes_staff_manage"
on public.live_classes
for all
to authenticated
using (
  public.my_role() in ('admin', 'teacher')
)
with check (
  public.my_role() in ('admin', 'teacher')
);

create policy "live_classes_student_read"
on public.live_classes
for select
to authenticated
using (
  id in (
    select live_class_id
    from public.live_class_students lcs
    join public.students s
      on s.id = lcs.student_id
    where s.profile_id = auth.uid()
  )
);

create policy "live_class_students_staff_manage"
on public.live_class_students
for all
to authenticated
using (
  public.my_role() in ('admin', 'teacher')
)
with check (
  public.my_role() in ('admin', 'teacher')
);

create policy "live_class_students_student_read"
on public.live_class_students
for select
to authenticated
using (
  student_id in (
    select id
    from public.students
    where profile_id = auth.uid()
  )
);