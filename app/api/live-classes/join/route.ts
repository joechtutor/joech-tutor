import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/*
 * --------------------------------------------------
 * Student Supabase client
 * --------------------------------------------------
 */

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

/*
 * --------------------------------------------------
 * Service-role Supabase client
 *
 * IMPORTANT:
 * SUPABASE_SERVICE_ROLE_KEY must NEVER be exposed
 * to client-side code.
 * --------------------------------------------------
 */

function getAdminSupabase() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is missing.'
    )
  }

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.'
    )
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/*
 * --------------------------------------------------
 * GET
 * --------------------------------------------------
 *
 * Student enters:
 *
 * /api/live-classes/join?code=JOECH-XXXX
 *
 * or:
 *
 * /api/live-classes/join?id=CLASS-ID
 *
 * --------------------------------------------------
 */

export async function GET(
  request: Request
) {
  const diagnosticId =
    `JOIN-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`

  try {
    console.log('')
    console.log(
      '=================================================='
    )
    console.log(
      `[LIVE CLASS JOIN] ${diagnosticId}`
    )
    console.log(
      '=================================================='
    )

    /*
     * ------------------------------------------------
     * STEP 1 — Check environment
     * ------------------------------------------------
     */

    console.log(
      '[LIVE CLASS JOIN] Step 1: Checking environment...'
    )

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log(
      '[LIVE CLASS JOIN] Supabase URL:',
      supabaseUrl
        ? 'PRESENT'
        : 'MISSING'
    )

    console.log(
      '[LIVE CLASS JOIN] Anon key:',
      anonKey
        ? 'PRESENT'
        : 'MISSING'
    )

    console.log(
      '[LIVE CLASS JOIN] Service role key:',
      serviceRoleKey
        ? 'PRESENT'
        : 'MISSING'
    )

    if (!supabaseUrl) {
      return NextResponse.json(
        {
          error:
            'Server configuration error: Supabase URL is missing.',
          diagnosticId,
        },
        { status: 500 }
      )
    }

    if (!anonKey) {
      return NextResponse.json(
        {
          error:
            'Server configuration error: Supabase anonymous key is missing.',
          diagnosticId,
        },
        { status: 500 }
      )
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.',
          diagnosticId,
        },
        { status: 500 }
      )
    }

    /*
     * ------------------------------------------------
     * STEP 2 — Create authenticated Supabase client
     * ------------------------------------------------
     */

    console.log(
      '[LIVE CLASS JOIN] Step 2: Creating student Supabase client...'
    )

    const supabase =
      await getSupabase()

    /*
     * ------------------------------------------------
     * STEP 3 — Verify logged-in user
     * ------------------------------------------------
     */

    console.log(
      '[LIVE CLASS JOIN] Step 3: Checking authenticated user...'
    )

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser()

    if (userError) {
      console.error(
        '[LIVE CLASS JOIN] Auth error:',
        userError
      )

      return NextResponse.json(
        {
          error:
            'Unable to verify your login session.',
          diagnosticId,
          details:
            userError.message,
        },
        { status: 401 }
      )
    }

    if (!user) {
      console.error(
        '[LIVE CLASS JOIN] No authenticated user found.'
      )

      return NextResponse.json(
        {
          error:
            'You must be logged in to join a live class.',
          diagnosticId,
        },
        { status: 401 }
      )
    }

    console.log(
      '[LIVE CLASS JOIN] Authenticated user:',
      user.id
    )

    console.log(
      '[LIVE CLASS JOIN] User email:',
      user.email || 'NO EMAIL'
    )

    /*
     * ------------------------------------------------
     * STEP 4 — Read URL parameters
     * ------------------------------------------------
     */

    console.log(
      '[LIVE CLASS JOIN] Step 4: Reading class parameters...'
    )

    const url =
      new URL(request.url)

    const rawCode =
      url.searchParams.get('code')

    const rawId =
      url.searchParams.get('id')

    console.log(
      '[LIVE CLASS JOIN] Raw code:',
      rawCode || 'NONE'
    )

    console.log(
      '[LIVE CLASS JOIN] Raw ID:',
      rawId || 'NONE'
    )

    const code =
      rawCode
        ?.trim()
        .toUpperCase()

    const id =
      rawId?.trim()

    console.log(
      '[LIVE CLASS JOIN] Clean code:',
      code || 'NONE'
    )

    console.log(
      '[LIVE CLASS JOIN] Clean ID:',
      id || 'NONE'
    )

    /*
     * ------------------------------------------------
     * STEP 5 — Validate parameters
     * ------------------------------------------------
     */

    if (!code && !id) {
      console.error(
        '[LIVE CLASS JOIN] No code or ID supplied.'
      )

      return NextResponse.json(
        {
          error:
            'Please provide a class code or class ID.',
          diagnosticId,
        },
        { status: 400 }
      )
    }

    if (code && id) {
      console.warn(
        '[LIVE CLASS JOIN] Both code and ID supplied. Code will be used.'
      )
    }

    /*
     * ------------------------------------------------
     * STEP 6 — Create service-role client
     * ------------------------------------------------
     */

    console.log(
      '[LIVE CLASS JOIN] Step 6: Creating service-role client...'
    )

    const adminSupabase =
      getAdminSupabase()

    console.log(
      '[LIVE CLASS JOIN] Service-role client created successfully.'
    )

    /*
     * ------------------------------------------------
     * STEP 7 — Look up live class
     * ------------------------------------------------
     */

    console.log(
      '[LIVE CLASS JOIN] Step 7: Looking up live class...'
    )

    let query =
      adminSupabase
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
            status,
            created_by,
            created_at
          `
        )

    if (code) {
      console.log(
        '[LIVE CLASS JOIN] Searching by class_code:',
        code
      )

      query =
        query.eq(
          'class_code',
          code
        )
    } else {
      console.log(
        '[LIVE CLASS JOIN] Searching by class ID:',
        id
      )

      query =
        query.eq(
          'id',
          id!
        )
    }

    const {
      data: liveClass,
      error: lookupError,
    } =
      await query.maybeSingle()

    /*
     * ------------------------------------------------
     * STEP 8 — Analyze lookup result
     * ------------------------------------------------
     */

    if (lookupError) {
      console.error(
        '[LIVE CLASS JOIN] DATABASE LOOKUP ERROR:',
        lookupError
      )

      console.error(
        '[LIVE CLASS JOIN] Error code:',
        lookupError.code
      )

      console.error(
        '[LIVE CLASS JOIN] Error message:',
        lookupError.message
      )

      console.error(
        '[LIVE CLASS JOIN] Error details:',
        lookupError.details
      )

      console.error(
        '[LIVE CLASS JOIN] Error hint:',
        lookupError.hint
      )

      return NextResponse.json(
        {
          error:
            'The live class database lookup failed.',
          diagnosticId,
          databaseError: {
            code:
              lookupError.code,
            message:
              lookupError.message,
            details:
              lookupError.details,
            hint:
              lookupError.hint,
          },
        },
        { status: 500 }
      )
    }

    /*
     * ------------------------------------------------
     * STEP 9 — Class not found
     * ------------------------------------------------
     */

    if (!liveClass) {
      console.error(
        '[LIVE CLASS JOIN] ❌ NO LIVE CLASS FOUND'
      )

      console.error(
        '[LIVE CLASS JOIN] Search code:',
        code || 'NONE'
      )

      console.error(
        '[LIVE CLASS JOIN] Search ID:',
        id || 'NONE'
      )

      /*
       * Additional diagnostic:
       * Try retrieving recent live classes using
       * the service-role client.
       *
       * This helps determine whether the table contains
       * classes at all.
       */

      const {
        data: recentClasses,
        error: recentError,
      } =
        await adminSupabase
          .from('live_classes')
          .select(
            'id, title, class_code, status, created_at'
          )
          .order(
            'created_at',
            {
              ascending: false,
            }
          )
          .limit(10)

      if (recentError) {
        console.error(
          '[LIVE CLASS JOIN] Could not retrieve recent classes:',
          recentError
        )
      } else {
        console.log(
          '[LIVE CLASS JOIN] Recent classes in database:',
          recentClasses
        )

        console.log(
          '[LIVE CLASS JOIN] Number of recent classes:',
          recentClasses?.length || 0
        )
      }

      return NextResponse.json(
        {
          error:
            'Live class not found. Please check the class code or class ID.',
          diagnosticId,
          searchedFor: {
            code:
              code || null,
            id:
              id || null,
          },
          databaseClassesFound:
            recentClasses?.length || 0,
          recentClasses:
            recentClasses || [],
        },
        { status: 404 }
      )
    }

    /*
     * ------------------------------------------------
     * STEP 10 — Class found
     * ------------------------------------------------
     */

    console.log(
      '[LIVE CLASS JOIN] ✅ LIVE CLASS FOUND'
    )

    console.log(
      '[LIVE CLASS JOIN] Class ID:',
      liveClass.id
    )

    console.log(
      '[LIVE CLASS JOIN] Class code:',
      liveClass.class_code
    )

    console.log(
      '[LIVE CLASS JOIN] Class title:',
      liveClass.title
    )

    console.log(
      '[LIVE CLASS JOIN] Status:',
      liveClass.status
    )

    /*
     * ------------------------------------------------
     * STEP 11 — Return successful response
     * ------------------------------------------------
     */

    console.log(
      '[LIVE CLASS JOIN] ✅ JOIN LOOKUP SUCCESSFUL'
    )

    console.log(
      `[LIVE CLASS JOIN] Diagnostic ID: ${diagnosticId}`
    )

    console.log(
      '=================================================='
    )
    console.log('')

    return NextResponse.json({
      success: true,
      liveClass,
      studentId: user.id,
      diagnosticId,
    })
  } catch (error) {
    /*
     * ------------------------------------------------
     * Unexpected server error
     * ------------------------------------------------
     */

    console.error('')
    console.error(
      '=================================================='
    )

    console.error(
      `[LIVE CLASS JOIN] ❌ UNEXPECTED ERROR`
    )

    console.error(
      `[LIVE CLASS JOIN] Diagnostic ID: ${diagnosticId}`
    )

    console.error(
      '[LIVE CLASS JOIN] Error:',
      error
    )

    if (error instanceof Error) {
      console.error(
        '[LIVE CLASS JOIN] Error name:',
        error.name
      )

      console.error(
        '[LIVE CLASS JOIN] Error message:',
        error.message
      )

      console.error(
        '[LIVE CLASS JOIN] Error stack:',
        error.stack
      )
    }

    console.error(
      '=================================================='
    )
    console.error('')

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.',
        diagnosticId,
      },
      { status: 500 }
    )
  }
}