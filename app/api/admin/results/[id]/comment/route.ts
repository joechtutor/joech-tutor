import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../../../lib/supabase-server'
import { supabaseAdmin } from '../../../../../../lib/supabase-admin'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase =
      await supabaseServer()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401 }
      )
    }

    const { data: profile } =
      await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (
      !profile ||
      !['admin', 'teacher'].includes(
        profile.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Forbidden. Only administrators and teachers can save comments.',
        },
        { status: 403 }
      )
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Result ID is missing' },
        { status: 400 }
      )
    }

    const body = await req.json()

    const teacherComment =
      typeof body.teacher_comment ===
      'string'
        ? body.teacher_comment.trim()
        : ''

    const admin =
      supabaseAdmin()

    const {
      data: attempt,
      error: attemptError,
    } = await admin
      .from('attempts')
      .update({
        teacher_comment:
          teacherComment || null,
      })
      .eq('id', id)
      .select(`
        id,
        teacher_comment
      `)
      .single()

    if (attemptError || !attempt) {
      return NextResponse.json(
        {
          error:
            attemptError?.message ||
            'Unable to save teacher comment.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      attempt,
    })
  } catch (error) {
    console.error(
      'Teacher comment API error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to save teacher comment.',
      },
      { status: 500 }
    )
  }
}