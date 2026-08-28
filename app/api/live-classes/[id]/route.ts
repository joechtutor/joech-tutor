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
            // Cookies may be read-only in some server contexts.
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
  const diagnostics: Record<string, unknown> = {
    route: '/api/live-classes/[id]',
    method: 'GET',
    timestamp: new Date().toISOString(),
  }

  try {
    /*
     * ---------------------------------------------------------
     * GET CLASS ID
     * ---------------------------------------------------------
     */

    const { id } = await context.params

    diagnostics.classId = id

    console.log('========================================')
    console.log('[LiveClass API] GET classroom')
    console.log('[LiveClass API] Class ID:', id)
    console.log('========================================')

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Live class ID is missing.',
          diagnostics,
        },
        { status: 400 }
      )
    }

    /*
     * ---------------------------------------------------------
     * SUPABASE
     * ---------------------------------------------------------
     */

    const supabase = await getSupabase()

    /*
     * ---------------------------------------------------------
     * AUTHENTICATED USER
     * ---------------------------------------------------------
     */

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error(
        '[LiveClass API] Auth error:',
        userError
      )

      return NextResponse.json(
        {
          success: false,
          error: 'Unable to verify your login session.',
          details: userError.message,
          diagnostics,
        },
        { status: 401 }
      )
    }

    if (!user) {
      console.error(
        '[LiveClass API] No authenticated user.'
      )

      return NextResponse.json(
        {
          success: false,
          error: 'You must be logged in to open the classroom.',
          diagnostics,
        },
        { status: 401 }
      )
    }

    diagnostics.userId = user.id
    diagnostics.userEmail = user.email ?? null

    console.log(
      '[LiveClass API] Authenticated user:',
      user.email
    )

    console.log(
      '[LiveClass API] User ID:',
      user.id
    )

    /*
     * ---------------------------------------------------------
     * LOAD PROFILE
     * ---------------------------------------------------------
     */

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error(
        '[LiveClass API] Profile query error:',
        profileError
      )

      return NextResponse.json(
        {
          success: false,
          error: 'Unable to load your profile.',
          details: profileError.message,
          code: profileError.code,
          hint: profileError.hint,
          diagnostics,
        },
        { status: 500 }
      )
    }

    if (!profile) {
      console.error(
        '[LiveClass API] Profile not found for user:',
        user.id
      )

      return NextResponse.json(
        {
          success: false,
          error: 'Your user profile was not found.',
          details:
            'The authenticated user exists, but no matching profile record was found.',
          diagnostics,
        },
        { status: 403 }
      )
    }

    diagnostics.role = profile.role

    console.log(
      '[LiveClass API] Profile role:',
      profile.role
    )

    /*
     * ---------------------------------------------------------
     * LOAD LIVE CLASS
     *
     * IMPORTANT:
     * Students must also be able to read the classroom.
     * The previous version incorrectly allowed only:
     *
     *   admin
     *   teacher
     *
     * which caused:
     *
     * "Only admins and teachers can open this classroom."
     *
     * We now allow authenticated users with valid roles.
     * ---------------------------------------------------------
     */

    const allowedRoles = [
      'admin',
      'teacher',
      'student',
      'parent',
    ]

    if (
      !allowedRoles.includes(
        String(profile.role)
      )
    ) {
      console.error(
        '[LiveClass API] Unknown user role:',
        profile.role
      )

      return NextResponse.json(
        {
          success: false,
          error: 'Your account does not have permission to access live classrooms.',
          details:
            `Your current role is "${profile.role}".`,
          diagnostics,
        },
        { status: 403 }
      )
    }

    console.log(
      '[LiveClass API] Loading live class:',
      id
    )

    const {
      data: liveClass,
      error: liveClassError,
    } = await supabase
      .from('live_classes')
      .select(
        `
        id,
        title,
        subject,
        topic,
        class_code,
        scheduled_at,
        duration_minutes,
        status
        `
      )
      .eq('id', id)
      .maybeSingle()

    if (liveClassError) {
      console.error(
        '[LiveClass API] Live class database error:',
        liveClassError
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Unable to load the live class from the database.',
          details: liveClassError.message,
          code: liveClassError.code,
          hint: liveClassError.hint,
          diagnostics,
        },
        { status: 500 }
      )
    }

    /*
     * ---------------------------------------------------------
     * CLASS NOT FOUND
     * ---------------------------------------------------------
     */

    if (!liveClass) {
      console.error(
        '[LiveClass API] Live class not found:',
        id
      )

      diagnostics.classFound = false

      return NextResponse.json(
        {
          success: false,
          error: 'Live class not found.',
          details:
            `No live class exists with ID: ${id}`,
          diagnostics,
        },
        { status: 404 }
      )
    }

    /*
     * ---------------------------------------------------------
     * SUCCESS
     * ---------------------------------------------------------
     */

    diagnostics.classFound = true
    diagnostics.classTitle = liveClass.title
    diagnostics.classStatus = liveClass.status
    diagnostics.classCode = liveClass.class_code

    console.log(
      '[LiveClass API] LIVE CLASS FOUND'
    )

    console.log(
      '[LiveClass API] Title:',
      liveClass.title
    )

    console.log(
      '[LiveClass API] Status:',
      liveClass.status
    )

    console.log(
      '[LiveClass API] Class code:',
      liveClass.class_code
    )

    console.log(
      '[LiveClass API] User role:',
      profile.role
    )

    console.log(
      '[LiveClass API] SUCCESS'
    )

    console.log('========================================')

    return NextResponse.json(
      {
        success: true,
        liveClass,
        diagnostics,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('========================================')
    console.error(
      '[LiveClass API] UNEXPECTED ERROR'
    )
    console.error(error)
    console.error('========================================')

    return NextResponse.json(
      {
        success: false,
        error:
          'An unexpected error occurred while opening the classroom.',
        details:
          error instanceof Error
            ? error.message
            : 'Unknown server error',
        diagnostics,
      },
      { status: 500 }
    )
  }
}