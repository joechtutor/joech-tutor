'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Question = {
  id: string
  subject: string
  grade: number
  topic: string | null
  difficulty: string
  prompt: string
  options: string[] | null
}

type AssessmentQuestion = {
  question_id: string
  position: number
  question?: Question | null
}

type Assessment = {
  id: string
  title: string
  subject: string
  grade: number
  duration_minutes: number
  created_at: string
  assessment_questions?: AssessmentQuestion[]
}

type Student = {
  id: string
  full_name: string
  email: string | null
  grade: number
}

type Assignment = {
  assessment_id: string
  student_id: string
  assigned_at: string
  student_name: string
  student_email: string | null
  grade: number | null
}

export default function AssessmentDetailsPage() {
  const params = useParams<{ id: string }>()
  const assessmentId = params?.id

  const [assessment, setAssessment] =
    useState<Assessment | null>(null)

  const [students, setStudents] =
    useState<Student[]>([])

  const [assignments, setAssignments] =
    useState<Assignment[]>([])

  const [selectedStudentId, setSelectedStudentId] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [studentsLoading, setStudentsLoading] =
    useState(true)

  const [assigning, setAssigning] =
    useState(false)

  const [error, setError] =
    useState('')

  const [assignmentError, setAssignmentError] =
    useState('')

  const [successMessage, setSuccessMessage] =
    useState('')

  async function loadAssessment() {
    if (!assessmentId) {
      setError('Assessment ID is missing.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        `/api/assessments/${assessmentId}`,
        {
          cache: 'no-store',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Unable to load assessment'
        )
      }

      setAssessment(
        data.assessment || data
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load assessment'
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadStudents() {
    try {
      setStudentsLoading(true)

      const response = await fetch(
        '/api/students/list',
        {
          cache: 'no-store',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Unable to load students'
        )
      }

      const studentList =
        Array.isArray(data.students)
          ? data.students
          : []

      setStudents(studentList)
    } catch (err) {
      setAssignmentError(
        err instanceof Error
          ? err.message
          : 'Unable to load students'
      )
    } finally {
      setStudentsLoading(false)
    }
  }

  async function loadAssignments() {
    if (!assessmentId) return

    try {
      const response = await fetch(
        '/api/assignments',
        {
          cache: 'no-store',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Unable to load assignments'
        )
      }

      const allAssignments =
        Array.isArray(data.assignments)
          ? data.assignments
          : []

      const assessmentAssignments =
        allAssignments.filter(
          (assignment: Assignment) =>
            assignment.assessment_id ===
            assessmentId
        )

      setAssignments(
        assessmentAssignments
      )
    } catch (err) {
      console.error(
        'Assignment loading error:',
        err
      )
    }
  }

  useEffect(() => {
    loadAssessment()
    loadStudents()
  }, [assessmentId])

  useEffect(() => {
    if (assessmentId) {
      loadAssignments()
    }
  }, [assessmentId])

  async function handleAssign() {
    if (!assessmentId) {
      setAssignmentError(
        'Assessment ID is missing.'
      )
      return
    }

    if (!selectedStudentId) {
      setAssignmentError(
        'Please select a student.'
      )
      return
    }

    try {
      setAssigning(true)
      setAssignmentError('')
      setSuccessMessage('')

      const response = await fetch(
        '/api/assignments',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            assessment_id:
              assessmentId,
            student_id:
              selectedStudentId,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Unable to assign assessment.'
        )
      }

      setSuccessMessage(
        'Assessment assigned successfully.'
      )

      setSelectedStudentId('')

      await loadAssignments()
    } catch (err) {
      setAssignmentError(
        err instanceof Error
          ? err.message
          : 'Unable to assign assessment.'
      )
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <main className="page">
        <header className="header">
          <div className="headerInner">
            <Link
              href="/dashboard"
              className="brand"
            >
              <Image
                src="/joech-logo.jpg"
                alt="JOECH TUTOR"
                width={58}
                height={58}
                priority
                className="logo"
              />

              <div>
                <div className="brandName">
                  JOECH TUTOR
                </div>

                <div className="brandMotto">
                  Excellence Beyond Borders
                </div>
              </div>
            </Link>
          </div>
        </header>

        <div className="loadingPage">
          <div className="loadingSpinner" />
          <h2>Loading Assessment</h2>
          <p>
            Please wait while the assessment details
            are being loaded.
          </p>
        </div>

        <style jsx>{styles}</style>
      </main>
    )
  }

  if (error || !assessment) {
    return (
      <main className="page">
        <header className="header">
          <div className="headerInner">
            <Link
              href="/dashboard"
              className="brand"
            >
              <Image
                src="/joech-logo.jpg"
                alt="JOECH TUTOR"
                width={58}
                height={58}
                priority
                className="logo"
              />

              <div>
                <div className="brandName">
                  JOECH TUTOR
                </div>

                <div className="brandMotto">
                  Excellence Beyond Borders
                </div>
              </div>
            </Link>

            <div className="headerRight">
              <div className="portalBadge">
                <span className="onlineDot" />
                Admin Portal
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          <Link
            href="/dashboard/assessments"
            className="backLink"
          >
            ← Back to Assessments
          </Link>

          <section className="errorCard">
            <div className="errorIcon">!</div>

            <h1>Unable to Load Assessment</h1>

            <p>
              {error ||
                'Assessment not found.'}
            </p>

            <Link
              href="/dashboard/assessments"
              className="primaryButton"
            >
              Return to Assessments
            </Link>
          </section>
        </div>

        <style jsx>{styles}</style>
      </main>
    )
  }

  const questions = [
    ...(assessment.assessment_questions ||
      []),
  ].sort(
    (a, b) =>
      a.position - b.position
  )

  const matchingStudents =
    students.filter(
      (student) =>
        Number(student.grade) ===
        Number(assessment.grade)
    )

  const assignedStudentIds =
    new Set(
      assignments.map(
        (assignment) =>
          assignment.student_id
      )
    )

  const availableStudents =
    matchingStudents.filter(
      (student) =>
        !assignedStudentIds.has(
          student.id
        )
    )

  return (
    <main className="page">
      <header className="header">
        <div className="headerInner">
          <Link
            href="/dashboard"
            className="brand"
          >
            <Image
              src="/joech-logo.jpg"
              alt="JOECH TUTOR"
              width={58}
              height={58}
              priority
              className="logo"
            />

            <div>
              <div className="brandName">
                JOECH TUTOR
              </div>

              <div className="brandMotto">
                Excellence Beyond Borders
              </div>
            </div>
          </Link>

          <div className="headerRight">
            <div className="portalBadge">
              <span className="onlineDot" />
              Admin Portal
            </div>

            <Link
              href="/dashboard"
              className="dashboardLink"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="content">
        <Link
          href="/dashboard/assessments"
          className="backLink"
        >
          ← Back to Assessment Management
        </Link>

        {/* HERO */}

        <section className="hero">
          <div className="heroMain">
            <div className="eyebrow">
              ASSESSMENT DETAILS
            </div>

            <h1>{assessment.title}</h1>

            <p>
              Review assessment information,
              manage student assignments, and
              view all questions included in
              this assessment.
            </p>
          </div>

          <div className="heroSubject">
            <div className="subjectLargeIcon">
              {assessment.subject ===
              'Mathematics'
                ? '∑'
                : 'Aa'}
            </div>

            <div>
              <span>SUBJECT</span>
              <strong>
                {assessment.subject}
              </strong>
            </div>
          </div>
        </section>

        {/* SUMMARY */}

        <section className="summaryGrid">
          <div className="summaryCard">
            <div className="summaryIcon blue">
              ◈
            </div>

            <div>
              <span>Grade</span>
              <strong>
                Grade {assessment.grade}
              </strong>
            </div>
          </div>

          <div className="summaryCard">
            <div className="summaryIcon purple">
              ◷
            </div>

            <div>
              <span>Duration</span>
              <strong>
                {assessment.duration_minutes} min
              </strong>
            </div>
          </div>

          <div className="summaryCard">
            <div className="summaryIcon orange">
              ?
            </div>

            <div>
              <span>Questions</span>
              <strong>
                {questions.length}
              </strong>
            </div>
          </div>

          <div className="summaryCard">
            <div className="summaryIcon green">
              ♙
            </div>

            <div>
              <span>Assigned</span>
              <strong>
                {assignments.length}
              </strong>
            </div>
          </div>
        </section>

        {/* INFORMATION */}

        <section className="card informationCard">
          <div className="sectionHeader">
            <div>
              <div className="sectionNumber">
                01
              </div>

              <h2>
                Assessment Information
              </h2>

              <p>
                Basic information about this
                assessment.
              </p>
            </div>

            <span className="activeBadge">
              ● Active
            </span>
          </div>

          <div className="informationGrid">
            <div className="informationItem">
              <span>Assessment Title</span>
              <strong>
                {assessment.title}
              </strong>
            </div>

            <div className="informationItem">
              <span>Subject</span>
              <strong>
                {assessment.subject}
              </strong>
            </div>

            <div className="informationItem">
              <span>Grade</span>
              <strong>
                Grade {assessment.grade}
              </strong>
            </div>

            <div className="informationItem">
              <span>Duration</span>
              <strong>
                {assessment.duration_minutes}{' '}
                minutes
              </strong>
            </div>

            <div className="informationItem">
              <span>Total Questions</span>
              <strong>
                {questions.length}
              </strong>
            </div>

            <div className="informationItem">
              <span>Date Created</span>
              <strong>
                {new Date(
                  assessment.created_at
                ).toLocaleDateString(
                  undefined,
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </strong>
            </div>
          </div>
        </section>

        {/* ASSIGNMENT */}

        <section className="card assignmentCard">
          <div className="sectionHeader">
            <div>
              <div className="sectionNumber">
                02
              </div>

              <h2>
                Assign Assessment
              </h2>

              <p>
                Assign this assessment to a
                Grade {assessment.grade} student.
                Only students in the matching
                grade are shown.
              </p>
            </div>

            <div className="assignmentCount">
              <strong>
                {assignments.length}
              </strong>

              <span>
                Student
                {assignments.length === 1
                  ? ''
                  : 's'} assigned
              </span>
            </div>
          </div>

          {assignmentError && (
            <div className="message errorMessage">
              <span>!</span>
              {assignmentError}
            </div>
          )}

          {successMessage && (
            <div className="message successMessage">
              <span>✓</span>
              {successMessage}
            </div>
          )}

          {studentsLoading ? (
            <div className="loadingBox">
              <div className="smallSpinner" />
              Loading students...
            </div>
          ) : availableStudents.length ===
            0 ? (
            <div className="noStudentsBox">
              <div className="noStudentsIcon">
                ♙
              </div>

              <div>
                <strong>
                  No available students
                </strong>

                <p>
                  There are no Grade{' '}
                  {assessment.grade} students
                  available for this assessment,
                  or all matching students have
                  already been assigned it.
                </p>
              </div>
            </div>
          ) : (
            <div className="assignRow">
              <div className="studentSelectWrapper">
                <label htmlFor="student">
                  Select Student
                </label>

                <select
                  id="student"
                  value={
                    selectedStudentId
                  }
                  onChange={(event) =>
                    setSelectedStudentId(
                      event.target.value
                    )
                  }
                  disabled={assigning}
                  className="studentSelect"
                >
                  <option value="">
                    -- Select a student --
                  </option>

                  {availableStudents.map(
                    (student) => (
                      <option
                        key={student.id}
                        value={student.id}
                      >
                        {student.full_name} — Grade{' '}
                        {student.grade}
                        {student.email
                          ? ` — ${student.email}`
                          : ''}
                      </option>
                    )
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAssign}
                disabled={
                  assigning ||
                  !selectedStudentId
                }
                className="assignButton"
              >
                {assigning ? (
                  <>
                    <span className="buttonSpinner" />
                    Assigning...
                  </>
                ) : (
                  <>
                    Assign Assessment
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* ASSIGNED STUDENTS */}

        <section className="card">
          <div className="sectionHeader">
            <div>
              <div className="sectionNumber">
                03
              </div>

              <h2>
                Assigned Students
              </h2>

              <p>
                Students who currently have
                this assessment assigned.
              </p>
            </div>

            <div className="countLabel">
              {assignments.length} assigned
            </div>
          </div>

          {assignments.length === 0 ? (
            <div className="emptyBox">
              <div className="emptyIcon">
                ♙
              </div>

              <strong>
                No students assigned yet
              </strong>

              <span>
                Use the assignment section above
                to assign this assessment to a
                student.
              </span>
            </div>
          ) : (
            <div className="tableWrapper">
              <table className="assignmentTable">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Grade</th>
                    <th>Assigned</th>
                  </tr>
                </thead>

                <tbody>
                  {assignments.map(
                    (assignment) => (
                      <tr
                        key={`${assignment.assessment_id}-${assignment.student_id}`}
                      >
                        <td>
                          <div className="studentCell">
                            <div className="studentAvatar">
                              {assignment.student_name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {
                                  assignment.student_name
                                }
                              </strong>

                              {assignment.student_email && (
                                <span>
                                  {
                                    assignment.student_email
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="gradeBadge">
                            Grade{' '}
                            {assignment.grade}
                          </span>
                        </td>

                        <td className="dateCell">
                          {new Date(
                            assignment.assigned_at
                          ).toLocaleString()}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* QUESTIONS */}

        <section className="card questionsSection">
          <div className="sectionHeader">
            <div>
              <div className="sectionNumber">
                04
              </div>

              <h2>Questions</h2>

              <p>
                Questions included in this
                assessment.
              </p>
            </div>

            <div className="countLabel">
              {questions.length} question
              {questions.length === 1
                ? ''
                : 's'}
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="emptyBox">
              <div className="emptyIcon">
                ?
              </div>

              <strong>
                No questions found
              </strong>

              <span>
                No questions have been added to
                this assessment.
              </span>
            </div>
          ) : (
            <div className="questionList">
              {questions.map(
                (item, index) => {
                  const question =
                    item.question

                  return (
                    <article
                      key={
                        item.question_id
                      }
                      className="questionCard"
                    >
                      <div className="questionTop">
                        <span className="questionNumber">
                          Q
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            '0'
                          )}
                        </span>

                        {question?.topic && (
                          <span className="tag topic">
                            {question.topic}
                          </span>
                        )}

                        {question?.difficulty && (
                          <span className="tag difficulty">
                            {
                              question.difficulty
                            }
                          </span>
                        )}

                        <span className="positionBadge">
                          Position{' '}
                          {item.position}
                        </span>
                      </div>

                      {question ? (
                        <>
                          <p className="questionPrompt">
                            {question.prompt}
                          </p>

                          {Array.isArray(
                            question.options
                          ) &&
                            question.options
                              .length >
                              0 && (
                              <div className="optionsBox">
                                <div className="optionsTitle">
                                  Answer Options
                                </div>

                                <ol
                                  type="A"
                                  className="optionsList"
                                >
                                  {question.options.map(
                                    (
                                      option,
                                      optionIndex
                                    ) => (
                                      <li
                                        key={
                                          optionIndex
                                        }
                                      >
                                        <span className="optionLetter">
                                          {String.fromCharCode(
                                            65 +
                                              optionIndex
                                          )}
                                        </span>

                                        <span>
                                          {
                                            option
                                          }
                                        </span>
                                      </li>
                                    )
                                  )}
                                </ol>
                              </div>
                            )}
                        </>
                      ) : (
                        <div className="questionUnavailable">
                          Question information is
                          unavailable.
                        </div>
                      )}
                    </article>
                  )
                }
              )}
            </div>
          )}
        </section>

        <footer className="pageFooter">
          <div className="footerBrand">
            <strong>JOECH TUTOR</strong>
            <span>
              Excellence Beyond Borders
            </span>
          </div>

          <span>
            Mathematics & English Assessment
            Platform
          </span>
        </footer>
      </div>

      <style jsx>{styles}</style>
    </main>
  )
}

const styles = `
  * {
    box-sizing: border-box;
  }

  .page {
    min-height: 100vh;
    background: #f5f7fb;
    color: #172033;
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  /* =========================
     HEADER
  ========================= */

  .header {
    background: #ffffff;
    border-bottom: 1px solid #e6eaf0;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .headerInner {
    max-width: 1380px;
    margin: 0 auto;
    min-height: 82px;
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 13px;
    text-decoration: none;
    color: inherit;
  }

  .logo {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: 10px;
    display: block;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  }

  .brandName {
    font-size: 20px;
    line-height: 1.1;
    font-weight: 800;
    letter-spacing: -0.4px;
    color: #14213d;
  }

  .brandMotto {
    margin-top: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #0b5ed7;
    letter-spacing: 0.2px;
  }

  .headerRight {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .portalBadge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 13px;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    background: #f8fafc;
    color: #475569;
    font-size: 12px;
    font-weight: 700;
  }

  .onlineDot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #16a34a;
    box-shadow: 0 0 0 3px #dcfce7;
  }

  .dashboardLink {
    text-decoration: none;
    color: #475569;
    font-size: 13px;
    font-weight: 700;
  }

  .dashboardLink:hover,
  .backLink:hover {
    color: #0b5ed7;
  }

  /* =========================
     CONTENT
  ========================= */

  .content {
    max-width: 1380px;
    margin: 0 auto;
    padding: 30px 32px 0;
  }

  .backLink {
    display: inline-flex;
    align-items: center;
    margin-bottom: 25px;
    color: #64748b;
    text-decoration: none;
    font-size: 12px;
    font-weight: 800;
    transition: color 0.2s ease;
  }

  /* =========================
     HERO
  ========================= */

  .hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
    margin-bottom: 28px;
    padding: 30px;
    border-radius: 17px;
    background:
      linear-gradient(
        120deg,
        #082b59 0%,
        #0b5ed7 62%,
        #1976d2 100%
      );
    color: #ffffff;
    box-shadow:
      0 14px 35px rgba(8, 43, 89, 0.18);
  }

  .heroMain {
    min-width: 0;
  }

  .eyebrow {
    margin-bottom: 9px;
    color: #b9d7ff;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1.7px;
  }

  .hero h1 {
    max-width: 850px;
    margin: 0;
    color: #ffffff;
    font-size: clamp(27px, 4vw, 40px);
    line-height: 1.13;
    letter-spacing: -1px;
    font-weight: 800;
  }

  .heroMain p {
    max-width: 780px;
    margin: 12px 0 0;
    color: #dbeafe;
    font-size: 13px;
    line-height: 1.65;
  }

  .heroSubject {
    min-width: 180px;
    padding: 17px;
    display: flex;
    align-items: center;
    gap: 13px;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 12px;
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
  }

  .subjectLargeIcon {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 11px;
    background: #ffffff;
    color: #0b5ed7;
    font-size: 21px;
    font-weight: 900;
  }

  .heroSubject span {
    display: block;
    margin-bottom: 4px;
    color: #bfdbfe;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 1px;
  }

  .heroSubject strong {
    display: block;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
  }

  /* =========================
     SUMMARY
  ========================= */

  .summaryGrid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }

  .summaryCard {
    min-height: 92px;
    padding: 18px;
    display: flex;
    align-items: center;
    gap: 13px;
    background: #ffffff;
    border: 1px solid #e4e9f0;
    border-radius: 13px;
    box-shadow:
      0 3px 12px rgba(15,23,42,0.035);
  }

  .summaryIcon {
    width: 43px;
    height: 43px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-size: 18px;
    font-weight: 900;
  }

  .summaryIcon.blue {
    background: #eaf2ff;
    color: #0b5ed7;
  }

  .summaryIcon.purple {
    background: #f1eaff;
    color: #7c3aed;
  }

  .summaryIcon.orange {
    background: #fff3e6;
    color: #ea580c;
  }

  .summaryIcon.green {
    background: #e9f9ef;
    color: #16a34a;
  }

  .summaryCard span {
    display: block;
    margin-bottom: 5px;
    color: #7b8798;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  .summaryCard strong {
    display: block;
    color: #14213d;
    font-size: 19px;
    line-height: 1.1;
    font-weight: 800;
  }

  /* =========================
     CARDS
  ========================= */

  .card {
    margin-bottom: 25px;
    padding: 28px;
    background: #ffffff;
    border: 1px solid #e3e8ef;
    border-radius: 16px;
    box-shadow:
      0 5px 20px rgba(15, 23, 42, 0.045);
  }

  .assignmentCard {
    border-color: #d9e7f9;
    background:
      linear-gradient(
        180deg,
        #ffffff 0%,
        #f8fbff 100%
      );
  }

  .sectionHeader {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 25px;
    margin-bottom: 24px;
  }

  .sectionNumber {
    margin-bottom: 5px;
    color: #0b5ed7;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1.5px;
  }

  .sectionHeader h2 {
    margin: 0;
    color: #14213d;
    font-size: 21px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -0.35px;
  }

  .sectionHeader p {
    max-width: 720px;
    margin: 7px 0 0;
    color: #718096;
    font-size: 12px;
    line-height: 1.6;
  }

  .activeBadge {
    padding: 7px 11px;
    border-radius: 999px;
    background: #ecfdf3;
    color: #15803d;
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  .countLabel,
  .assignmentCount {
    padding: 8px 12px;
    border-radius: 8px;
    background: #f1f5f9;
    color: #475569;
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
  }

  .assignmentCount {
    min-width: 105px;
    text-align: center;
    background: #eef5ff;
    color: #0b5ed7;
  }

  .assignmentCount strong {
    display: block;
    font-size: 18px;
    line-height: 1.1;
  }

  .assignmentCount span {
    display: block;
    margin-top: 3px;
    font-size: 9px;
  }

  /* =========================
     INFORMATION
  ========================= */

  .informationGrid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .informationItem {
    padding: 14px;
    border: 1px solid #e7ebf1;
    border-radius: 9px;
    background: #fafbfd;
  }

  .informationItem span {
    display: block;
    margin-bottom: 5px;
    color: #8a96a8;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .informationItem strong {
    display: block;
    color: #344054;
    font-size: 12px;
    line-height: 1.4;
  }

  /* =========================
     ASSIGNMENT FORM
  ========================= */

  .assignRow {
    display: flex;
    align-items: flex-end;
    gap: 13px;
  }

  .studentSelectWrapper {
    flex: 1;
  }

  .studentSelectWrapper label {
    display: block;
    margin-bottom: 7px;
    color: #344054;
    font-size: 11px;
    font-weight: 800;
  }

  .studentSelect {
    width: 100%;
    min-height: 46px;
    padding: 0 13px;
    border: 1px solid #d4dce8;
    border-radius: 9px;
    outline: none;
    background: #ffffff;
    color: #172033;
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .studentSelect:focus {
    border-color: #0b5ed7;
    box-shadow:
      0 0 0 3px rgba(11,94,215,0.1);
  }

  .assignButton {
    min-height: 46px;
    padding: 0 19px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 11px;
    border: none;
    border-radius: 9px;
    background: #0b5ed7;
    color: #ffffff;
    font-family: inherit;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
    box-shadow:
      0 7px 16px rgba(11,94,215,0.16);
    transition:
      background 0.2s ease,
      transform 0.2s ease;
  }

  .assignButton:hover:not(:disabled) {
    background: #084aa9;
    transform: translateY(-1px);
  }

  .assignButton:disabled {
    background: #a0aec0;
    cursor: not-allowed;
    box-shadow: none;
  }

  .assignButton > span {
    font-size: 16px;
  }

  .message {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 15px;
    padding: 11px 13px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
  }

  .message > span {
    font-size: 14px;
    font-weight: 900;
  }

  .errorMessage {
    border: 1px solid #fecaca;
    background: #fff1f2;
    color: #b42318;
  }

  .successMessage {
    border: 1px solid #bbf7d0;
    background: #ecfdf3;
    color: #15803d;
  }

  .loadingBox {
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border: 1px dashed #ccd5e1;
    border-radius: 10px;
    background: #fafbfd;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
  }

  .smallSpinner,
  .buttonSpinner,
  .loadingSpinner {
    border-radius: 50%;
    border: 3px solid #dbeafe;
    border-top-color: #0b5ed7;
    animation: spin 0.8s linear infinite;
  }

  .smallSpinner {
    width: 17px;
    height: 17px;
  }

  .buttonSpinner {
    width: 14px;
    height: 14px;
    border-width: 2px;
    border-color: rgba(255,255,255,0.35);
    border-top-color: #ffffff;
  }

  .noStudentsBox {
    display: flex;
    align-items: flex-start;
    gap: 13px;
    padding: 17px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
  }

  .noStudentsIcon {
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    background: #eef2f7;
    color: #64748b;
    font-size: 17px;
  }

  .noStudentsBox strong {
    display: block;
    color: #334155;
    font-size: 12px;
  }

  .noStudentsBox p {
    margin: 5px 0 0;
    color: #7b8798;
    font-size: 11px;
    line-height: 1.5;
  }

  /* =========================
     TABLE
  ========================= */

  .tableWrapper {
    overflow-x: auto;
    border: 1px solid #e5e9ef;
    border-radius: 10px;
  }

  .assignmentTable {
    width: 100%;
    border-collapse: collapse;
    min-width: 650px;
  }

  .assignmentTable th {
    padding: 12px 14px;
    background: #f8fafc;
    color: #64748b;
    border-bottom: 1px solid #e3e8ef;
    text-align: left;
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  .assignmentTable td {
    padding: 13px 14px;
    border-bottom: 1px solid #edf0f4;
    color: #344054;
    font-size: 11px;
  }

  .assignmentTable tbody tr:last-child td {
    border-bottom: none;
  }

  .assignmentTable tbody tr:hover {
    background: #fafcff;
  }

  .studentCell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .studentAvatar {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    background: #eaf2ff;
    color: #0b5ed7;
    font-size: 12px;
    font-weight: 900;
  }

  .studentCell strong {
    display: block;
    color: #334155;
    font-size: 11px;
  }

  .studentCell span {
    display: block;
    margin-top: 3px;
    color: #8a96a8;
    font-size: 9px;
  }

  .gradeBadge {
    display: inline-block;
    padding: 5px 8px;
    border-radius: 6px;
    background: #f1f5f9;
    color: #475569;
    font-size: 9px;
    font-weight: 800;
  }

  .dateCell {
    color: #64748b !important;
    white-space: nowrap;
  }

  /* =========================
     QUESTIONS
  ========================= */

  .questionsSection {
    margin-bottom: 0;
  }

  .questionList {
    display: flex;
    flex-direction: column;
    gap: 13px;
  }

  .questionCard {
    padding: 19px;
    border: 1px solid #e2e7ee;
    border-radius: 11px;
    background: #ffffff;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .questionCard:hover {
    border-color: #cbd5e1;
    box-shadow:
      0 4px 13px rgba(15,23,42,0.04);
  }

  .questionTop {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .questionNumber {
    padding: 6px 9px;
    border-radius: 6px;
    background: #eaf2ff;
    color: #0b5ed7;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.4px;
  }

  .tag {
    padding: 5px 8px;
    border-radius: 5px;
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.45px;
  }

  .tag.topic {
    background: #eef4ff;
    color: #3568b8;
  }

  .tag.difficulty {
    background: #f3f4f6;
    color: #64748b;
  }

  .positionBadge {
    margin-left: auto;
    color: #94a3b8;
    font-size: 9px;
    font-weight: 700;
  }

  .questionPrompt {
    margin: 15px 0 0;
    color: #26364d;
    font-size: 14px;
    line-height: 1.7;
    font-weight: 500;
  }

  .optionsBox {
    margin-top: 17px;
    padding: 14px;
    border: 1px solid #e8ecf2;
    border-radius: 9px;
    background: #f8fafc;
  }

  .optionsTitle {
    margin-bottom: 9px;
    color: #64748b;
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  .optionsList {
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: option;
  }

  .optionsList li {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 8px 0;
    color: #475569;
    font-size: 11px;
    line-height: 1.5;
    border-bottom: 1px solid #e8edf3;
  }

  .optionsList li:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .optionLetter {
    width: 23px;
    height: 23px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: #ffffff;
    border: 1px solid #dbe2ea;
    color: #64748b;
    font-size: 9px;
    font-weight: 900;
  }

  .questionUnavailable {
    margin-top: 14px;
    padding: 12px;
    border-radius: 8px;
    background: #fff7ed;
    color: #9a3412;
    font-size: 11px;
  }

  /* =========================
     EMPTY / ERROR / LOADING
  ========================= */

  .emptyBox {
    min-height: 145px;
    padding: 30px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    border: 1px dashed #ccd5e1;
    border-radius: 10px;
    background: #fafbfd;
    text-align: center;
  }

  .emptyIcon {
    width: 38px;
    height: 38px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #edf2f7;
    color: #64748b;
    font-size: 16px;
    font-weight: 900;
  }

  .emptyBox strong {
    color: #334155;
    font-size: 12px;
  }

  .emptyBox span {
    max-width: 440px;
    margin-top: 5px;
    color: #8a96a8;
    font-size: 10px;
    line-height: 1.5;
  }

  .loadingPage {
    min-height: calc(100vh - 82px);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 40px;
    text-align: center;
  }

  .loadingSpinner {
    width: 36px;
    height: 36px;
    margin-bottom: 18px;
    border-width: 4px;
  }

  .loadingPage h2 {
    margin: 0;
    color: #14213d;
    font-size: 20px;
  }

  .loadingPage p {
    margin: 7px 0 0;
    color: #7b8798;
    font-size: 12px;
  }

  .errorCard {
    max-width: 650px;
    margin: 80px auto;
    padding: 40px;
    border: 1px solid #e5e9ef;
    border-radius: 16px;
    background: #ffffff;
    text-align: center;
    box-shadow:
      0 8px 25px rgba(15,23,42,0.05);
  }

  .errorIcon {
    width: 48px;
    height: 48px;
    margin: 0 auto 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: #fff1f2;
    color: #dc2626;
    font-size: 21px;
    font-weight: 900;
  }

  .errorCard h1 {
    margin: 0;
    color: #14213d;
    font-size: 23px;
  }

  .errorCard p {
    margin: 9px 0 22px;
    color: #b42318;
    font-size: 12px;
  }

  .primaryButton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 43px;
    padding: 0 18px;
    border-radius: 9px;
    background: #0b5ed7;
    color: #ffffff;
    text-decoration: none;
    font-size: 11px;
    font-weight: 800;
    box-shadow:
      0 7px 16px rgba(11,94,215,0.16);
  }

  .primaryButton:hover {
    background: #084aa9;
  }

  /* =========================
     FOOTER
  ========================= */

  .pageFooter {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-top: 42px;
    padding: 25px 0 30px;
    border-top: 1px solid #dfe5ed;
    color: #8a96a8;
    font-size: 10px;
  }

  .footerBrand {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .footerBrand strong {
    color: #14213d;
    font-size: 13px;
    font-weight: 800;
  }

  .footerBrand span {
    color: #0b5ed7;
    font-size: 9px;
    font-weight: 700;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* =========================
     RESPONSIVE
  ========================= */

  @media (max-width: 1100px) {
    .summaryGrid {
      grid-template-columns: repeat(2, 1fr);
    }

    .informationGrid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 800px) {
    .headerInner {
      min-height: 70px;
      padding: 0 18px;
    }

    .logo {
      width: 46px;
      height: 46px;
    }

    .brandName {
      font-size: 17px;
    }

    .brandMotto {
      font-size: 9px;
    }

    .portalBadge {
      display: none;
    }

    .content {
      padding: 24px 18px 0;
    }

    .hero {
      align-items: flex-start;
      flex-direction: column;
      padding: 23px;
    }

    .heroSubject {
      width: 100%;
    }

    .summaryGrid {
      grid-template-columns: 1fr 1fr;
      gap: 11px;
    }

    .card {
      padding: 20px;
    }

    .sectionHeader {
      flex-direction: column;
    }

    .informationGrid {
      grid-template-columns: 1fr;
    }

    .assignRow {
      align-items: stretch;
      flex-direction: column;
    }

    .assignButton {
      width: 100%;
    }

    .positionBadge {
      width: 100%;
      margin-left: 0;
    }
  }

  @media (max-width: 480px) {
    .summaryGrid {
      grid-template-columns: 1fr;
    }

    .hero h1 {
      font-size: 27px;
    }

    .heroMain p {
      font-size: 12px;
    }

    .card {
      padding: 17px;
    }

    .studentSelect {
      font-size: 11px;
    }

    .questionPrompt {
      font-size: 13px;
    }

    .pageFooter {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`