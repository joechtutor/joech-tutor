import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../../../lib/supabase-server'
import { supabaseAdmin } from '../../../../../../lib/supabase-admin'

export async function POST(req: Request) {
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

    const assessmentId = parts[parts.length - 2]

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'Assessment ID is missing' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const answers = body.answers

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Answers are required' },
        { status: 400 }
      )
    }

    const admin = supabaseAdmin()

    const { data: student, error: studentError } =
      await admin
        .from('students')
        .select('id')
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
      data: assignment,
      error: assignmentError,
    } = await admin
      .from('assessment_assignments')
      .select('assessment_id, student_id')
      .eq('assessment_id', assessmentId)
      .eq('student_id', student.id)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json(
        {
          error:
            assignmentError?.message ||
            'Assessment is not assigned to this student',
        },
        { status: 403 }
      )
    }

    const {
      data: assessment,
      error: assessmentError,
    } = await admin
      .from('assessments')
      .select('id, title')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        {
          error:
            assessmentError?.message ||
            'Assessment not found',
        },
        { status: 404 }
      )
    }

    const {
      data: assessmentQuestions,
      error: questionsError,
    } = await admin
      .from('assessment_questions')
      .select('question_id, position')
      .eq('assessment_id', assessmentId)
      .order('position', { ascending: true })

    if (questionsError) {
      return NextResponse.json(
        { error: questionsError.message },
        { status: 400 }
      )
    }

    const questionIds =
      assessmentQuestions?.map(
        (item) => item.question_id
      ) || []

    if (questionIds.length === 0) {
      return NextResponse.json(
        {
          error:
            'No questions found for this assessment',
        },
        { status: 400 }
      )
    }

    const {
      data: questions,
      error: questionsFetchError,
    } = await admin
      .from('questions')
      .select('id, correct_option')
      .in('id', questionIds)

    if (questionsFetchError) {
      return NextResponse.json(
        { error: questionsFetchError.message },
        { status: 400 }
      )
    }

    let correctAnswers = 0

    for (const question of questions || []) {
      const selectedAnswer =
        answers[question.id]

      if (
        selectedAnswer !== undefined &&
        selectedAnswer !== null &&
        Number(selectedAnswer) ===
          Number(question.correct_option)
      ) {
        correctAnswers++
      }
    }

    const totalQuestions = questionIds.length

    const score =
      totalQuestions > 0
        ? Math.round(
            (correctAnswers / totalQuestions) * 100
          )
        : 0

    let letter = 'F'

    if (score >= 80) {
      letter = 'A'
    } else if (score >= 70) {
      letter = 'B'
    } else if (score >= 60) {
      letter = 'C'
    } else if (score >= 50) {
      letter = 'D'
    }

    const {
      data: attempt,
      error: attemptError,
    } = await admin
      .from('attempts')
      .insert({
        assessment_id: assessmentId,
        user_id: user.id,
        score,
        letter,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
      })
      .select()
      .single()

    if (attemptError) {
      return NextResponse.json(
        { error: attemptError.message },
        { status: 400 }
      )
    }

    /*
      Save each student's selected answer.
    */
    const answerRows = questionIds.map(
      (questionId) => {
        const question = questions?.find(
          (question) =>
            question.id === questionId
        )

        const selectedOption = Number(
          answers[questionId]
        )

        const isCorrect =
          question &&
          selectedOption ===
            Number(question.correct_option)

        return {
          attempt_id: attempt.id,
          question_id: questionId,
          selected_option: selectedOption,
          is_correct: Boolean(isCorrect),
        }
      }
    )

    const {
      error: answersInsertError,
    } = await admin
      .from('attempt_answers')
      .insert(answerRows)

    if (answersInsertError) {
      console.error(
        'Saving attempt answers error:',
        answersInsertError
      )

      return NextResponse.json(
        {
          error:
            'Assessment was scored, but the student answers could not be saved.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      attempt,
      score,
      letter,
      totalQuestions,
      correctAnswers,
    })
  } catch (error) {
    console.error(
      'Submit assessment error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to submit assessment',
      },
      { status: 500 }
    )
  }
}