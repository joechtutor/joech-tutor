import { NextResponse } from 'next/server'
import { z } from 'zod'
import * as XLSX from 'xlsx'
import { supabaseServer } from '../../../lib/supabase-server'
import { supabaseAdmin } from '../../../lib/supabase-admin'

const QuestionSchema = z.object({
  subject: z.enum(['Mathematics', 'English']),
  grade: z.number().int().min(5).max(9),
  topic: z.string().min(2).max(100),
  difficulty: z.enum([
    'Foundation',
    'Intermediate',
    'Advanced',
  ]),
  prompt: z.string().min(5).max(5000),
  options: z
    .array(z.string().min(1).max(500))
    .min(2)
    .max(6),
  correct_option: z.number().int().min(0).max(5),
  explanation: z
    .string()
    .max(5000)
    .optional()
    .nullable(),
})

async function requireStaff() {
  const supabase = await supabaseServer()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('Authentication error:', authError)
  }

  if (!user) {
    return {
      error: NextResponse.json(
        {
          error:
            'Unauthenticated. Please log in again.',
        },
        { status: 401 }
      ),
    }
  }

  const {
    data: role,
    error: roleError,
  } = await supabase.rpc('my_role')

  if (roleError) {
    console.error(
      'Role lookup error:',
      roleError
    )

    return {
      error: NextResponse.json(
        {
          error:
            'Unable to verify your account role.',
          details: roleError.message,
        },
        { status: 500 }
      ),
    }
  }

  if (
    role !== 'admin' &&
    role !== 'teacher'
  ) {
    console.error(
      'Forbidden question access. User:',
      user.id,
      'Role:',
      role
    )

    return {
      error: NextResponse.json(
        {
          error:
            'Forbidden. Only administrators and teachers can manage questions.',
          role: role || null,
        },
        { status: 403 }
      ),
    }
  }

  return {
    user,
    role,
  }
}

/*
 * GET
 * List all questions.
 */
export async function GET() {
  try {
    const auth = await requireStaff()

    if (auth.error) {
      return auth.error
    }

    const admin = supabaseAdmin()

    const {
      data: questions,
      error,
    } = await admin
      .from('questions')
      .select(`
        id,
        subject,
        grade,
        topic,
        difficulty,
        prompt,
        options,
        correct_option,
        explanation,
        created_at
      `)
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Question list error:',
        error
      )

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        questions: questions || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      'Question GET error:',
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

/*
 * Convert an Excel cell into clean text.
 */
function cellText(value: unknown): string {
  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  return String(value).trim()
}

/*
 * Normalize text before comparison.
 */
function normalizeAnswer(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

/*
 * Normalize Excel column headers.
 */
function normalizeHeader(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

/*
 * Find an Excel column using
 * several possible names.
 */
function findColumn(
  headers: string[],
  possibleNames: string[]
): number {
  return headers.findIndex(
    (header) => {
      const normalized =
        normalizeHeader(header)

      return possibleNames.some(
        (name) =>
          normalized ===
          normalizeHeader(name)
      )
    }
  )
}

/*
 * Convert a teacher's Correct Answer
 * value into the database correct_option.
 *
 * Supported formats:
 *
 * A
 * B
 * C
 * D
 *
 * Option A
 * Option B
 * Option C
 * Option D
 *
 * 0
 * 1
 * 2
 * 3
 *
 * A.
 * B.
 * C.
 * D.
 *
 * A)
 * B)
 * C)
 * D)
 *
 * The full answer text is also supported
 * for backward compatibility.
 *
 * Examples:
 *
 * Correct Answer = B
 * Options = [3, 4, 5, 6]
 * Result = 1
 *
 * Correct Answer = Option C
 * Result = 2
 *
 * Correct Answer = 15
 * Options = [10, 12, 15, 20]
 * Result = 2
 */
function resolveCorrectOption(
  correctAnswer: string,
  options: string[]
): number {
  const normalized =
    normalizeAnswer(correctAnswer)

  /*
   * First support the teacher-preferred
   * A / B / C / D format.
   */
  const letterMatch =
    normalized.match(
      /^(?:option\s*)?([abcd])[\.\)]?$/
    )

  if (letterMatch) {
    const letter =
      letterMatch[1].toUpperCase()

    return (
      letter.charCodeAt(0) -
      'A'.charCodeAt(0)
    )
  }

  /*
   * Support numeric zero-based answers:
   *
   * 0 = A
   * 1 = B
   * 2 = C
   * 3 = D
   */
  if (
    /^[0-3]$/.test(normalized)
  ) {
    return Number(normalized)
  }

  /*
   * Backward compatibility:
   * Also allow the complete answer text.
   */
  const fullTextIndex =
    options.findIndex(
      (option) =>
        normalizeAnswer(option) ===
        normalized
    )

  return fullTextIndex
}

/*
 * Import Excel questions.
 *
 * Required Excel columns:
 *
 * Question
 * Option A
 * Option B
 * Option C
 * Option D
 * Correct Answer
 */
async function importExcel(
  req: Request,
  userId: string
) {
  try {
    const formData =
      await req.formData()

    const file =
      formData.get('file')

    const subject = cellText(
      formData.get('subject')
    )

    const gradeText = cellText(
      formData.get('grade')
    )

    const topic = cellText(
      formData.get('topic')
    )

    const difficulty = cellText(
      formData.get('difficulty')
    )

    /*
     * Check that a file was uploaded.
     */
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            'Please select an Excel file.',
        },
        { status: 400 }
      )
    }

    /*
     * Check Excel extension.
     */
    const fileName =
      file.name.toLowerCase()

    if (
      !fileName.endsWith('.xlsx') &&
      !fileName.endsWith('.xls')
    ) {
      return NextResponse.json(
        {
          error:
            'Please upload an Excel file (.xlsx or .xls).',
        },
        { status: 400 }
      )
    }

    /*
     * Validate subject.
     */
    if (!subject) {
      return NextResponse.json(
        {
          error:
            'Please select a subject before uploading the Excel file.',
        },
        { status: 400 }
      )
    }

    if (
      subject !== 'Mathematics' &&
      subject !== 'English'
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid subject selected.',
        },
        { status: 400 }
      )
    }

    /*
     * Validate grade.
     */
    const grade =
      Number(gradeText)

    if (
      !Number.isInteger(grade) ||
      grade < 5 ||
      grade > 9
    ) {
      return NextResponse.json(
        {
          error:
            'Please select a valid grade from Grade 5 to Grade 9.',
        },
        { status: 400 }
      )
    }

    /*
     * Validate topic.
     */
    if (
      !topic ||
      topic.length < 2 ||
      topic.length > 100
    ) {
      return NextResponse.json(
        {
          error:
            'Please enter a valid topic before uploading.',
        },
        { status: 400 }
      )
    }

    /*
     * Validate difficulty.
     */
    if (
      difficulty !== 'Foundation' &&
      difficulty !== 'Intermediate' &&
      difficulty !== 'Advanced'
    ) {
      return NextResponse.json(
        {
          error:
            'Please select a valid difficulty.',
        },
        { status: 400 }
      )
    }

    /*
     * Maximum file size:
     * 5 MB.
     */
    if (
      file.size >
      5 * 1024 * 1024
    ) {
      return NextResponse.json(
        {
          error:
            'The Excel file is too large. Maximum size is 5 MB.',
        },
        { status: 400 }
      )
    }

    /*
     * Read Excel file.
     */
    const arrayBuffer =
      await file.arrayBuffer()

    const workbook =
      XLSX.read(arrayBuffer, {
        type: 'array',
      })

    /*
     * Make sure workbook contains
     * at least one worksheet.
     */
    if (
      !workbook.SheetNames ||
      workbook.SheetNames.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'The Excel workbook does not contain a worksheet.',
        },
        { status: 400 }
      )
    }

    /*
     * Use the first worksheet.
     */
    const firstSheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ]

    /*
     * Convert worksheet into rows.
     */
    const rows =
      XLSX.utils.sheet_to_json<unknown[]>(
        firstSheet,
        {
          header: 1,
          defval: '',
          blankrows: false,
        }
      )

    /*
     * Require header + question rows.
     */
    if (rows.length < 2) {
      return NextResponse.json(
        {
          error:
            'The Excel file does not contain any questions.',
        },
        { status: 400 }
      )
    }

    /*
     * Read first row as headers.
     */
    const headerRow =
      (rows[0] || []).map(
        (value) =>
          cellText(value)
      )

    /*
     * Find Question column.
     */
    const questionColumn =
      findColumn(
        headerRow,
        [
          'Question',
          'Prompt',
        ]
      )

    /*
     * Find Option A column.
     */
    const optionAColumn =
      findColumn(
        headerRow,
        [
          'Option A',
          'A',
        ]
      )

    /*
     * Find Option B column.
     */
    const optionBColumn =
      findColumn(
        headerRow,
        [
          'Option B',
          'B',
        ]
      )

    /*
     * Find Option C column.
     */
    const optionCColumn =
      findColumn(
        headerRow,
        [
          'Option C',
          'C',
        ]
      )

    /*
     * Find Option D column.
     */
    const optionDColumn =
      findColumn(
        headerRow,
        [
          'Option D',
          'D',
        ]
      )

    /*
     * Find Correct Answer column.
     *
     * The preferred format is:
     *
     * Correct Answer
     *
     * containing A, B, C or D.
     */
    const correctAnswerColumn =
      findColumn(
        headerRow,
        [
          'Correct Answer',
          'Correct Answer (A/B/C/D)',
          'Correct Answer (Full Text)',
          'Correct Option',
          'Answer',
        ]
      )

    /*
     * Check required columns.
     */
    const missingColumns: string[] =
      []

    if (
      questionColumn === -1
    ) {
      missingColumns.push(
        'Question'
      )
    }

    if (
      optionAColumn === -1
    ) {
      missingColumns.push(
        'Option A'
      )
    }

    if (
      optionBColumn === -1
    ) {
      missingColumns.push(
        'Option B'
      )
    }

    if (
      optionCColumn === -1
    ) {
      missingColumns.push(
        'Option C'
      )
    }

    if (
      optionDColumn === -1
    ) {
      missingColumns.push(
        'Option D'
      )
    }

    if (
      correctAnswerColumn === -1
    ) {
      missingColumns.push(
        'Correct Answer'
      )
    }

    if (
      missingColumns.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            'The Excel file is missing required columns.',
          missingColumns,
          expectedColumns: [
            'Question',
            'Option A',
            'Option B',
            'Option C',
            'Option D',
            'Correct Answer',
          ],
        },
        { status: 400 }
      )
    }

    /*
     * Prepare questions for Supabase.
     */
    const questionsToInsert: Array<{
      subject: string
      grade: number
      topic: string
      difficulty: string
      prompt: string
      options: string[]
      correct_option: number
      explanation: string | null
      created_by: string
    }> = []

    /*
     * Store Excel row errors.
     */
    const errors: Array<{
      row: number
      error: string
    }> = []

    /*
     * Process each question row.
     */
    for (
      let i = 1;
      i < rows.length;
      i++
    ) {
      const row =
        rows[i] || []

      const excelRowNumber =
        i + 1

      const prompt =
        cellText(
          row[questionColumn]
        )

      const optionA =
        cellText(
          row[optionAColumn]
        )

      const optionB =
        cellText(
          row[optionBColumn]
        )

      const optionC =
        cellText(
          row[optionCColumn]
        )

      const optionD =
        cellText(
          row[optionDColumn]
        )

      const correctAnswer =
        cellText(
          row[correctAnswerColumn]
        )

      /*
       * Ignore completely blank rows.
       */
      if (
        !prompt &&
        !optionA &&
        !optionB &&
        !optionC &&
        !optionD &&
        !correctAnswer
      ) {
        continue
      }

      /*
       * Validate question.
       */
      if (!prompt) {
        errors.push({
          row: excelRowNumber,
          error:
            'Question is empty.',
        })

        continue
      }

      if (
        prompt.length < 5
      ) {
        errors.push({
          row: excelRowNumber,
          error:
            'Question must contain at least 5 characters.',
        })

        continue
      }

      if (
        prompt.length > 5000
      ) {
        errors.push({
          row: excelRowNumber,
          error:
            'Question must not exceed 5000 characters.',
        })

        continue
      }

      /*
       * Create four options.
       */
      const options = [
        optionA,
        optionB,
        optionC,
        optionD,
      ]

      /*
       * All four options are required.
       */
      if (
        options.some(
          (option) => !option
        )
      ) {
        errors.push({
          row: excelRowNumber,
          error:
            'All four answer options are required.',
        })

        continue
      }

      /*
       * Check option length.
       */
      if (
        options.some(
          (option) =>
            option.length > 500
        )
      ) {
        errors.push({
          row: excelRowNumber,
          error:
            'Each answer option must not exceed 500 characters.',
        })

        continue
      }

      /*
       * Correct answer required.
       */
      if (!correctAnswer) {
        errors.push({
          row: excelRowNumber,
          error:
            'Correct Answer is required. Enter A, B, C or D.',
        })

        continue
      }

      /*
       * Resolve the correct answer.
       *
       * Preferred:
       *
       * A = 0
       * B = 1
       * C = 2
       * D = 3
       *
       * Also accepts:
       *
       * Option A
       * Option B
       * Option C
       * Option D
       *
       * 0 / 1 / 2 / 3
       *
       * Full answer text is also accepted
       * for backward compatibility.
       */
      const correctIndex =
        resolveCorrectOption(
          correctAnswer,
          options
        )

      /*
       * Make sure the resolved index
       * actually points to one of the
       * four supplied options.
       */
      if (
        correctIndex < 0 ||
        correctIndex >= options.length
      ) {
        errors.push({
          row: excelRowNumber,
          error:
            `Correct Answer "${correctAnswer}" is invalid. Enter A, B, C or D, or enter the exact answer text.`,
        })

        continue
      }

      /*
       * Add valid question.
       */
      questionsToInsert.push({
        subject,
        grade,
        topic,
        difficulty,
        prompt,
        options,
        correct_option:
          correctIndex,
        explanation: null,
        created_by: userId,
      })
    }

    /*
     * Prevent partial imports.
     */
    if (
      errors.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            'The Excel file contains invalid questions. No questions were imported.',
          errors,
          validQuestions:
            questionsToInsert.length,
          totalRows:
            rows.length - 1,
        },
        { status: 400 }
      )
    }

    /*
     * Make sure there is at least
     * one question.
     */
    if (
      questionsToInsert.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'No valid questions were found in the Excel file.',
        },
        { status: 400 }
      )
    }

    /*
     * Insert all questions into Supabase.
     */
    const admin =
      supabaseAdmin()

    const {
      data: insertedQuestions,
      error: insertError,
    } = await admin
      .from('questions')
      .insert(
        questionsToInsert
      )
      .select(`
        id,
        subject,
        grade,
        topic,
        difficulty,
        prompt,
        options,
        correct_option,
        explanation,
        created_at
      `)

    /*
     * Handle Supabase error.
     */
    if (insertError) {
      console.error(
        'Bulk question insert error:',
        insertError
      )

      return NextResponse.json(
        {
          error:
            insertError.message,
          details:
            insertError.details ||
            null,
          hint:
            insertError.hint ||
            null,
          code:
            insertError.code ||
            null,
        },
        { status: 400 }
      )
    }

    /*
     * Successful import.
     */
    return NextResponse.json(
      {
        message:
          `${insertedQuestions?.length || 0} questions imported successfully.`,
        imported:
          insertedQuestions?.length ||
          0,
        questions:
          insertedQuestions || [],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'Excel import error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to import Excel questions.',
      },
      { status: 500 }
    )
  }
}

/*
 * POST
 *
 * Supports:
 *
 * 1. Normal single-question JSON creation
 * 2. Excel bulk question import
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

    const contentType =
      req.headers.get(
        'content-type'
      ) || ''

    /*
     * Excel upload.
     */
    if (
      contentType
        .toLowerCase()
        .includes(
          'multipart/form-data'
        )
    ) {
      return importExcel(
        req,
        auth.user.id
      )
    }

    /*
     * Normal JSON question creation.
     */
    let requestBody: unknown

    try {
      requestBody =
        await req.json()
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid JSON request.',
        },
        { status: 400 }
      )
    }

    const body =
      QuestionSchema.safeParse(
        requestBody
      )

    if (!body.success) {
      return NextResponse.json(
        {
          error:
            'Invalid question information.',
          details:
            body.error.flatten(),
        },
        { status: 400 }
      )
    }

    /*
     * Make sure correct option exists.
     */
    if (
      body.data.correct_option >=
      body.data.options.length
    ) {
      return NextResponse.json(
        {
          error:
            'Correct answer must match one of the answer options.',
        },
        { status: 400 }
      )
    }

    const admin =
      supabaseAdmin()

    /*
     * Insert single question.
     */
    const {
      data: question,
      error,
    } = await admin
      .from('questions')
      .insert({
        subject:
          body.data.subject,
        grade:
          body.data.grade,
        topic:
          body.data.topic,
        difficulty:
          body.data.difficulty,
        prompt:
          body.data.prompt,
        options:
          body.data.options,
        correct_option:
          body.data.correct_option,
        explanation:
          body.data.explanation ||
          null,
        created_by:
          auth.user.id,
      })
      .select(`
        id,
        subject,
        grade,
        topic,
        difficulty,
        prompt,
        options,
        correct_option,
        explanation,
        created_at
      `)
      .single()

    if (error) {
      console.error(
        'Question creation error:',
        error
      )

      return NextResponse.json(
        {
          error:
            error.message,
          details:
            error.details ||
            null,
          hint:
            error.hint ||
            null,
          code:
            error.code ||
            null,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Question created successfully.',
        question,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'Question POST error:',
      error
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