import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabase-server'

export async function GET() {
  try {
    const supabase = await supabaseServer()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401 }
      )
    }

    const {
      data: student,
      error: studentError,
    } = await supabase
      .from('students')
      .select('id, grade')
      .eq('profile_id', user.id)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student profile not found.' },
        { status: 404 }
      )
    }

    const {
      data: assignments,
      error: assignmentError,
    } = await supabase
      .from('assessment_assignments')
      .select(
        'assessment_id, assigned_at'
      )
      .eq('student_id', student.id)

    if (assignmentError) {
      console.error(
        'Student assessment assignment error:',
        assignmentError
      )

      return NextResponse.json(
        {
          error:
            assignmentError.message,
        },
        { status: 400 }
      )
    }

    if (
      !assignments ||
      assignments.length === 0
    ) {
      return NextResponse.json({
        assessments: [],
      })
    }

    const assessmentIds =
      assignments.map(
        (assignment) =>
          assignment.assessment_id
      )

    const {
      data: assessments,
      error: assessmentError,
    } = await supabase
      .from('assessments')
      .select(
        'id, title, subject, grade, duration_minutes'
      )
      .in(
        'id',
        assessmentIds
      )

    if (assessmentError) {
      console.error(
        'Student assessment error:',
        assessmentError
      )

      return NextResponse.json(
        {
          error:
            assessmentError.message,
        },
        { status: 400 }
      )
    }

    const result =
      (assessments || []).map(
        (assessment) => {
          const assignment =
            assignments.find(
              (item) =>
                item.assessment_id ===
                assessment.id
            )

          return {
            id: assessment.id,
            title: assessment.title,
            subject:
              assessment.subject,
            grade: assessment.grade,
            duration_minutes:
              assessment.duration_minutes,
            assigned_at:
              assignment?.assigned_at ||
              null,
          }
        }
      )

    return NextResponse.json({
      assessments: result,
    })
  } catch (error) {
    console.error(
      'Student assessments API error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.',
      },
      { status: 500 }
    )
  }
}