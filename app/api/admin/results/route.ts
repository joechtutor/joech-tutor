import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabase-server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

export async function GET() {
  try {
console.log(
  'SERVICE ROLE ENV:',
  process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING'
)
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

    // Check logged-in user's role
    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (
      profileError ||
      !profile ||
      !['admin', 'teacher'].includes(profile.role)
    ) {
      return NextResponse.json(
        {
          error:
            'Forbidden. Only administrators and teachers can view results.',
        },
        { status: 403 }
      )
    }

    const admin = supabaseAdmin()

    // Get all completed attempts
    const {
      data: attempts,
      error: attemptsError,
    } = await admin
      .from('attempts')
      .select(`
        id,
        assessment_id,
        user_id,
        score,
        letter,
        total_questions,
        correct_answers,
        started_at,
        submitted_at,
        teacher_comment
      `)
      .not('submitted_at', 'is', null)
      .order('submitted_at', {
        ascending: false,
      })

    if (attemptsError) {
      console.error(
        'Admin results lookup error:',
        attemptsError
      )

      return NextResponse.json(
        {
          error:
            attemptsError.message ||
            'Unable to load results',
        },
        { status: 500 }
      )
    }

    const assessmentIds = [
      ...new Set(
        (attempts || []).map(
          (attempt) => attempt.assessment_id
        )
      ),
    ]

    const userIds = [
      ...new Set(
        (attempts || []).map(
          (attempt) => attempt.user_id
        )
      ),
    ]

    // Load assessments
    let assessments: Array<{
      id: string
      title: string
      subject: string
      grade: number
      duration_minutes: number
    }> = []

    if (assessmentIds.length > 0) {
      const {
        data,
        error,
      } = await admin
        .from('assessments')
        .select(
          'id, title, subject, grade, duration_minutes'
        )
        .in('id', assessmentIds)

      if (error) {
        return NextResponse.json(
          {
            error:
              error.message ||
              'Unable to load assessments',
          },
          { status: 500 }
        )
      }

      assessments = data || []
    }

    // Load student profiles
    let profiles: Array<{
      id: string
      full_name: string | null
      email: string | null
    }> = []

    if (userIds.length > 0) {
      const {
        data,
        error,
      } = await admin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds)

      if (error) {
        console.error(
          'Profile lookup error:',
          error
        )
      }

      profiles = data || []
    }

    const assessmentMap = new Map(
      assessments.map((assessment) => [
        assessment.id,
        assessment,
      ])
    )

    const profileMap = new Map(
      profiles.map((profile) => [
        profile.id,
        profile,
      ])
    )

    const results = (attempts || []).map(
      (attempt) => ({
        id: attempt.id,
        assessment_id:
          attempt.assessment_id,
        user_id: attempt.user_id,

        score: attempt.score,
        letter: attempt.letter,

        total_questions:
          attempt.total_questions,

        correct_answers:
          attempt.correct_answers,

        started_at:
          attempt.started_at,

        submitted_at:
          attempt.submitted_at,

        teacher_comment:
          attempt.teacher_comment,

        assessment:
          assessmentMap.get(
            attempt.assessment_id
          ) || null,

        student:
          profileMap.get(
            attempt.user_id
          ) || null,
      })
    )

    return NextResponse.json({
      results,
    })
  } catch (error) {
    console.error(
      'Admin results API error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load results',
      },
      { status: 500 }
    )
  }
}