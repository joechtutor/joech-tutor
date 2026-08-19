import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabase-server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

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

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (
      profileError ||
      profile?.role !== 'student'
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const admin = supabaseAdmin()

    /*
      Load all attempts for this student.

      submitted_at is used because the attempts
      table does not have created_at.
    */
    const {
      data: attempts,
      error: attemptsError,
    } = await admin
      .from('attempts')
      .select(
        `
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
        `
      )
      .eq('user_id', user.id)
      .order('submitted_at', {
        ascending: false,
      })

    if (attemptsError) {
      console.error(
        'Student results lookup error:',
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

    /*
      Keep ONLY the latest attempt for each
      assessment.

      This prevents repeated test attempts from
      appearing multiple times on My Results.
    */
    const latestAttemptsMap =
      new Map<string, (typeof attempts)[number]>()

    for (const attempt of attempts || []) {
      if (
        !latestAttemptsMap.has(
          attempt.assessment_id
        )
      ) {
        latestAttemptsMap.set(
          attempt.assessment_id,
          attempt
        )
      }
    }

    const latestAttempts =
      Array.from(
        latestAttemptsMap.values()
      )

    /*
      Get assessment IDs.
    */
    const assessmentIds =
      latestAttempts.map(
        (attempt) =>
          attempt.assessment_id
      )

    let assessments: Array<{
      id: string
      title: string
      subject: string
      grade: number
      duration_minutes: number
    }> = []

    if (assessmentIds.length > 0) {
      const {
        data: assessmentData,
        error: assessmentError,
      } = await admin
        .from('assessments')
        .select(
          'id, title, subject, grade, duration_minutes'
        )
        .in('id', assessmentIds)

      if (assessmentError) {
        console.error(
          'Assessment lookup error:',
          assessmentError
        )

        return NextResponse.json(
          {
            error:
              assessmentError.message ||
              'Unable to load assessments',
          },
          { status: 500 }
        )
      }

      assessments =
        assessmentData || []
    }

    /*
      Create assessment lookup map.
    */
    const assessmentMap =
      new Map(
        assessments.map(
          (assessment) => [
            assessment.id,
            assessment,
          ]
        )
      )

    /*
      Build results for the student.
    */
    const results =
      latestAttempts.map(
        (attempt) => ({
          id: attempt.id,

          assessment_id:
            attempt.assessment_id,

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
        })
      )

    return NextResponse.json({
      results,
    })
  } catch (error) {
    console.error(
      'Student results API error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load student results',
      },
      { status: 500 }
    )
  }
}