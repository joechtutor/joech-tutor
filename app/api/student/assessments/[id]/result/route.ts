import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../../../lib/supabase-server'
import { supabaseAdmin } from '../../../../../../lib/supabase-admin'

export async function GET(req: Request) {
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

    const { data: profile } = await s
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'student') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)

    const assessmentId =
      parts[parts.length - 2]

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID is missing' },
        { status: 400 }
      )
    }

    const admin = supabaseAdmin()

    const { data: attempt, error: attemptError } =
      await admin
        .from('attempts')
        .select(
          'id, assessment_id, score, letter, total_questions, correct_answers, submitted_at'
        )
        .eq('assessment_id', assessmentId)
        .eq('user_id', user.id)
        .order('submitted_at', {
          ascending: false,
        })
        .limit(1)
        .maybeSingle()

    if (attemptError) {
      return NextResponse.json(
        { error: attemptError.message },
        { status: 400 }
      )
    }

    if (!attempt) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      result: {
        score: attempt.score,
        letter: attempt.letter,
        totalQuestions:
          attempt.total_questions,
        correctAnswers:
          attempt.correct_answers,
        submittedAt:
          attempt.submitted_at,
      },
    })
  } catch (error) {
    console.error(
      'Assessment result error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load assessment result',
      },
      { status: 500 }
    )
  }
}