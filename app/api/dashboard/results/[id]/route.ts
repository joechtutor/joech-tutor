import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../../lib/supabase-server'
import { supabaseAdmin } from '../../../../../lib/supabase-admin'

type StudentProfile = {
  id: string
  full_name: string | null
}

export async function GET(
  req: Request
) {
  try {
    const supabase =
      await supabaseServer()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (
      authError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            'Unauthenticated. Please log in again.',
        },
        { status: 401 }
      )
    }

    const admin =
      supabaseAdmin()

    /*
     * Get the logged-in user's profile.
     */
    const {
      data: profile,
      error: profileError,
    } = await admin
      .from('profiles')
      .select(
        'id, full_name, role'
      )
      .eq(
        'id',
        user.id
      )
      .single()

    if (
      profileError ||
      !profile
    ) {
      return NextResponse.json(
        {
          error:
            'User profile not found',
        },
        { status: 404 }
      )
    }

    /*
     * Get the result/attempt ID
     * from the URL.
     */
    const url =
      new URL(req.url)

    const parts =
      url.pathname
        .split('/')
        .filter(Boolean)

    const resultId =
      parts[parts.length - 1]

    if (!resultId) {
      return NextResponse.json(
        {
          error:
            'Result ID is missing',
        },
        { status: 400 }
      )
    }

    /*
     * Load the attempt directly.
     */
    const {
      data: attempt,
      error: attemptError,
    } = await admin
      .from('attempts')
      .select(
        `
        id,
        assessment_id,
        student_id,
        score,
        total_questions,
        submitted_at
        `
      )
      .eq(
        'id',
        resultId
      )
      .single()

    if (
      attemptError ||
      !attempt
    ) {
      console.error(
        'Attempt lookup error:',
        attemptError
      )

      return NextResponse.json(
        {
          error:
            attemptError?.message ||
            'Result not found',
        },
        { status: 404 }
      )
    }

    /*
     * Find the student record belonging
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
      .maybeSingle()

    /*
     * Students may only view their
     * own assessment result.
     */
    if (
      profile.role === 'student'
    ) {
      if (
        studentError ||
        !student ||
        student.id !==
          attempt.student_id
      ) {
        return NextResponse.json(
          {
            error:
              'You are not authorized to view this result.',
          },
          { status: 403 }
        )
      }
    }

    /*
     * Admins and teachers can view
     * any result.
     */
    if (
      profile.role !== 'student' &&
      profile.role !== 'admin' &&
      profile.role !== 'teacher'
    ) {
      return NextResponse.json(
        {
          error:
            'Forbidden',
        },
        { status: 403 }
      )
    }

    /*
     * Load the assessment directly.
     */
    const {
      data: assessment,
      error: assessmentError,
    } = await admin
      .from('assessments')
      .select(
        `
        id,
        title,
        subject,
        grade
        `
      )
      .eq(
        'id',
        attempt.assessment_id
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
        { status: 404 }
      )
    }

    /*
     * Load student name directly
     * from profiles.
     *
     * Explicit type prevents TypeScript
     * from treating this variable as only null.
     */
    let studentProfile:
      StudentProfile | null = null

    /*
     * If the logged-in user is the student,
     * use that student's profile.
     */
    if (student) {
      const {
        data: studentProfileData,
        error: studentProfileError,
      } = await admin
        .from('profiles')
        .select(
          'id, full_name'
        )
        .eq(
          'id',
          student.profile_id
        )
        .maybeSingle()

      if (
        studentProfileError
      ) {
        console.error(
          'Student profile lookup error:',
          studentProfileError
        )
      }

      studentProfile =
        studentProfileData
    } else {
      /*
       * For admin/teacher viewing a result,
       * find the student record using
       * the attempt's student_id.
       */
      const {
        data: resultStudent,
        error: resultStudentError,
      } = await admin
        .from('students')
        .select(
          'id, profile_id'
        )
        .eq(
          'id',
          attempt.student_id
        )
        .maybeSingle()

      if (
        resultStudentError
      ) {
        console.error(
          'Result student lookup error:',
          resultStudentError
        )
      }

      if (resultStudent) {
        const {
          data: resultProfile,
          error: resultProfileError,
        } = await admin
          .from('profiles')
          .select(
            'id, full_name'
          )
          .eq(
            'id',
            resultStudent.profile_id
          )
          .maybeSingle()

        if (
          resultProfileError
        ) {
          console.error(
            'Result profile lookup error:',
            resultProfileError
          )
        }

        studentProfile =
          resultProfile
      }
    }

    /*
     * Load attempt answers directly.
     */
    const {
      data: attemptAnswers,
      error: answersError,
    } = await admin
      .from('attempt_answers')
      .select(
        `
        id,
        question_id,
        selected_option,
        is_correct
        `
      )
      .eq(
        'attempt_id',
        attempt.id
      )

    if (answersError) {
      console.error(
        'Attempt answers error:',
        answersError
      )

      return NextResponse.json(
        {
          error:
            'Unable to load answers',
          details:
            answersError.message,
        },
        { status: 500 }
      )
    }

    /*
     * Get question IDs from the
     * student's saved answers.
     */
    const questionIds =
      (
        attemptAnswers ||
        []
      ).map(
        (answer) =>
          answer.question_id
      )

    /*
     * Question data type.
     */
    type QuestionData = {
      id: string
      prompt: string
      options: string[]
      correct_option: number | null
      topic: string | null
      difficulty: string | null
    }

    let questions:
      QuestionData[] = []

    /*
     * Load the related questions.
     */
    if (
      questionIds.length > 0
    ) {
      const {
        data: questionData,
        error: questionError,
      } = await admin
        .from('questions')
        .select(
          `
          id,
          prompt,
          options,
          correct_option,
          topic,
          difficulty
          `
        )
        .in(
          'id',
          questionIds
        )

      if (questionError) {
        console.error(
          'Question lookup error:',
          questionError
        )

        return NextResponse.json(
          {
            error:
              'Unable to load questions',
            details:
              questionError.message,
          },
          { status: 500 }
        )
      }

      questions =
        (questionData ||
          []) as QuestionData[]
    }

    /*
     * Combine answers with questions.
     */
    const answers =
      (
        attemptAnswers ||
        []
      ).map(
        (answer) => {
          const question =
            questions.find(
              (item) =>
                item.id ===
                answer.question_id
            )

          return {
            id: answer.id,

            question_id:
              answer.question_id,

            prompt:
              question?.prompt ||
              '',

            options:
              question?.options ||
              [],

            selected_option:
              answer.selected_option,

            correct_option:
              question?.correct_option ??
              null,

            is_correct:
              answer.is_correct,

            topic:
              question?.topic ||
              '',

            difficulty:
              question?.difficulty ||
              '',
          }
        }
      )

    /*
     * Calculate correct answers
     * from the saved attempt answers.
     */
    const correctAnswers =
      answers.filter(
        (answer) =>
          answer.is_correct
      ).length

    const totalQuestions =
      attempt.total_questions ||
      answers.length

    const score =
      totalQuestions > 0
        ? Math.round(
            (correctAnswers /
              totalQuestions) *
              100
          )
        : 0

    /*
     * Generate letter grade.
     */
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

    /*
     * Return complete result.
     */
    return NextResponse.json(
      {
        result: {
          id: attempt.id,

          score,

          letter,

          total_questions:
            totalQuestions,

          correct_answers:
            correctAnswers,

          submitted_at:
            attempt.submitted_at,

          assessment: {
            title:
              assessment.title,

            subject:
              assessment.subject,

            grade:
              assessment.grade,
          },

          student:
            studentProfile
              ? {
                  full_name:
                    studentProfile.full_name ||
                    'Student',
                }
              : {
                  full_name:
                    'Student',
                },

          answers,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Dashboard result error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load result',
      },
      { status: 500 }
    )
  }
}