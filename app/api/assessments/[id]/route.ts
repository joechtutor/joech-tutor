import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '../../../../lib/supabase-server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

const AssessmentUpdateSchema = z.object({
  title: z.string().min(3).max(150),
  subject: z.enum(['Mathematics', 'English']),
  grade: z.number().int().min(5).max(9),
  duration_minutes: z.number().int().min(1).max(180),
  question_ids: z.array(z.string().uuid()).min(1).max(100),
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

export async function GET(
  _req: Request,
  context: {
    params: Promise<{ id: string }>
  }
) {
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

    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    const admin = supabaseAdmin()

    const { data: profile, error: profileError } =
      await admin
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
      console.error('Profile lookup error:', profileError)

      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (
      !['admin', 'teacher', 'student'].includes(
        profile.role
      )
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (profile.role === 'student') {
      const { data: student, error: studentError } =
        await admin
          .from('students')
          .select('id, profile_id, grade')
          .eq('profile_id', user.id)
          .single()

      if (studentError || !student) {
        console.error(
          'Student lookup error:',
          studentError
        )

        return NextResponse.json(
          { error: 'Student record not found' },
          { status: 404 }
        )
      }

      const {
        data: assignment,
        error: assignmentError,
      } = await admin
        .from('assessment_assignments')
        .select(
          'assessment_id, student_id, assigned_at'
        )
        .eq('assessment_id', id)
        .eq('student_id', student.id)
        .maybeSingle()

      if (assignmentError) {
        console.error(
          'Assignment lookup error:',
          assignmentError
        )

        return NextResponse.json(
          {
            error:
              'Unable to verify assessment assignment',
          },
          { status: 500 }
        )
      }

      if (!assignment) {
        return NextResponse.json(
          {
            error:
              'Assessment not found or not assigned',
          },
          { status: 404 }
        )
      }
    }

    const {
      data: assessment,
      error: assessmentError,
    } = await admin
      .from('assessments')
      .select(
        'id, title, subject, grade, duration_minutes, created_at'
      )
      .eq('id', id)
      .single()

    if (assessmentError || !assessment) {
      console.error(
        'Assessment lookup error:',
        assessmentError
      )

      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    const {
      data: assessmentQuestions,
      error: assessmentQuestionsError,
    } = await admin
      .from('assessment_questions')
      .select('question_id, position')
      .eq('assessment_id', id)
      .order('position', { ascending: true })

    if (assessmentQuestionsError) {
      console.error(
        'Assessment questions lookup error:',
        assessmentQuestionsError
      )

      return NextResponse.json(
        {
          error:
            'Unable to load assessment questions',
        },
        { status: 500 }
      )
    }

    const questionIds =
      (assessmentQuestions || []).map(
        (item) => item.question_id
      )

    let questions: Array<{
      id: string
      subject: string
      grade: number
      topic: string | null
      difficulty: string
      prompt: string
      options: unknown
    }> = []

    if (questionIds.length > 0) {
      const {
        data: questionData,
        error: questionError,
      } = await admin
        .from('questions')
        .select(
          'id, subject, grade, topic, difficulty, prompt, options'
        )
        .in('id', questionIds)

      if (questionError) {
        console.error(
          'Questions lookup error:',
          questionError
        )

        return NextResponse.json(
          {
            error: 'Unable to load questions',
          },
          { status: 500 }
        )
      }

      questions = questionData || []
    }

    const questionMap = new Map(
      questions.map((question) => [
        question.id,
        question,
      ])
    )

    const formattedQuestions =
      (assessmentQuestions || []).map(
        (item) => ({
          question_id: item.question_id,
          position: item.position,
          question:
            questionMap.get(item.question_id) || null,
        })
      )

    return NextResponse.json(
      {
        assessment: {
          ...assessment,
          assessment_questions:
            formattedQuestions,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Assessment GET error:', error)

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

export async function PUT(
  req: Request,
  context: {
    params: Promise<{ id: string }>
  }
) {
  try {
    const auth = await requireStaff()

    if (auth.error) {
      return auth.error
    }

    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    let jsonBody: unknown

    try {
      jsonBody = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400 }
      )
    }

    const body =
      AssessmentUpdateSchema.safeParse(jsonBody)

    if (!body.success) {
      return NextResponse.json(
        {
          error: 'Invalid assessment information',
          details: body.error.flatten(),
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

    const {
      data: existingAssessment,
      error: existingError,
    } = await admin
      .from('assessments')
      .select('id')
      .eq('id', id)
      .single()

    if (existingError || !existingAssessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    const {
      data: updatedAssessment,
      error: updateError,
    } = await admin
      .from('assessments')
      .update({
        title,
        subject,
        grade,
        duration_minutes,
      })
      .eq('id', id)
      .select(
        'id,title,subject,grade,duration_minutes,created_at'
      )
      .single()

    if (updateError || !updatedAssessment) {
      console.error(
        'Assessment update error:',
        updateError
      )

      return NextResponse.json(
        {
          error:
            updateError?.message ||
            'Unable to update assessment',
        },
        { status: 400 }
      )
    }

    const {
      error: deleteQuestionsError,
    } = await admin
      .from('assessment_questions')
      .delete()
      .eq('assessment_id', id)

    if (deleteQuestionsError) {
      console.error(
        'Delete assessment questions error:',
        deleteQuestionsError
      )

      return NextResponse.json(
        { error: deleteQuestionsError.message },
        { status: 400 }
      )
    }

    const {
      error: insertQuestionsError,
    } = await admin
      .from('assessment_questions')
      .insert(
        question_ids.map(
          (question_id, index) => ({
            assessment_id: id,
            question_id,
            position: index + 1,
          })
        )
      )

    if (insertQuestionsError) {
      console.error(
        'Insert assessment questions error:',
        insertQuestionsError
      )

      return NextResponse.json(
        { error: insertQuestionsError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Assessment updated successfully',
        assessment: updatedAssessment,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Assessment PUT error:', error)

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

export async function DELETE(
  _req: Request,
  context: {
    params: Promise<{ id: string }>
  }
) {
  try {
    const auth = await requireStaff()

    if (auth.error) {
      return auth.error
    }

    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID is required' },
        { status: 400 }
      )
    }

    const admin = supabaseAdmin()

    const {
      data: assessment,
      error: assessmentError,
    } = await admin
      .from('assessments')
      .select('id')
      .eq('id', id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    const {
      error: questionsError,
    } = await admin
      .from('assessment_questions')
      .delete()
      .eq('assessment_id', id)

    if (questionsError) {
      console.error(
        'Delete assessment questions error:',
        questionsError
      )

      return NextResponse.json(
        { error: questionsError.message },
        { status: 400 }
      )
    }

    const {
      error: assignmentsError,
    } = await admin
      .from('assessment_assignments')
      .delete()
      .eq('assessment_id', id)

    if (assignmentsError) {
      console.error(
        'Delete assessment assignments error:',
        assignmentsError
      )

      return NextResponse.json(
        { error: assignmentsError.message },
        { status: 400 }
      )
    }

    const { error: deleteError } =
      await admin
        .from('assessments')
        .delete()
        .eq('id', id)

    if (deleteError) {
      console.error(
        'Delete assessment error:',
        deleteError
      )

      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Assessment deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Assessment DELETE error:',
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