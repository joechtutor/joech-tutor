import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Cookies may be read-only in this server context.
          }
        },
      },
    }
  )
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: 'Classroom ID is required.' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found.' },
        { status: 403 }
      )
    }

    if (profile.role !== 'student') {
      return NextResponse.json(
        {
          error:
            'This classroom endpoint is for students only.',
        },
        { status: 403 }
      )
    }

    const { data: student, error: studentError } =
      await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user.id)
        .single()

    if (studentError || !student) {
      return NextResponse.json(
        {
          error:
            'Student profile not found.',
        },
        { status: 403 }
      )
    }

    const { data: liveClass, error: classError } =
      await supabase
        .from('live_classes')
        .select(
          'id, title, subject, topic, class_code, scheduled_at, duration_minutes, status'
        )
        .eq('id', id)
        .single()

    if (classError || !liveClass) {
      return NextResponse.json(
        {
          error: 'Live class not found.',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      liveClass,
      student: {
        id: student.id,
      },
    })
  } catch (error) {
    console.error(
      'Student classroom API error:',
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