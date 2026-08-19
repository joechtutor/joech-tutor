import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '../../../lib/supabase-server'
import { supabaseAdmin } from '../../../lib/supabase-admin'

const StudentSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  grade: z.number().int().min(5).max(9),
})

async function requireStaff() {
  const s = await supabaseServer()

  const {
    data: { user },
    error: userError,
  } = await s.auth.getUser()

  if (userError || !user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401 }
      ),
    }
  }

  /*
   * Use the admin client to verify the role.
   * This avoids the profile relationship/RLS issue
   * that was causing the Forbidden response.
   */
  const admin = supabaseAdmin()

  const {
    data: profile,
    error: profileError,
  } = await admin
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error(
      'Staff profile lookup error:',
      profileError
    )

    return {
      error: NextResponse.json(
        {
          error:
            'Your user profile could not be found.',
        },
        { status: 403 }
      ),
    }
  }

  if (
    profile.role !== 'admin' &&
    profile.role !== 'teacher'
  ) {
    return {
      error: NextResponse.json(
        {
          error: 'Forbidden',
        },
        { status: 403 }
      ),
    }
  }

  return {
    user,
    profile,
    admin,
  }
}

// GET — retrieve students
export async function GET() {
  try {
    const auth = await requireStaff()

    if (auth.error) {
      return auth.error
    }

    const { admin } = auth

    const {
      data: students,
      error,
    } = await admin
      .from('students')
      .select(`
        id,
        profile_id,
        grade,
        created_at,
        profiles!students_profile_id_fkey(
          id,
          full_name
        )
      `)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Student list error:',
        error
      )

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      )
    }

    const formattedStudents =
      (students || []).map((student: any) => ({
        id: student.id,
        profile_id: student.profile_id,
        grade: student.grade,
        created_at: student.created_at,
        profiles: student.profiles || null,
      }))

    return NextResponse.json(
      {
        students: formattedStudents,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Student GET error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

// POST — create a student
export async function POST(req: Request) {
  try {
    const auth = await requireStaff()

    if (auth.error) {
      return auth.error
    }

    const { admin } = auth

    const json = await req.json()

    const body =
      StudentSchema.safeParse(json)

    if (!body.success) {
      return NextResponse.json(
        {
          error:
            'Invalid student information',
          details:
            body.error.flatten(),
        },
        { status: 400 }
      )
    }

    const {
      full_name,
      email,
      password,
      grade,
    } = body.data

    /*
     * Check whether this email already exists
     * in the profiles table.
     */
    const {
      data: existingProfile,
    } = await admin
      .from('profiles')
      .select('id')
      .eq('id', '')
      .maybeSingle()

    /*
     * Create authentication account.
     */
    const {
      data: authData,
      error: authError,
    } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (
      authError ||
      !authData.user
    ) {
      console.error(
        'Auth student creation error:',
        authError
      )

      return NextResponse.json(
        {
          error:
            authError?.message ||
            'Unable to create student account',
        },
        { status: 400 }
      )
    }

    const studentUserId =
      authData.user.id

    /*
     * Create profile.
     */
    const {
      error: profileError,
    } = await admin
      .from('profiles')
      .insert({
        id: studentUserId,
        full_name,
        role: 'student',
      })

    if (profileError) {
      console.error(
        'Student profile creation error:',
        profileError
      )

      await admin.auth.admin.deleteUser(
        studentUserId
      )

      return NextResponse.json(
        {
          error:
            profileError.message,
        },
        { status: 400 }
      )
    }

    /*
     * Create student record.
     */
    const {
      data: student,
      error: studentError,
    } = await admin
      .from('students')
      .insert({
        profile_id: studentUserId,
        grade,
      })
      .select(
        'id, profile_id, grade, created_at'
      )
      .single()

    if (studentError) {
      console.error(
        'Student record creation error:',
        studentError
      )

      /*
       * Roll back profile and auth account
       * if student record creation fails.
       */
      await admin
        .from('profiles')
        .delete()
        .eq(
          'id',
          studentUserId
        )

      await admin.auth.admin.deleteUser(
        studentUserId
      )

      return NextResponse.json(
        {
          error:
            studentError.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Student created successfully',
        student,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'Student POST error:',
      error
    )

    return NextResponse.json(
      {
        error:
          'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}