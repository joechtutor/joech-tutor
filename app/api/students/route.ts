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
  const supabase = await supabaseServer()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      error: NextResponse.json(
        {
          error: 'Unauthenticated',
        },
        {
          status: 401,
        }
      ),
    }
  }

  /*
   * Use the admin client to verify the role.
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
        {
          status: 403,
        }
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
        {
          status: 403,
        }
      ),
    }
  }

  return {
    user,
    profile,
    admin,
  }
}

/*
 * GET
 *
 * Retrieve all students.
 *
 * Admin and teacher only.
 */
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
        {
          status: 400,
        }
      )
    }

    const formattedStudents =
      (students || []).map(
        (student: any) => ({
          id: student.id,

          profile_id:
            student.profile_id,

          grade:
            student.grade,

          created_at:
            student.created_at,

          profiles:
            student.profiles ||
            null,
        })
      )

    return NextResponse.json(
      {
        students:
          formattedStudents,
      },
      {
        status: 200,
      }
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
      {
        status: 500,
      }
    )
  }
}

/*
 * POST
 *
 * Create a new student.
 *
 * Admin and teacher only.
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

    const { admin } = auth

    const json =
      await req.json()

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
        {
          status: 400,
        }
      )
    }

    const {
      full_name,
      email,
      password,
      grade,
    } = body.data

    /*
     * Create authentication account.
     */
    const {
      data: authData,
      error: authError,
    } =
      await admin.auth.admin.createUser(
        {
          email,
          password,
          email_confirm: true,
        }
      )

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
        {
          status: 400,
        }
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

      /*
       * Roll back authentication
       * account if profile creation fails.
       */
      await admin.auth.admin.deleteUser(
        studentUserId
      )

      return NextResponse.json(
        {
          error:
            profileError.message,
        },
        {
          status: 400,
        }
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
        profile_id:
          studentUserId,

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
       * Roll back profile.
       */
      await admin
        .from('profiles')
        .delete()
        .eq(
          'id',
          studentUserId
        )

      /*
       * Roll back authentication
       * account.
       */
      await admin.auth.admin.deleteUser(
        studentUserId
      )

      return NextResponse.json(
        {
          error:
            studentError.message,
        },
        {
          status: 400,
        }
      )
    }

    return NextResponse.json(
      {
        message:
          'Student created successfully',

        student,
      },
      {
        status: 201,
      }
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
      {
        status: 500,
      }
    )
  }
}

/*
 * DELETE
 *
 * Delete a student completely.
 *
 * This removes:
 *
 * 1. Student assessment attempts/results
 * 2. Student record
 * 3. Student profile
 * 4. Supabase Auth account
 *
 * Assessment assignments are automatically
 * removed because assessment_assignments.student_id
 * uses ON DELETE CASCADE.
 *
 * Admin and teacher only.
 */
export async function DELETE(
  req: Request
) {
  try {
    const auth =
      await requireStaff()

    if (auth.error) {
      return auth.error
    }

    const { admin } = auth

    /*
     * Get student ID.
     *
     * The frontend can send:
     *
     * /api/students?id=STUDENT_ID
     */
    const url =
      new URL(req.url)

    const studentId =
      url.searchParams.get(
        'id'
      )

    if (!studentId) {
      return NextResponse.json(
        {
          error:
            'Student ID is required.',
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Validate UUID.
     */
    const uuidResult =
      z.string().uuid().safeParse(
        studentId
      )

    if (!uuidResult.success) {
      return NextResponse.json(
        {
          error:
            'Invalid student ID.',
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Find the student.
     */
    const {
      data: student,
      error: studentError,
    } = await admin
      .from('students')
      .select(
        'id, profile_id, grade'
      )
      .eq(
        'id',
        studentId
      )
      .single()

    if (
      studentError ||
      !student
    ) {
      console.error(
        'Student lookup before deletion:',
        studentError
      )

      return NextResponse.json(
        {
          error:
            'Student not found.',
        },
        {
          status: 404,
        }
      )
    }

    const profileId =
      student.profile_id

    /*
     * STEP 1
     *
     * Delete all assessment attempts/results
     * belonging to the student.
     *
     * This is required because:
     *
     * attempts.user_id references profiles.id
     * without ON DELETE CASCADE.
     */
    if (profileId) {
      const {
        error: attemptsError,
      } = await admin
        .from('attempts')
        .delete()
        .eq(
          'user_id',
          profileId
        )

      if (attemptsError) {
        console.error(
          'Student attempts deletion error:',
          attemptsError
        )

        return NextResponse.json(
          {
            error:
              'Unable to remove the student results. The student was not deleted.',
          },
          {
            status: 400,
          }
        )
      }
    }

    /*
     * STEP 2
     *
     * Delete the student record.
     *
     * assessment_assignments.student_id
     * has ON DELETE CASCADE, so all assignments
     * belonging to this student will also be
     * removed automatically.
     */
    const {
      error: deleteStudentError,
    } = await admin
      .from('students')
      .delete()
      .eq(
        'id',
        studentId
      )

    if (deleteStudentError) {
      console.error(
        'Student record deletion error:',
        deleteStudentError
      )

      return NextResponse.json(
        {
          error:
            deleteStudentError.message,
        },
        {
          status: 400,
        }
      )
    }

    /*
     * STEP 3
     *
     * Delete the student's profile.
     */
    if (profileId) {
      const {
        error: profileDeleteError,
      } = await admin
        .from('profiles')
        .delete()
        .eq(
          'id',
          profileId
        )

      if (profileDeleteError) {
        console.error(
          'Student profile deletion error:',
          profileDeleteError
        )

        /*
         * At this point the student record
         * has already been removed.
         *
         * The authentication account is still
         * removed below.
         */
      }

      /*
       * STEP 4
       *
       * Delete the Supabase authentication
       * account.
       */
      const {
        error: authDeleteError,
      } =
        await admin.auth.admin.deleteUser(
          profileId
        )

      if (authDeleteError) {
        console.error(
          'Student auth deletion error:',
          authDeleteError
        )

        return NextResponse.json(
          {
            message:
              'Student record removed, but the authentication account could not be removed.',
            warning:
              authDeleteError.message,
          },
          {
            status: 200,
          }
        )
      }
    }

    /*
     * SUCCESS
     */
    return NextResponse.json(
      {
        message:
          'Student deleted successfully.',
      },
      {
        status: 200,
      }
    )
  } catch (error) {
    console.error(
      'Student DELETE error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.',
      },
      {
        status: 500,
      }
    )
  }
}