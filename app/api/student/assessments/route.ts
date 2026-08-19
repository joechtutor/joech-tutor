import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabase-server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

export async function GET() {
  try {
    const s = await supabaseServer()

    const {
      data: { user },
    } = await s.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } =
      await s
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

    if (profile?.role !== 'student') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const admin = supabaseAdmin()

    const { data: student, error: studentError } =
      await admin
        .from('students')
        .select('id, grade')
        .eq('profile_id', user.id)
        .single()

    if (studentError || !student) {
      return NextResponse.json(
        {
          error:
            studentError?.message ||
            'Student record not found',
        },
        { status: 404 }
      )
    }

    const {
      data: assignments,
      error: assignmentsError,
    } = await admin
      .from('assessment_assignments')
      .select(
        'assessment_id, assigned_at, assessments(id, title, subject, grade, duration_minutes)'
      )
      .eq('student_id', student.id)
      .order('assigned_at', {
        ascending: false,
      })

    if (assignmentsError) {
      return NextResponse.json(
        { error: assignmentsError.message },
        { status: 400 }
      )
    }

    const assessments = (assignments || [])
      .map((assignment: any) => {
        const assessment = Array.isArray(
          assignment.assessments
        )
          ? assignment.assessments[0]
          : assignment.assessments

        if (!assessment) {
          return null
        }

        return {
          id: assessment.id,
          title: assessment.title,
          subject: assessment.subject,
          grade: assessment.grade,
          duration_minutes:
            assessment.duration_minutes,
          assigned_at: assignment.assigned_at,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      assessments,
    })
  } catch (error) {
    console.error(
      'Student assessments error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load student assessments',
      },
      { status: 500 }
    )
  }
}