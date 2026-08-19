import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '../../../lib/supabase-server'
import { supabaseAdmin } from '../../../lib/supabase-admin'

const QuestionSchema = z.object({
  subject: z.enum(['Mathematics', 'English']),
  grade: z.number().int().min(5).max(9),
  topic: z.string().min(2).max(100),
  difficulty: z.enum([
    'Foundation',
    'Intermediate',
    'Advanced',
  ]),
  prompt: z.string().min(5).max(5000),
  options: z
    .array(z.string().min(1).max(500))
    .min(2)
    .max(6),
  correct_option: z.number().int().min(0).max(5),
  explanation: z
    .string()
    .max(5000)
    .optional()
    .nullable(),
})

async function requireStaff() {
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
    return {
      error: NextResponse.json(
        {
          error:
            'Unauthenticated. Please log in again.',
        },
        { status: 401 }
      ),
    }
  }

  /*
   * Use the database role function instead of
   * relying only on a direct profile query.
   */
  const { data: role, error: roleError } =
    await supabase.rpc('my_role')

  if (roleError) {
    console.error(
      'Role lookup error:',
      roleError
    )

    return {
      error: NextResponse.json(
        {
          error:
            'Unable to verify your account role.',
          details: roleError.message,
        },
        { status: 500 }
      ),
    }
  }

  if (
    role !== 'admin' &&
    role !== 'teacher'
  ) {
    console.error(
      'Forbidden question access. User:',
      user.id,
      'Role:',
      role
    )

    return {
      error: NextResponse.json(
        {
          error:
            'Forbidden. Only administrators and teachers can manage questions.',
          role: role || null,
        },
        { status: 403 }
      ),
    }
  }

  return {
    user,
    role,
  }
}

/*
 * GET
 * List all questions.
 */
export async function GET() {
  try {
    const auth = await requireStaff()

    if (auth.error) {
      return auth.error
    }

    const admin = supabaseAdmin()

    const {
      data: questions,
      error,
    } = await admin
      .from('questions')
      .select(`
        id,
        subject,
        grade,
        topic,
        difficulty,
        prompt,
        options,
        correct_option,
        explanation,
        created_at
      `)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Question list error:',
        error
      )

      return NextResponse.json(
        {
          error:
            error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        questions:
          questions || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Question GET error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'An unexpected error occurred.',
      },
      { status: 500 }
    )
  }
}

/*
 * POST
 * Create a new question.
 */
export async function POST(
  req: Request
) {
  try {
    const auth =
      await requireStaff()

    if (auth.error) {
      return auth.error
    }

    let requestBody: unknown

    try {
      requestBody =
        await req.json()
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON request.',
        },
        { status: 400 }
      )
    }

    const body =
      QuestionSchema.safeParse(
        requestBody
      )

    if (!body.success) {
      return NextResponse.json(
        {
          error:
            'Invalid question information.',
          details:
            body.error.flatten(),
        },
        { status: 400 }
      )
    }

    /*
     * Make sure the correct option exists.
     */
    if (
      body.data.correct_option >=
      body.data.options.length
    ) {
      return NextResponse.json(
        {
          error:
            'Correct answer must match one of the answer options.',
        },
        { status: 400 }
      )
    }

    const admin =
      supabaseAdmin()

    /*
     * Insert question.
     */
    const {
      data: question,
      error,
    } = await admin
      .from('questions')
      .insert({
        subject:
          body.data.subject,
        grade:
          body.data.grade,
        topic:
          body.data.topic,
        difficulty:
          body.data.difficulty,
        prompt:
          body.data.prompt,
        options:
          body.data.options,
        correct_option:
          body.data.correct_option,
        explanation:
          body.data.explanation ||
          null,
        created_by:
          auth.user.id,
      })
      .select(`
        id,
        subject,
        grade,
        topic,
        difficulty,
        prompt,
        options,
        correct_option,
        explanation,
        created_at
      `)
      .single()

    if (error) {
      console.error(
        'Question creation error:',
        error
      )

      return NextResponse.json(
        {
          error:
            error.message,
          details:
            error.details ||
            null,
          hint:
            error.hint ||
            null,
          code:
            error.code ||
            null,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Question created successfully.',
        question,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'Question POST error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.',
      },
      { status: 500 }
    )
  }
}