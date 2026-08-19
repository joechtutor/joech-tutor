import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../../lib/supabase-server'
import { supabaseAdmin } from '../../../../../lib/supabase-admin'

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

    const { data: profile, error: profileError } =
      await s
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || profile?.role !== 'student') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    /*
      Get the assessment ID directly from the URL.

      Example:
      /api/student/assessments/12345
    */
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)

    const assessmentId = parts[parts.length - 1]

    if (!assessmentId || assessmentId === 'assessments') {
      return NextResponse.json(
        { error: 'Assessment ID is missing' },
        { status: 400 }
      )
    }

    const admin = supabaseAdmin()

    // Find the student
    const { data: student, error: studentError } =
      await admin
        .from('students')
        .select('id, grade, profile_id')
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

    // Confirm the assessment belongs to this student
    const {
      data: assignment,
      error: assignmentError,
    } = await admin
      .from('assessment_assignments')
      .select('assessment_id, student_id, assigned_at')
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

    // Load the assessment
    const {
      data: assessment,
      error: assessmentError,
    } = await admin
      .from('assessments')
      .select(
        'id, title, subject, grade, duration_minutes'
      )
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

    // Load assessment questions
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

    // Load the questions
    const {
      data: questions,
      error: questionsFetchError,
    } = await admin
      .from('questions')
      .select(
        'id, prompt, options, topic, difficulty'
      )
      .in('id', questionIds)

    if (questionsFetchError) {
      return NextResponse.json(
        { error: questionsFetchError.message },
        { status: 400 }
      )
    }

    // Preserve assessment question order
    const orderedQuestions = questionIds
      .map((questionId) =>
        questions?.find(
          (question) => question.id === questionId
        )
      )
      .filter(Boolean)

    return NextResponse.json({
      assessment: {
        ...assessment,
        questions: orderedQuestions,
      },
    })
  } catch (error) {
    console.error(
      'Student assessment loading error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load assessment',
      },
      { status: 500 }
    )
  }
}