import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabase-server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

type StudentListItem = {
  id: string
  full_name: string
  grade: number
}

export async function GET() {
  try {
    const s =
      await supabaseServer()

    const {
      data: { user },
    } = await s.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          error:
            'Unauthenticated',
        },
        { status: 401 }
      )
    }

    const {
      data: profile,
      error: profileError,
    } = await s
      .from('profiles')
      .select('role')
      .eq(
        'id',
        user.id
      )
      .single()

    if (
      profileError ||
      !profile ||
      ![
        'admin',
        'teacher',
      ].includes(profile.role)
    ) {
      return NextResponse.json(
        {
          error:
            'Forbidden',
        },
        { status: 403 }
      )
    }

    const admin =
      supabaseAdmin()

    const {
      data: students,
      error,
    } = await admin
      .from('students')
      .select(
        'id, profile_id, grade'
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )

    if (error) {
      console.error(
        'Student database error:',
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

    /*
     * Explicitly type the array.
     *
     * This prevents TypeScript from
     * inferring the array as never[].
     */
    const studentList:
      StudentListItem[] = []

    for (
      const student of
        students || []
    ) {
      const {
        data: studentProfile,
        error:
          studentProfileError,
      } = await admin
        .from('profiles')
        .select(
          'full_name'
        )
        .eq(
          'id',
          student.profile_id
        )
        .single()

      if (
        studentProfileError
      ) {
        console.error(
          'Student profile lookup error:',
          studentProfileError
        )
      }

      studentList.push({
        id: student.id,

        full_name:
          studentProfile?.full_name ||
          'Student',

        grade:
          student.grade,
      })
    }

    return NextResponse.json(
      {
        students:
          studentList,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Student list error:',
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