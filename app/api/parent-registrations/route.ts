import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabase-server'
import { supabaseAdmin } from '../../../lib/supabase-admin'

type RegistrationPayload = {
  parent_full_name?: string
  relationship_to_student?: string
  parent_email?: string
  phone_whatsapp?: string
  country?: string
  city?: string
  preferred_communication?: string

  student_full_name?: string
  student_date_of_birth?: string
  student_gender?: string
  school_name?: string
  current_grade_class?: string
  curriculum?: string
  other_curriculum?: string

  subjects?: string[]
  other_subject?: string
  priority_subject?: string
  academic_performance?: string
  difficult_areas?: string
  academic_goals?: string
  learning_needs?: string

  upcoming_exam_or_assessment?: string
  examination_name?: string
  examination_date?: string
  initial_academic_assessment?: boolean

  tutoring_type?: string
  lesson_format?: string
  lessons_per_week?: string
  lesson_duration?: string
  preferred_days?: string[]
  preferred_time?: string
  timezone?: string
  other_timezone?: string

  previous_tutoring?: boolean
  previous_tutoring_type?: string
  previous_tutoring_feedback?: string

  parent_expectations?: string
  progress_update_preference?: string

  additional_student_information?: string
  how_heard_about_joech_tutor?: string
  other_referral_source?: string

  parent_guardian_consent?: boolean
  communication_consent?: boolean

  additional_discussion?: string
  preferred_next_step?: string
}

const allowedStatuses = [
  'new',
  'under_review',
  'approved',
  'student_created',
  'rejected',
] as const

type RegistrationStatus =
  (typeof allowedStatuses)[number]

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const cleaned = value.trim()

  return cleaned.length > 0 ? cleaned : null
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === 'string'
    )
    .map((item) => item.trim())
    .filter(Boolean)
}

function cleanBoolean(value: unknown): boolean {
  return value === true
}

/*
 * ============================================================
 * STAFF AUTHENTICATION
 * ============================================================
 */

async function requireStaff() {
  const supabase = await supabaseServer()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      error: NextResponse.json(
        {
          error: 'Unauthenticated',
        },
        {
          status: 401,
        }
      ),
    }
  }

  const admin = supabaseAdmin()

  const {
    data: profile,
    error: profileError,
  } = await admin
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    console.error(
      'Parent registration staff profile lookup error:',
      profileError
    )

    return {
      error: NextResponse.json(
        {
          error:
            'Your user profile could not be found.',
        },
        {
          status: 403,
        }
      ),
    }
  }

  if (
    profile.role !== 'admin' &&
    profile.role !== 'teacher'
  ) {
    return {
      error: NextResponse.json(
        {
          error: 'Forbidden',
        },
        {
          status: 403,
        }
      ),
    }
  }

  return {
    user,
    profile,
    admin,
  }
}

/*
 * ============================================================
 * POST
 *
 * Registration ingestion endpoint.
 * ============================================================
 */

export async function POST(
  request: Request
) {
  try {
    const payload =
      (await request.json()) as RegistrationPayload

    const parentFullName =
      cleanText(
        payload.parent_full_name
      )

    const parentEmail =
      cleanText(
        payload.parent_email
      )

    const studentFullName =
      cleanText(
        payload.student_full_name
      )

    if (!parentFullName) {
      return NextResponse.json(
        {
          error:
            'Parent/Guardian full name is required.',
        },
        {
          status: 400,
        }
      )
    }

    if (!parentEmail) {
      return NextResponse.json(
        {
          error:
            'Parent/Guardian email address is required.',
        },
        {
          status: 400,
        }
      )
    }

    if (!studentFullName) {
      return NextResponse.json(
        {
          error:
            "Student's full name is required.",
        },
        {
          status: 400,
        }
      )
    }

    const registration = {
      parent_full_name:
        parentFullName,

      relationship_to_student:
        cleanText(
          payload.relationship_to_student
        ),

      parent_email:
        parentEmail,

      phone_whatsapp:
        cleanText(
          payload.phone_whatsapp
        ),

      country:
        cleanText(
          payload.country
        ),

      city:
        cleanText(
          payload.city
        ),

      preferred_communication:
        cleanText(
          payload.preferred_communication
        ),

      student_full_name:
        studentFullName,

      student_date_of_birth:
        cleanText(
          payload.student_date_of_birth
        ),

      student_gender:
        cleanText(
          payload.student_gender
        ),

      school_name:
        cleanText(
          payload.school_name
        ),

      current_grade_class:
        cleanText(
          payload.current_grade_class
        ),

      curriculum:
        cleanText(
          payload.curriculum
        ),

      other_curriculum:
        cleanText(
          payload.other_curriculum
        ),

      subjects:
        cleanStringArray(
          payload.subjects
        ),

      other_subject:
        cleanText(
          payload.other_subject
        ),

      priority_subject:
        cleanText(
          payload.priority_subject
        ),

      academic_performance:
        cleanText(
          payload.academic_performance
        ),

      difficult_areas:
        cleanText(
          payload.difficult_areas
        ),

      academic_goals:
        cleanText(
          payload.academic_goals
        ),

      learning_needs:
        cleanText(
          payload.learning_needs
        ),

      upcoming_exam_or_assessment:
        cleanText(
          payload.upcoming_exam_or_assessment
        ),

      examination_name:
        cleanText(
          payload.examination_name
        ),

      examination_date:
        cleanText(
          payload.examination_date
        ),

      initial_academic_assessment:
        cleanBoolean(
          payload.initial_academic_assessment
        ),

      tutoring_type:
        cleanText(
          payload.tutoring_type
        ),

      lesson_format:
        cleanText(
          payload.lesson_format
        ),

      lessons_per_week:
        cleanText(
          payload.lessons_per_week
        ),

      lesson_duration:
        cleanText(
          payload.lesson_duration
        ),

      preferred_days:
        cleanStringArray(
          payload.preferred_days
        ),

      preferred_time:
        cleanText(
          payload.preferred_time
        ),

      timezone:
        cleanText(
          payload.timezone
        ),

      other_timezone:
        cleanText(
          payload.other_timezone
        ),

      previous_tutoring:
        cleanBoolean(
          payload.previous_tutoring
        ),

      previous_tutoring_type:
        cleanText(
          payload.previous_tutoring_type
        ),

      previous_tutoring_feedback:
        cleanText(
          payload.previous_tutoring_feedback
        ),

      parent_expectations:
        cleanText(
          payload.parent_expectations
        ),

      progress_update_preference:
        cleanText(
          payload.progress_update_preference
        ),

      additional_student_information:
        cleanText(
          payload.additional_student_information
        ),

      how_heard_about_joech_tutor:
        cleanText(
          payload.how_heard_about_joech_tutor
        ),

      other_referral_source:
        cleanText(
          payload.other_referral_source
        ),

      parent_guardian_consent:
        cleanBoolean(
          payload.parent_guardian_consent
        ),

      communication_consent:
        cleanBoolean(
          payload.communication_consent
        ),

      additional_discussion:
        cleanText(
          payload.additional_discussion
        ),

      preferred_next_step:
        cleanText(
          payload.preferred_next_step
        ),

      status: 'new',
    }

    const supabase =
      supabaseAdmin()

    const {
      data,
      error,
    } = await supabase
      .from('parent_registrations')
      .insert(registration)
      .select(
        'id, status, submitted_at'
      )
      .single()

    if (error) {
      console.error(
        'Parent registration insert error:',
        error
      )

      return NextResponse.json(
        {
          error:
            'Unable to save parent registration.',
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json(
      {
        success: true,
        registration: data,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(
      'Parent registration API error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Invalid registration request.',
      },
      {
        status: 400,
      }
    )
  }
}

/*
 * ============================================================
 * GET
 *
 * Admin/teacher only.
 * ============================================================
 */

export async function GET() {
  try {
    const auth =
      await requireStaff()

    if (auth.error) {
      return auth.error
    }

    const { admin } = auth

    const {
      data,
      error,
    } = await admin
      .from('parent_registrations')
      .select('*')
      .order(
        'submitted_at',
        {
          ascending: false,
        }
      )

    if (error) {
      console.error(
        'Parent registrations fetch error:',
        error
      )

      return NextResponse.json(
        {
          error:
            'Unable to load parent registrations.',
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json(
      {
        registrations:
          data || [],
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      'Parent registrations GET error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Unable to load parent registrations.',
      },
      {
        status: 500,
      }
    )
  }
}

/*
 * ============================================================
 * PATCH
 *
 * Admin/teacher only.
 * Update registration status and admin notes.
 * ============================================================
 */

export async function PATCH(
  request: Request
) {
  try {
    const auth =
      await requireStaff()

    if (auth.error) {
      return auth.error
    }

    const {
      admin,
      user,
    } = auth

    const body =
      await request.json()

    const id =
      cleanText(body?.id)

    const status =
      cleanText(body?.status)

    const adminNotes =
      cleanText(
        body?.admin_notes
      )

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Registration ID is required.',
        },
        {
          status: 400,
        }
      )
    }

    if (
      !status ||
      !allowedStatuses.includes(
        status as RegistrationStatus
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid registration status.',
        },
        {
          status: 400,
        }
      )
    }

    const updateData: Record<
      string,
      unknown
    > = {
      status,
      admin_notes:
        adminNotes,
      reviewed_at:
        new Date().toISOString(),
      reviewed_by:
        user.id,
    }

    const {
      data,
      error,
    } = await admin
      .from('parent_registrations')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error(
        'Parent registration update error:',
        error
      )

      return NextResponse.json(
        {
          error:
            'Unable to update parent registration.',
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json(
      {
        success: true,
        registration: data,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      'Parent registration PATCH error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Invalid registration update.',
      },
      {
        status: 400,
      }
    )
  }
}

/*
 * ============================================================
 * DELETE
 *
 * Admin only.
 *
 * A registration that is already linked to a student account
 * cannot be deleted through this endpoint.
 * ============================================================
 */

export async function DELETE(
  request: Request
) {
  try {
    const auth =
      await requireStaff()

    if (auth.error) {
      return auth.error
    }

    const {
      admin,
      profile,
    } = auth

    if (profile.role !== 'admin') {
      return NextResponse.json(
        {
          error:
            'Only administrators can delete parent registrations.',
        },
        {
          status: 403,
        }
      )
    }

    const url =
      new URL(request.url)

    const id =
      cleanText(
        url.searchParams.get('id')
      )

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Registration ID is required.',
        },
        {
          status: 400,
        }
      )
    }

    const {
      data: registration,
      error: lookupError,
    } = await admin
      .from('parent_registrations')
      .select(
        'id, student_full_name, created_student_id'
      )
      .eq('id', id)
      .maybeSingle()

    if (
      lookupError ||
      !registration
    ) {
      console.error(
        'Parent registration delete lookup error:',
        lookupError
      )

      return NextResponse.json(
        {
          error:
            'Parent registration not found.',
        },
        {
          status: 404,
        }
      )
    }

    if (
      registration.created_student_id
    ) {
      return NextResponse.json(
        {
          error:
            'This registration is linked to a student account and cannot be deleted until that student link is removed.',
        },
        {
          status: 409,
        }
      )
    }

    const {
      error: deleteError,
    } = await admin
      .from('parent_registrations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error(
        'Parent registration deletion error:',
        deleteError
      )

      return NextResponse.json(
        {
          error:
            'Unable to delete parent registration.',
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message:
          `${registration.student_full_name} registration was deleted successfully.`,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      'Parent registration DELETE error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Unable to delete parent registration.',
      },
      {
        status: 500,
      }
    )
  }
}