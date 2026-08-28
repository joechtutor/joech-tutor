import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
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
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(
                  name,
                  value,
                  options
                )
              }
            )
          } catch {
            // Cookies may be read-only in some server contexts.
          }
        },
      },
    }
  )
}

function getAdminSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase service role configuration is missing.'
    )
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function GET(request: Request) {
  try {
    console.log('========================================')
    console.log('LIVE CLASSES API REQUEST')
    console.log('URL:', request.url)
    console.log('========================================')

    /*
     * --------------------------------------------------
     * Verify logged-in user
     * --------------------------------------------------
     */

    const supabase = await getSupabase()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error(
        'Authentication error:',
        userError
      )

      return NextResponse.json(
        {
          error:
            'Unable to verify your login session.',
          details: userError.message,
        },
        { status: 401 }
      )
    }

    if (!user) {
      console.error(
        'No authenticated user found.'
      )

      return NextResponse.json(
        {
          error:
            'You must be logged in to access live classes.',
        },
        { status: 401 }
      )
    }

    console.log(
      'Authenticated user:',
      user.email
    )

    /*
     * --------------------------------------------------
     * Get user's profile and role
     * --------------------------------------------------
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
        'Profile lookup error:',
        profileError
      )

      return NextResponse.json(
        {
          error:
            'Unable to load your profile.',
          details: profileError.message,
        },
        { status: 500 }
      )
    }

    if (!profile) {
      console.error(
        'Profile not found for user:',
        user.id
      )

      return NextResponse.json(
        {
          error:
            'Your user profile was not found.',
        },
        { status: 403 }
      )
    }

    console.log(
      'User role:',
      profile.role
    )

    /*
     * --------------------------------------------------
     * Read optional class code / class ID
     * --------------------------------------------------
     */

    const { searchParams } =
      new URL(request.url)

    const code = searchParams
      .get('code')
      ?.trim()
      .toUpperCase()

    const id = searchParams
      .get('id')
      ?.trim()

    /*
     * --------------------------------------------------
     * CASE 1:
     *
     * No ID and no code.
     *
     * This is the request from:
     *
     * /dashboard/live-classes
     *
     * Therefore return the list of classes.
     * --------------------------------------------------
     */

    if (!code && !id) {
      /*
       * Only admin and teacher accounts can
       * access the management/list endpoint.
       */

      if (
        profile.role !== 'admin' &&
        profile.role !== 'teacher'
      ) {
        return NextResponse.json(
          {
            error:
              'Only admins and teachers can manage live classes.',
          },
          { status: 403 }
        )
      }

      console.log(
        'Loading all live classes for:',
        profile.role
      )

      /*
       * Use the service-role client here so the
       * admin/teacher dashboard is not blocked by
       * student-oriented RLS policies.
       */

      const adminSupabase =
        getAdminSupabase()

      const {
        data: liveClasses,
        error: listError,
      } = await adminSupabase
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
        .order(
          'scheduled_at',
          {
            ascending: true,
            nullsFirst: false,
          }
        )

      if (listError) {
        console.error(
          'Live class list database error:',
          listError
        )

        return NextResponse.json(
          {
            error:
              'Unable to load live classes.',
            details:
              listError.message,
            code:
              listError.code,
            hint:
              listError.hint,
          },
          { status: 500 }
        )
      }

      console.log(
        'Live classes found:',
        liveClasses?.length ?? 0
      )

      console.log(
        'LIVE CLASSES LIST SUCCESS'
      )

      return NextResponse.json({
        success: true,
        liveClasses:
          liveClasses || [],
      })
    }

    /*
     * --------------------------------------------------
     * CASE 2:
     *
     * A class code or class ID was supplied.
     *
     * This supports class lookup.
     * --------------------------------------------------
     */

    console.log(
      'Looking up specific live class.'
    )

    console.log(
      'Class code:',
      code || 'not supplied'
    )

    console.log(
      'Class ID:',
      id || 'not supplied'
    )

    /*
     * --------------------------------------------------
     * Use service-role client for lookup.
     * --------------------------------------------------
     */

    const adminSupabase =
      getAdminSupabase()

    let query = adminSupabase
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

    if (code) {
      query = query.eq(
        'class_code',
        code
      )
    } else if (id) {
      query = query.eq(
        'id',
        id
      )
    }

    const {
      data: liveClass,
      error: lookupError,
    } = await query.maybeSingle()

    if (lookupError) {
      console.error(
        'Live class lookup error:',
        lookupError
      )

      return NextResponse.json(
        {
          error:
            'Unable to look up the live class.',
          details:
            lookupError.message,
          code:
            lookupError.code,
          hint:
            lookupError.hint,
        },
        { status: 500 }
      )
    }

    if (!liveClass) {
      console.error(
        'Live class not found.'
      )

      return NextResponse.json(
        {
          error:
            'Live class not found. Please check the class code or class ID.',
        },
        { status: 404 }
      )
    }

    console.log(
      'Live class found:',
      liveClass.title
    )

    /*
     * --------------------------------------------------
     * Return the specific class
     * --------------------------------------------------
     */

    return NextResponse.json({
      success: true,
      liveClass,
      studentId: user.id,
    })
  } catch (error) {
    console.error(
      '========================================'
    )

    console.error(
      'LIVE CLASSES API UNEXPECTED ERROR'
    )

    console.error(error)

    console.error(
      '========================================'
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