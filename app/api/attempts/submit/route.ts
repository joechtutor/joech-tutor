import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '../../../../lib/supabase-server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

const SubmitAttemptSchema = z.object({
  assessment_id: z.string().uuid(),
  answers: z.record(
    z.string().uuid(),
    z.string()
  ),
})

function getLetter(score: number) {
  if (score >= 70) return 'A'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error(
        'Authentication error:',
        authError
      )
    }

    if (!user) {
      return NextResponse.json(
        {
          error:
            'Unauthenticated. Please log in again.',
        },
        { status: 401 }
      )
    }

    const body =
      SubmitAttemptSchema.safeParse(
        await req.json()
      )

    if (!body.success) {
      return NextResponse.json(
        {
          error:
            'Invalid submission information',
          details:
            body.error.flatten(),
        },
        { status: 400 }
      )
    }

    const {
      assessment_id,
      answers,
    } = body.data

    const admin = supabaseAdmin()

    /*
     * Confirm the logged-in user is a student.
     */
    const {
      data: profile,
      error: profileError,
    } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (
      profileError ||
      !profile
    ) {
      console.error(
        'Profile lookup error:',
        profileError
      )

      return NextResponse.json(
        {
          error:
            'User profile not found.',
        },
        { status: 404 }
      )
    }

    if (profile.role !== 'student') {
      return NextResponse.json(
        {
          error:
            'Only students can submit assessments.',
        },
        { status: 403 }
      )
    }

    /*
     * Find the student belonging
     * to the logged-in user.
     */
    const {
      data: student,
      error: studentError,
    } = await admin
      .from('students')
      .select(
        'id, profile_id, grade'
      )
      .eq(
        'profile_id',
        user.id
      )
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
          error:
            'Student profile not found.',
        },
        { status: 404 }
      )
    }

    /*
     * Confirm that the assessment
     * is assigned to this student.
     */
    const {
      data: assignment,
      error: assignmentError,
    } = await admin
      .from('assessment_assignments')
      .select(
        'assessment_id, student_id'
      )
      .eq(
        'assessment_id',
        assessment_id
      )
      .eq(
        'student_id',
        student.id
      )
      .maybeSingle()

    if (assignmentError) {
      console.error(
        'Assignment lookup error:',
        assignmentError
      )

      return NextResponse.json(
        {
          error:
            'Unable to verify assessment assignment.',
        },
        { status: 500 }
      )
    }

    if (!assignment) {
      return NextResponse.json(
        {
          error:
            'This assessment is not assigned to you.',
        },
        { status: 403 }
      )
    }

    /*
     * Get the questions belonging
     * to this assessment.
     */
    const {
      data: assessmentQuestions,
      error:
        assessmentQuestionsError,
    } = await admin
      .from('assessment_questions')
      .select(
        'question_id, position'
      )
      .eq(
        'assessment_id',
        assessment_id
      )
      .order(
        'position',
        {
          ascending: true,
        }
      )

    if (
      assessmentQuestionsError
    ) {
      console.error(
        'Assessment questions error:',
        assessmentQuestionsError
      )

      return NextResponse.json(
        {
          error:
            'Unable to load assessment questions.',
          details:
            assessmentQuestionsError.message,
        },
        { status: 500 }
      )
    }

    if (
      !assessmentQuestions ||
      assessmentQuestions.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'No questions were found for this assessment.',
        },
        { status: 404 }
      )
    }

    /*
     * Extract question IDs.
     */
    const questionIds =
      assessmentQuestions.map(
        (item) =>
          item.question_id
      )

    /*
     * Load the correct answers.
     *
     * Your database stores the correct
     * answer as correct_option, which is
     * the option number/index.
     */
    const {
      data: questions,
      error: questionsError,
    } = await admin
      .from('questions')
      .select(
        'id, options, correct_option'
      )
      .in(
        'id',
        questionIds
      )

    if (questionsError) {
      console.error(
        'Questions table error:',
        questionsError
      )

      return NextResponse.json(
        {
          error:
            'Unable to load questions.',
          details:
            questionsError.message,
        },
        { status: 500 }
      )
    }

    /*
     * Calculate correct answers.
     */
    let correctAnswers = 0

    for (
      const question of
        questions || []
    ) {
      const studentAnswer =
        answers[question.id]

      if (
        studentAnswer === undefined
      ) {
        continue
      }

      const options =
        Array.isArray(
          question.options
        )
          ? question.options
          : []

      const correctIndex =
        Number(
          question.correct_option
        )

      const correctAnswer =
        options[
          correctIndex
        ]

      if (
        correctAnswer !==
          undefined &&
        String(
          studentAnswer
        )
          .trim()
          .toLowerCase() ===
          String(
            correctAnswer
          )
            .trim()
            .toLowerCase()
      ) {
        correctAnswers++
      }
    }

    const totalQuestions =
      assessmentQuestions.length

    /*
     * Calculate percentage score.
     */
    const score =
      totalQuestions > 0
        ? Math.round(
            (correctAnswers /
              totalQuestions) *
              100
          )
        : 0

    /*
     * Calculate letter grade.
     */
    const letter =
      getLetter(score)

    /*
     * Save the completed attempt.
     *
     * IMPORTANT:
     * The database uses user_id,
     * not student_id.
     */
    const {
      data: attempt,
      error: attemptError,
    } = await admin
      .from('attempts')
      .insert({
        assessment_id,
        user_id: user.id,
        score,
        letter,
        total_questions:
          totalQuestions,
        correct_answers:
          correctAnswers,
      })
      .select()
      .single()

    if (attemptError) {
      console.error(
        'Attempt save error:',
        attemptError
      )

      return NextResponse.json(
        {
          error:
            'Unable to save assessment attempt.',
          details:
            attemptError.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Assessment submitted successfully',
        attempt,
        score,
        letter,
        total_questions:
          totalQuestions,
        correct_answers:
          correctAnswers,
        percentage: score,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'Attempt submission error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}