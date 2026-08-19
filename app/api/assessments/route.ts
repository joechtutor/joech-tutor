import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '../../../lib/supabase-server'
import { supabaseAdmin } from '../../../lib/supabase-admin'

const AssessmentSchema = z.object({
  title: z.string().min(3).max(150),
  subject: z.enum(['Mathematics', 'English']),
  grade: z.number().int().min(5).max(9),
  duration_minutes: z.number().int().min(1).max(180),
  question_ids: z
    .array(z.string().uuid())
    .min(1)
    .max(100),
})

async function requireStaff() {
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401 }
      ),
    }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (
    error ||
    !profile ||
    !['admin', 'teacher'].includes(profile.role)
  ) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      ),
    }
  }

  return { user }
}

/*
 * GET
 * Load all assessments
 */
export async function GET() {
  try {
    const auth = await requireStaff()

    if (auth.error) {
      return auth.error
    }

    const admin = supabaseAdmin()

    const { data: assessments, error } = await admin
      .from('assessments')
      .select(`
        id,
        title,
        subject,
        grade,
        duration_minutes,
        created_at,
        assessment_questions (
          question_id,
          position
        )
      `)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Assessment GET database error:',
        error
      )

      return NextResponse.json(
        {
          error:
            error.message ||
            'Unable to load assessments',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        assessments: assessments || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Assessment GET unexpected error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'An unexpected error occurred while loading assessments.',
      },
      { status: 500 }
    )
  }
}

/*
 * POST
 * Create a new assessment
 */
export async function POST(req: Request) {
  try {
    const auth = await requireStaff()

    if (auth.error) {
      return auth.error
    }

    let jsonBody: unknown

    try {
      jsonBody = await req.json()
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid request body. Please send valid JSON.',
        },
        { status: 400 }
      )
    }

    const body =
      AssessmentSchema.safeParse(jsonBody)

    if (!body.success) {
      return NextResponse.json(
        {
          error:
            'Invalid assessment information.',
          details:
            body.error.flatten(),
        },
        { status: 400 }
      )
    }

    const {
      title,
      subject,
      grade,
      duration_minutes,
      question_ids,
    } = body.data

    const admin = supabaseAdmin()

    /*
     * Verify that all selected questions exist
     * and belong to the selected subject and grade.
     */
    const {
      data: questions,
      error: questionsCheckError,
    } = await admin
      .from('questions')
      .select(
        'id, subject, grade'
      )
      .in('id', question_ids)

    if (questionsCheckError) {
      console.error(
        'Question verification error:',
        questionsCheckError
      )

      return NextResponse.json(
        {
          error:
            questionsCheckError.message ||
            'Unable to verify selected questions.',
        },
        { status: 400 }
      )
    }

    if (
      !questions ||
      questions.length !== question_ids.length
    ) {
      return NextResponse.json(
        {
          error:
            'One or more selected questions could not be found.',
        },
        { status: 400 }
      )
    }

    const invalidQuestion =
      questions.find(
        (question) =>
          question.subject !== subject ||
          question.grade !== grade
      )

    if (invalidQuestion) {
      return NextResponse.json(
        {
          error:
            'All selected questions must match the assessment subject and grade.',
        },
        { status: 400 }
      )
    }

    /*
     * Create assessment
     */
    const {
      data: assessment,
      error: assessmentError,
    } = await admin
      .from('assessments')
      .insert({
        title,
        subject,
        grade,
        duration_minutes,
        created_by: auth.user.id,
      })
      .select('id')
      .single()

    if (
      assessmentError ||
      !assessment
    ) {
      console.error(
        'Assessment creation error:',
        assessmentError
      )

      return NextResponse.json(
        {
          error:
            assessmentError?.message ||
            'Unable to create assessment.',
        },
        { status: 400 }
      )
    }

    /*
     * Attach questions to assessment
     */
    const assessmentQuestions =
      question_ids.map(
        (
          question_id,
          index
        ) => ({
          assessment_id:
            assessment.id,
          question_id,
          position:
            index + 1,
        })
      )

    const {
      error: attachError,
    } = await admin
      .from('assessment_questions')
      .insert(
        assessmentQuestions
      )

    /*
     * If attaching questions fails,
     * remove the newly-created assessment.
     */
    if (attachError) {
      console.error(
        'Assessment question attachment error:',
        attachError
      )

      await admin
        .from('assessments')
        .delete()
        .eq(
          'id',
          assessment.id
        )

      return NextResponse.json(
        {
          error:
            attachError.message ||
            'Unable to attach questions to assessment.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Assessment created successfully.',
        assessment: {
          id: assessment.id,
          title,
          subject,
          grade,
          duration_minutes,
          question_count:
            question_ids.length,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'Assessment POST unexpected error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'An unexpected error occurred while creating the assessment.',
      },
      { status: 500 }
    )
  }
}