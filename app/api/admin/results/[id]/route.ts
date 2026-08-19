import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../../lib/supabase-server'
import { supabaseAdmin } from '../../../../../lib/supabase-admin'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        {
          error: 'Result ID is required.',
        },
        { status: 400 }
      )
    }

    const supabase = await supabaseServer()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthenticated',
        },
        { status: 401 }
      )
    }

    /*
      Check user role
    */
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (
      profileError ||
      !profile ||
      !['admin', 'teacher'].includes(
        profile.role
      )
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

    /*
      Load attempt
    */
    const {
      data: attempt,
      error: attemptError,
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
      .eq('id', id)
      .single()

    if (attemptError || !attempt) {
      console.error(
        'Attempt lookup error:',
        attemptError
      )

      return NextResponse.json(
        {
          error:
            attemptError?.message ||
            'Result not found.',
        },
        { status: 404 }
      )
    }

    /*
      Load assessment
    */
    const {
      data: assessment,
      error: assessmentError,
    } = await admin
      .from('assessments')
      .select(`
        id,
        title,
        subject,
        grade,
        duration_minutes
      `)
      .eq('id', attempt.assessment_id)
      .single()

    if (assessmentError || !assessment) {
      console.error(
        'Assessment lookup error:',
        assessmentError
      )

      return NextResponse.json(
        {
          error:
            assessmentError?.message ||
            'Assessment not found.',
        },
        { status: 404 }
      )
    }

    /*
      Load student profile
    */
    const {
      data: student,
      error: studentError,
    } = await admin
      .from('profiles')
      .select(`
        id,
        full_name,
        email
      `)
      .eq('id', attempt.user_id)
      .single()

    if (studentError) {
      console.error(
        'Student profile lookup error:',
        studentError
      )
    }

    /*
      Load assessment question IDs.

      IMPORTANT:
      assessment_questions does NOT contain
      question_order, so we only select
      question_id.
    */
    const {
      data: assessmentQuestions,
      error: assessmentQuestionsError,
    } = await admin
      .from('assessment_questions')
      .select('question_id')
      .eq(
        'assessment_id',
        attempt.assessment_id
      )

    if (assessmentQuestionsError) {
      console.error(
        'Assessment questions lookup error:',
        assessmentQuestionsError
      )

      return NextResponse.json(
        {
          error:
            assessmentQuestionsError.message ||
            'Unable to load assessment questions.',
        },
        { status: 500 }
      )
    }

    const questionIds =
      (assessmentQuestions || []).map(
        (item) => item.question_id
      )

    /*
      Load questions
    */
    let questionsData: Array<{
      id: string
      prompt: string
      options: string[] | null
      correct_option: number
      topic: string | null
      difficulty: string | null
      explanation: string | null
    }> = []

    if (questionIds.length > 0) {
      const {
        data,
        error,
      } = await admin
        .from('questions')
        .select(`
          id,
          prompt,
          options,
          correct_option,
          topic,
          difficulty,
          explanation
        `)
        .in('id', questionIds)

      if (error) {
        console.error(
          'Questions lookup error:',
          error
        )

        return NextResponse.json(
          {
            error:
              error.message ||
              'Unable to load questions.',
          },
          { status: 500 }
        )
      }

      questionsData = data || []
    }

    /*
      Load student's answers
    */
    const {
      data: answers,
      error: answersError,
    } = await admin
      .from('attempt_answers')
      .select(`
        question_id,
        selected_option
      `)
      .eq('attempt_id', attempt.id)

    if (answersError) {
      console.error(
        'Attempt answers lookup error:',
        answersError
      )
    }

    const answerMap = new Map<
      string,
      number | null
    >()

    ;(answers || []).forEach(
      (answer) => {
        answerMap.set(
          answer.question_id,
          answer.selected_option
        )
      }
    )

    const questionMap = new Map(
      questionsData.map((question) => [
        question.id,
        question,
      ])
    )

    /*
      Build final question review
    */
    const questions = questionIds
      .map((questionId) => {
        const question =
          questionMap.get(questionId)

        if (!question) {
          return null
        }

        const selectedOption =
          answerMap.has(question.id)
            ? answerMap.get(question.id) ?? null
            : null

        return {
          id: question.id,

          prompt: question.prompt,

          options:
            question.options || [],

          correct_option:
            question.correct_option,

          topic:
            question.topic,

          difficulty:
            question.difficulty,

          explanation:
            question.explanation,

          selected_option:
            selectedOption,

          is_correct:
            selectedOption !== null &&
            selectedOption ===
              question.correct_option,
        }
      })
      .filter(
        (
          question
        ): question is NonNullable<
          typeof question
        > =>
          question !== null
      )

    return NextResponse.json({
      attempt,
      assessment,
      student: student || null,
      questions,
    })
  } catch (error) {
    console.error(
      'Admin detailed result API error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load result.',
      },
      { status: 500 }
    )
  }
}