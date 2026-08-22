import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '../../../lib/supabase-server'
import { supabaseAdmin } from '../../../lib/supabase-admin'

const StudentSchema = z.object({
  full_name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  grade: z.number().int().min(5).max(9),
  parent_registration_id: z.string().uuid().optional(),
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
 * ============================================================
 * GET
 *
 * Retrieve all students.
 *
 * Admin and teacher only.
 * ============================================================
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
          profile_id: student.profile_id,
          grade: student.grade,
          created_at: student.created_at,
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
 * ============================================================
 * POST
 *
 * Create a new student.
 *
 * Admin and teacher only.
 *
 * Optional:
 * parent_registration_id
 *
 * When supplied, the registration must already be approved.
 * After the student is successfully created, the registration
 * is linked to the new student and marked student_created.
 * ============================================================
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

    const {
      admin,
      user,
    } = auth

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
      parent_registration_id,
    } = body.data

    /*
     * ========================================================
     * PARENT REGISTRATION VALIDATION
     * ========================================================
     */

    if (parent_registration_id) {
      const {
        data: registration,
        error: registrationError,
      } = await admin
        .from('parent_registrations')
        .select(
          'id, student_full_name, status, created_student_id'
        )
        .eq(
          'id',
          parent_registration_id
        )
        .single()

      if (
        registrationError ||
        !registration
      ) {
        console.error(
          'Parent registration lookup error:',
          registrationError
        )

        return NextResponse.json(
          {
            error:
              'Parent registration could not be found.',
          },
          {
            status: 404,
          }
        )
      }

      if (
        registration.status !==
        'approved'
      ) {
        return NextResponse.json(
          {
            error:
              'Only approved parent registrations can be linked to a student account.',
          },
          {
            status: 400,
          }
        )
      }

      if (
        registration.created_student_id
      ) {
        return NextResponse.json(
          {
            error:
              'A student account has already been linked to this registration.',
          },
          {
            status: 400,
          }
        )
      }

      /*
       * Make sure the student name being created
       * matches the approved registration.
       */
      if (
        full_name.trim().toLowerCase() !==
        registration.student_full_name
          .trim()
          .toLowerCase()
      ) {
        return NextResponse.json(
          {
            error:
              'The student name does not match the approved parent registration.',
          },
          {
            status: 400,
          }
        )
      }
    }

    /*
     * ========================================================
     * CREATE AUTHENTICATION ACCOUNT
     * ========================================================
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
     * ========================================================
     * CREATE PROFILE
     * ========================================================
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
        {
          status: 400,
        }
      )
    }

    /*
     * ========================================================
     * CREATE STUDENT RECORD
     * ========================================================
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
        {
          status: 400,
        }
      )
    }

    /*
     * ========================================================
     * LINK STUDENT TO PARENT REGISTRATION
     * ========================================================
     */

    if (parent_registration_id) {
      const {
        error:
          registrationUpdateError,
      } = await admin
        .from('parent_registrations')
        .update({
          created_student_id:
            student.id,
          status:
            'student_created',
          reviewed_at:
            new Date().toISOString(),
          reviewed_by:
            user.id,
        })
        .eq(
          'id',
          parent_registration_id
        )

      if (
        registrationUpdateError
      ) {
        console.error(
          'Parent registration linking error:',
          registrationUpdateError
        )

        /*
         * Roll back the newly-created
         * student account if the registration
         * cannot be linked.
         */

        await admin
          .from('students')
          .delete()
          .eq(
            'id',
            student.id
          )

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
              'The student account was not created because the parent registration could not be linked.',
          },
          {
            status: 400,
          }
        )
      }
    }

    /*
     * ========================================================
     * SUCCESS
     * ========================================================
     */

    return NextResponse.json(
      {
        message:
          parent_registration_id
            ? 'Student created and parent registration linked successfully.'
            : 'Student created successfully.',
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
 * ============================================================
 * DELETE
 *
 * Delete a student completely.
 * ============================================================
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
     * Delete attempts/results first.
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
     * Delete student record.
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
     * Delete profile.
     */
    if (profileId) {
      const {
        error:
          profileDeleteError,
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
      }

      /*
       * Delete authentication account.
       */
      const {
        error:
          authDeleteError,
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