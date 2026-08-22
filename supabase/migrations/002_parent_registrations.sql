-- ============================================================
-- JOECH TUTOR
-- Parent & Ward Registration System
-- Migration: 002_parent_registrations.sql
-- ============================================================

create table public.parent_registrations (
  id uuid primary key default gen_random_uuid(),

  -- ==========================================================
  -- Parent / Guardian Information
  -- ==========================================================
  parent_full_name text not null,
  relationship_to_student text,
  parent_email text not null,
  phone_whatsapp text,
  country text,
  city text,
  preferred_communication text,

  -- ==========================================================
  -- Student / Ward Information
  -- ==========================================================
  student_full_name text not null,
  student_date_of_birth date,
  student_gender text,
  school_name text,
  current_grade_class text,
  curriculum text,
  other_curriculum text,

  -- ==========================================================
  -- Academic Support
  -- ==========================================================
  subjects text[],
  other_subject text,
  priority_subject text,
  academic_performance text,
  difficult_areas text,
  academic_goals text,
  learning_needs text,

  -- ==========================================================
  -- Examination / Assessment
  -- ==========================================================
  upcoming_exam_or_assessment text,
  examination_name text,
  examination_date date,
  initial_academic_assessment boolean,

  -- ==========================================================
  -- Tutoring Preferences
  -- ==========================================================
  tutoring_type text,
  lesson_format text,
  lessons_per_week text,
  lesson_duration text,
  preferred_days text[],
  preferred_time text,
  timezone text,
  other_timezone text,

  -- ==========================================================
  -- Previous Tutoring
  -- ==========================================================
  previous_tutoring boolean,
  previous_tutoring_type text,
  previous_tutoring_feedback text,

  -- ==========================================================
  -- Parent Expectations
  -- ==========================================================
  parent_expectations text,
  progress_update_preference text,

  -- ==========================================================
  -- Additional Information
  -- ==========================================================
  additional_student_information text,
  how_heard_about_joech_tutor text,
  other_referral_source text,

  -- ==========================================================
  -- Consent
  -- ==========================================================
  parent_guardian_consent boolean not null default false,
  communication_consent boolean not null default false,

  -- ==========================================================
  -- Final Submission
  -- ==========================================================
  additional_discussion text,
  preferred_next_step text,

  -- ==========================================================
  -- Registration Management
  -- ==========================================================
  status text not null default 'new'
    check (
      status in (
        'new',
        'under_review',
        'approved',
        'student_created',
        'rejected'
      )
    ),

  admin_notes text,

  -- ==========================================================
  -- Link to Existing Student Account
  -- ==========================================================
  created_student_id uuid
    references public.students(id)
    on delete set null,

  -- ==========================================================
  -- Review Information
  -- ==========================================================
  reviewed_at timestamptz,
  reviewed_by uuid
    references public.profiles(id)
    on delete set null,

  -- ==========================================================
  -- Timestamps
  -- ==========================================================
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.parent_registrations
enable row level security;

-- Staff can view registrations.
create policy "parent_registrations_staff_select"
on public.parent_registrations
for select
to authenticated
using (
  public.my_role() in ('admin', 'teacher')
);

-- Staff can create registrations.
-- This will be used initially by our secure application/API.
create policy "parent_registrations_staff_insert"
on public.parent_registrations
for insert
to authenticated
with check (
  public.my_role() in ('admin', 'teacher')
);

-- Staff can update registrations.
create policy "parent_registrations_staff_update"
on public.parent_registrations
for update
to authenticated
using (
  public.my_role() in ('admin', 'teacher')
)
with check (
  public.my_role() in ('admin', 'teacher')
);

-- Only administrators can delete registrations.
create policy "parent_registrations_admin_delete"
on public.parent_registrations
for delete
to authenticated
using (
  public.my_role() = 'admin'
);

-- ============================================================
-- INDEXES
-- ============================================================

create index parent_registrations_status_idx
on public.parent_registrations(status);

create index parent_registrations_parent_email_idx
on public.parent_registrations(parent_email);

create index parent_registrations_student_name_idx
on public.parent_registrations(student_full_name);

create index parent_registrations_submitted_at_idx
on public.parent_registrations(submitted_at desc);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.update_parent_registration_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger parent_registrations_updated_at
before update on public.parent_registrations
for each row
execute function public.update_parent_registration_updated_at();