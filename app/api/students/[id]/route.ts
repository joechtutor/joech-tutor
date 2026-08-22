import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabase-server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

export async function GET(
  _req: Request,
  context: {
    params: Promise<{ id: string }>
  }
) {
  try {
    const supabase = await supabaseServer()

    /*
     * CHECK AUTHENTICATION
     */
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthenticated',
        },
        {
          status: 401,
        }
      )
    }

    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        {
          error: 'Student ID is required',
        },
        {
          status: 400,
        }
      )
    }

    const admin = supabaseAdmin()

    /*
     * CHECK CURRENT USER PROFILE
     */
    const {
      data: currentProfile,
      error: currentProfileError,
    } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (
      currentProfileError ||
      !currentProfile
    ) {
      console.error(
        'Current profile error:',
        currentProfileError
      )

      return NextResponse.json(
        {
          error: 'User profile not found',
        },
        {
          status: 404,
        }
      )
    }

    /*
     * ONLY ADMIN AND TEACHER CAN VIEW
     * STUDENT PERFORMANCE
     */
    if (
      !['admin', 'teacher'].includes(
        currentProfile.role
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

    /*
     * GET STUDENT
     *
     * students.id is the student record ID.
     * students.profile_id connects to profiles.id.
     */
    const {
      data: student,
      error: studentError,
    } = await admin
      .from('students')
      .select(
        'id, profile_id, grade, created_at'
      )
      .eq('id', id)
      .single()

    if (
      studentError ||
      !student
    ) {
      console.error(
        'Student lookup error:',
        studentError
      )

      return NextResponse.json(
        {
          error: 'Student not found',
        },
        {
          status: 404,
        }
      )
    }

    /*
     * GET STUDENT PROFILE
     *
     * IMPORTANT:
     * The profiles table does NOT contain email.
     * Email belongs to the Supabase Auth user.
     */
    const {
      data: profile,
      error: profileError,
    } = await admin
      .from('profiles')
      .select(
        'id, full_name, role'
      )
      .eq('id', student.profile_id)
      .single()

    if (profileError) {
      console.error(
        'Student profile lookup error:',
        profileError
      )
    }

    /*
     * GET STUDENT EMAIL FROM SUPABASE AUTH
     */
    let studentEmail: string | null = null

    try {
      const {
        data: authUser,
        error: authUserError,
      } = await admin.auth.admin.getUserById(
        student.profile_id
      )

      if (authUserError) {
        console.error(
          'Student auth lookup error:',
          authUserError
        )
      } else {
        studentEmail =
          authUser.user?.email || null
      }
    } catch (error) {
      console.error(
        'Student email lookup error:',
        error
      )
    }

    /*
     * BUILD STUDENT OBJECT
     */
    const studentResult = {
      id: student.id,

      full_name:
        profile?.full_name || null,

      email:
        studentEmail,

      grade:
        student.grade || null,

      created_at:
        student.created_at || null,
    }

    /*
     * GET COMPLETED ATTEMPTS
     *
     * attempts.user_id refers to the student's
     * profile/auth user ID.
     */
    const {
      data: attemptsData,
      error: attemptsError,
    } = await admin
      .from('attempts')
      .select(`
        id,
        score,
        letter,
        total_questions,
        correct_answers,
        submitted_at,
        assessment_id
      `)
      .eq(
        'user_id',
        student.profile_id
      )
      .order('submitted_at', {
        ascending: false,
      })

    if (attemptsError) {
      console.error(
        'Attempts lookup error:',
        attemptsError
      )
    }

    /*
     * GET ASSESSMENTS USED BY COMPLETED ATTEMPTS
     */
    const attemptAssessmentIds =
      Array.from(
        new Set(
          (attemptsData || [])
            .map(
              (attempt) =>
                attempt.assessment_id
            )
            .filter(Boolean)
        )
      )

    let attemptAssessments: Array<{
      id: string
      title: string
      subject: string
      grade: number
    }> = []

    if (
      attemptAssessmentIds.length > 0
    ) {
      const {
        data,
        error,
      } = await admin
        .from('assessments')
        .select(
          'id, title, subject, grade'
        )
        .in(
          'id',
          attemptAssessmentIds
        )

      if (error) {
        console.error(
          'Attempt assessments error:',
          error
        )
      } else {
        attemptAssessments =
          data || []
      }
    }

    /*
     * BUILD COMPLETED ASSESSMENTS
     *
     * This matches exactly what the
     * Student Profile page expects.
     */
    const completedAssessments =
      (attemptsData || []).map(
        (attempt) => {
          const assessment =
            attemptAssessments.find(
              (item) =>
                item.id ===
                attempt.assessment_id
            )

          return {
            id: attempt.id,

            title:
              assessment?.title ||
              'Assessment',

            subject:
              assessment?.subject ||
              'N/A',

            score:
              Number(attempt.score) || 0,

            letter:
              attempt.letter || 'F',

            submitted_at:
              attempt.submitted_at ||
              null,
          }
        }
      )

    /*
     * GET ASSIGNED ASSESSMENTS
     */
    const {
      data: assignmentsData,
      error: assignmentsError,
    } = await admin
      .from('assessment_assignments')
      .select(
        'assessment_id, student_id, assigned_at'
      )
      .eq(
        'student_id',
        student.id
      )
      .order('assigned_at', {
        ascending: false,
      })

    if (assignmentsError) {
      console.error(
        'Assignments lookup error:',
        assignmentsError
      )
    }

    /*
     * GET ASSESSMENT INFORMATION
     * FOR ASSIGNMENTS
     */
    const assignmentAssessmentIds =
      Array.from(
        new Set(
          (assignmentsData || [])
            .map(
              (assignment) =>
                assignment.assessment_id
            )
            .filter(Boolean)
        )
      )

    let assignmentAssessments: Array<{
      id: string
      title: string
      subject: string
      grade: number
      duration_minutes?: number
    }> = []

    if (
      assignmentAssessmentIds.length > 0
    ) {
      const {
        data,
        error,
      } = await admin
        .from('assessments')
        .select(`
          id,
          title,
          subject,
          grade,
          duration_minutes
        `)
        .in(
          'id',
          assignmentAssessmentIds
        )

      if (error) {
        console.error(
          'Assignment assessments error:',
          error
        )
      } else {
        assignmentAssessments =
          data || []
      }
    }

    /*
     * BUILD ASSIGNED ASSESSMENTS
     *
     * This matches exactly what the
     * Student Profile page expects.
     */
    const assignedAssessments =
      (assignmentsData || [])
        .map(
          (assignment) => {
            const assessment =
              assignmentAssessments.find(
                (item) =>
                  item.id ===
                  assignment.assessment_id
              )

            if (!assessment) {
              return null
            }

            return {
              id: assessment.id,

              title:
                assessment.title,

              subject:
                assessment.subject,

              grade:
                assessment.grade,

              assigned_at:
                assignment.assigned_at,
            }
          }
        )
        .filter(
          (
            item
          ): item is {
            id: string
            title: string
            subject: string
            grade: number
            assigned_at: string
          } =>
            item !== null
        )

    /*
     * PERFORMANCE CALCULATIONS
     */
    const scores =
      completedAssessments.map(
        (assessment) =>
          Number(
            assessment.score
          ) || 0
      )

    const completed =
      scores.length

    const totalScore =
      scores.reduce(
        (sum, score) =>
          sum + score,
        0
      )

    const averageScore =
      completed > 0
        ? Math.round(
            totalScore /
              completed
          )
        : 0

    const highestScore =
      completed > 0
        ? Math.max(...scores)
        : 0

    const lowestScore =
      completed > 0
        ? Math.min(...scores)
        : 0

    /*
     * A PASS IS 50% OR ABOVE.
     *
     * This matches the result pattern
     * currently used in the system.
     */
    const passed =
      scores.filter(
        (score) =>
          score >= 50
      ).length

    const failed =
      scores.filter(
        (score) =>
          score < 50
      ).length

    const passRate =
      completed > 0
        ? Math.round(
            (passed /
              completed) *
              100
          )
        : 0

    const performance = {
      assigned:
        assignedAssessments.length,

      completed,

      average_score:
        averageScore,

      highest_score:
        highestScore,

      lowest_score:
        lowestScore,

      passed,

      failed,

      pass_rate:
        passRate,
    }

    /*
     * RETURN DATA
     *
     * The structure here matches
     * dashboard/students/[id]/page.tsx
     */
    return NextResponse.json(
      {
        student:
          studentResult,

        assignedAssessments,

        completedAssessments,

        performance,
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      'Student profile API error:',
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
