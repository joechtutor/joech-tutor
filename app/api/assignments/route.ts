import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '../../../lib/supabase-server'
import { supabaseAdmin } from '../../../lib/supabase-admin'

const AssignmentSchema = z.object({
  assessment_id: z.string().uuid(),
  student_id: z.string().uuid(),
})

/*
 * Authenticate the current user and verify
 * that the user has a valid profile.
 */
async function getCurrentUser() {
  const supabase = await supabaseServer()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error(
      'Assignment authentication error:',
      authError
    )
  }

  if (!user) {
    return {
      user: null,
      profile: null,
      errorResponse: NextResponse.json(
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
    .single()

  if (profileError || !profile) {
    console.error(
      'Assignment profile lookup error:',
      profileError
    )

    return {
      user,
      profile: null,
      errorResponse: NextResponse.json(
        {
          error: 'Profile not found',
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
    errorResponse: null,
  }
}

/*
 * GET
 *
 * Admin/Teacher:
 * Returns all assignments.
 *
 * Student:
 * Returns only assignments belonging
 * to the logged-in student.
 */
export async function GET() {
  try {
    const auth = await getCurrentUser()

    if (auth.errorResponse) {
      return auth.errorResponse
    }

    const admin = supabaseAdmin()

    let studentId: string | null = null

    /*
     * If this is a student, find the
     * corresponding student record.
     */
    if (auth.profile?.role === 'student') {
      const {
        data: student,
        error: studentError,
      } = await admin
        .from('students')
        .select('id, grade')
        .eq('profile_id', auth.user!.id)
        .single()

      if (studentError || !student) {
        console.error(
          'Student lookup error:',
          studentError
        )

        return NextResponse.json(
          {
            error: 'Student profile not found',
          },
          {
            status: 404,
          }
        )
      }

      studentId = student.id
    }

    /*
     * Get assignments.
     */
    let assignmentsQuery = admin
      .from('assessment_assignments')
      .select(
        'assessment_id, student_id, assigned_by, assigned_at'
      )
      .order('assigned_at', {
        ascending: false,
      })

    if (studentId) {
      assignmentsQuery =
        assignmentsQuery.eq(
          'student_id',
          studentId
        )
    }

    const {
      data: assignments,
      error: assignmentsError,
    } = await assignmentsQuery

    if (assignmentsError) {
      console.error(
        'Assignment list error:',
        assignmentsError
      )

      return NextResponse.json(
        {
          error: assignmentsError.message,
        },
        {
          status: 400,
        }
      )
    }

    if (
      !assignments ||
      assignments.length === 0
    ) {
      return NextResponse.json(
        {
          assignments: [],
        },
        {
          status: 200,
        }
      )
    }

    /*
     * Get unique assessment IDs.
     */
    const assessmentIds = [
      ...new Set(
        assignments.map(
          (assignment) =>
            assignment.assessment_id
        )
      ),
    ]

    /*
     * Load assessments.
     */
    const {
      data: assessments,
      error: assessmentsError,
    } = await admin
      .from('assessments')
      .select(
        'id, title, subject, grade, duration_minutes'
      )
      .in(
        'id',
        assessmentIds
      )

    if (assessmentsError) {
      console.error(
        'Assessment lookup error:',
        assessmentsError
      )

      return NextResponse.json(
        {
          error:
            assessmentsError.message,
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Load assessment questions so we
     * can calculate question counts.
     */
    const {
      data: assessmentQuestions,
      error:
        assessmentQuestionsError,
    } = await admin
      .from('assessment_questions')
      .select(
        'assessment_id, question_id'
      )
      .in(
        'assessment_id',
        assessmentIds
      )

    if (assessmentQuestionsError) {
      console.error(
        'Assessment questions error:',
        assessmentQuestionsError
      )

      return NextResponse.json(
        {
          error:
            assessmentQuestionsError.message,
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Load students.
     */
    const studentIds = [
      ...new Set(
        assignments.map(
          (assignment) =>
            assignment.student_id
        )
      ),
    ]

    const {
      data: students,
      error: studentsError,
    } = await admin
      .from('students')
      .select(
        'id, profile_id, grade'
      )
      .in(
        'id',
        studentIds
      )

    if (studentsError) {
      console.error(
        'Students lookup error:',
        studentsError
      )

      return NextResponse.json(
        {
          error:
            studentsError.message,
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Load student profiles.
     */
    const profileIds = [
      ...new Set(
        (students || [])
          .map(
            (student) =>
              student.profile_id
          )
          .filter(Boolean)
      ),
    ]

    let profiles: {
      id: string
      full_name: string | null
    }[] = []

    if (profileIds.length > 0) {
      const {
        data: profileData,
        error: profilesError,
      } = await admin
        .from('profiles')
        .select(
          'id, full_name'
        )
        .in(
          'id',
          profileIds
        )

      if (profilesError) {
        console.error(
          'Profiles lookup error:',
          profilesError
        )
      } else {
        profiles =
          profileData || []
      }
    }

    /*
     * Create lookup maps.
     */
    const assessmentMap =
      new Map(
        (assessments || []).map(
          (assessment) => [
            assessment.id,
            assessment,
          ]
        )
      )

    const questionCountMap =
      new Map<string, number>()

    for (
      const item of
        assessmentQuestions || []
    ) {
      questionCountMap.set(
        item.assessment_id,
        (
          questionCountMap.get(
            item.assessment_id
          ) || 0
        ) + 1
      )
    }

    const studentMap =
      new Map(
        (students || []).map(
          (student) => [
            student.id,
            student,
          ]
        )
      )

    const profileMap =
      new Map(
        profiles.map(
          (profile) => [
            profile.id,
            profile,
          ]
        )
      )

    /*
     * Build final response.
     */
    const result =
      assignments.map(
        (assignment) => {
          const assessment =
            assessmentMap.get(
              assignment.assessment_id
            )

          const student =
            studentMap.get(
              assignment.student_id
            )

          const profile =
            student
              ? profileMap.get(
                  student.profile_id
                )
              : null

          return {
            assessment_id:
              assignment.assessment_id,

            student_id:
              assignment.student_id,

            assigned_by:
              assignment.assigned_by,

            assigned_at:
              assignment.assigned_at,

            assessment_title:
              assessment?.title ||
              'Assessment',

            subject:
              assessment?.subject ||
              '-',

            grade:
              assessment?.grade ??
              student?.grade ??
              null,

            duration_minutes:
              assessment?.duration_minutes ??
              null,

            question_count:
              questionCountMap.get(
                assignment.assessment_id
              ) || 0,

            student_name:
              profile?.full_name ||
              'Student',

            student_email:
              null,
          }
        }
      )

    return NextResponse.json(
      {
        assignments: result,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      'Assignment GET error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      {
        status: 500,
      }
    )
  }
}

/*
 * POST
 *
 * Admin/Teacher only.
 */
export async function POST(
  req: Request
) {
  try {
    const auth =
      await getCurrentUser()

    if (auth.errorResponse) {
      return auth.errorResponse
    }

    if (
      !['admin', 'teacher'].includes(
        auth.profile?.role || ''
      )
    ) {
      return NextResponse.json(
        {
          error: 'Forbidden',
        },
        {
          status: 403,
        }
      )
    }

    const body =
      AssignmentSchema.safeParse(
        await req.json()
      )

    if (!body.success) {
      return NextResponse.json(
        {
          error:
            'Invalid assignment information',
          details:
            body.error.flatten(),
        },
        {
          status: 400,
        }
      )
    }

    const {
      assessment_id,
      student_id,
    } = body.data

    const admin =
      supabaseAdmin()

    /*
     * Verify student.
     */
    const {
      data: student,
      error: studentError,
    } = await admin
      .from('students')
      .select(
        'id, grade'
      )
      .eq(
        'id',
        student_id
      )
      .single()

    if (
      studentError ||
      !student
    ) {
      return NextResponse.json(
        {
          error:
            'Student not found',
        },
        {
          status: 404,
        }
      )
    }

    /*
     * Verify assessment.
     */
    const {
      data: assessment,
      error:
        assessmentError,
    } = await admin
      .from('assessments')
      .select(
        'id, grade, title'
      )
      .eq(
        'id',
        assessment_id
      )
      .single()

    if (
      assessmentError ||
      !assessment
    ) {
      return NextResponse.json(
        {
          error:
            'Assessment not found',
        },
        {
          status: 404,
        }
      )
    }

    /*
     * Ensure grades match.
     */
    if (
      student.grade !==
      assessment.grade
    ) {
      return NextResponse.json(
        {
          error:
            'The student grade does not match the assessment grade.',
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Create assignment.
     */
    const {
      data: assignment,
      error:
        assignmentError,
    } = await admin
      .from(
        'assessment_assignments'
      )
      .insert({
        assessment_id,
        student_id,
        assigned_by:
          auth.user!.id,
      })
      .select()
      .single()

    if (assignmentError) {
      if (
        assignmentError.code ===
        '23505'
      ) {
        return NextResponse.json(
          {
            error:
              'This assessment is already assigned to this student.',
          },
          {
            status: 409,
          }
        )
      }

      return NextResponse.json(
        {
          error:
            assignmentError.message,
        },
        {
          status: 400,
        }
      )
    }

    return NextResponse.json(
      {
        message:
          'Assessment assigned successfully',
        assignment,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(
      'Assignment POST error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      {
        status: 500,
      }
    )
  }
}