'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Student = {
  id: string
  full_name: string | null
  email: string | null
}

type Assessment = {
  id: string
  title: string
  subject: string
  grade: number
  duration_minutes: number
}

type Question = {
  id: string
  prompt: string
  options: string[]
  correct_option: number
  topic: string | null
  difficulty: string | null
  explanation: string | null
  selected_option: number | null
  is_correct: boolean
}

type Attempt = {
  id: string
  assessment_id: string
  user_id: string
  score: number
  letter: string
  total_questions: number
  correct_answers: number
  started_at: string | null
  submitted_at: string | null
  teacher_comment: string | null
}

export default function AdminResultPage() {
  const params = useParams()
  const router = useRouter()

  const resultId = Array.isArray(params.id)
    ? params.id[0]
    : params.id

  const [attempt, setAttempt] =
    useState<Attempt | null>(null)

  const [assessment, setAssessment] =
    useState<Assessment | null>(null)

  const [student, setStudent] =
    useState<Student | null>(null)

  const [questions, setQuestions] =
    useState<Question[]>([])

  const [loading, setLoading] =
    useState(true)

  const [message, setMessage] =
    useState('')

  const [teacherComment, setTeacherComment] =
    useState('')

  const [savingComment, setSavingComment] =
    useState(false)

  const [commentMessage, setCommentMessage] =
    useState('')

  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true)
        setMessage('')

        const response = await fetch(
          `/api/admin/results/${resultId}`,
          {
            cache: 'no-store',
          }
        )

        const data = await response.json()

        if (!response.ok) {
          setMessage(
            data.error ||
              'Unable to load result.'
          )
          return
        }

        setAttempt(data.attempt)
        setAssessment(data.assessment)
        setStudent(data.student)
        setQuestions(data.questions || [])

        setTeacherComment(
          data.attempt?.teacher_comment || ''
        )
      } catch {
        setMessage(
          'Unable to connect to the server.'
        )
      } finally {
        setLoading(false)
      }
    }

    if (resultId) {
      loadResult()
    }
  }, [resultId])

  async function saveTeacherComment() {
    if (!attempt) return

    setSavingComment(true)
    setCommentMessage('')

    try {
      const response = await fetch(
        `/api/admin/results/${attempt.id}/comment`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teacher_comment:
              teacherComment,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setCommentMessage(
          data.error ||
            'Unable to save teacher comment.'
        )
        return
      }

      setCommentMessage(
        'Teacher comment saved successfully.'
      )

      setAttempt((current) =>
        current
          ? {
              ...current,
              teacher_comment:
                teacherComment,
            }
          : current
      )
    } catch {
      setCommentMessage(
        'Unable to connect to the server.'
      )
    } finally {
      setSavingComment(false)
    }
  }

  function getStudentName() {
    if (!student) {
      return 'Student'
    }

    return (
      student.full_name ||
      student.email ||
      'Student'
    )
  }

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return 'Not available'
    }

    return new Date(value).toLocaleString()
  }

  function getOptionLabel(
    index: number | null
  ) {
    if (
      index === null ||
      index === undefined
    ) {
      return 'Not answered'
    }

    return String.fromCharCode(
      65 + index
    )
  }

  function getScoreClass(score: number) {
    if (score >= 70) {
      return 'joech-result-good'
    }

    if (score >= 50) {
      return 'joech-result-average'
    }

    return 'joech-result-poor'
  }

  if (loading) {
    return (
      <main className="joech-dashboard">
        <div
          className="joech-main"
          style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="joech-section"
            style={{
              maxWidth: 500,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 42,
                marginBottom: 15,
              }}
            >
              📊
            </div>

            <h2>
              Loading Assessment Result
            </h2>

            <p>
              Please wait while we retrieve
              the student's result.
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (!attempt || !assessment) {
    return (
      <main className="joech-dashboard">
        <div className="joech-main">
          <div
            className="joech-section"
            style={{
              maxWidth: 700,
              margin: '50px auto',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 45,
                marginBottom: 15,
              }}
            >
              ⚠️
            </div>

            <h1>
              Unable to Load Result
            </h1>

            <p>
              {message ||
                'Result not found.'}
            </p>

            <button
              type="button"
              className="joech-button joech-button-primary"
              onClick={() =>
                router.push(
                  '/dashboard/results'
                )
              }
            >
              ← Back to Results
            </button>
          </div>
        </div>
      </main>
    )
  }

  const score = Number(attempt.score)

  const failedAnswers =
    attempt.total_questions -
    attempt.correct_answers

  return (
    <main className="joech-dashboard">

      {/* HEADER */}

      <header className="joech-header">
        <div className="joech-header-inner">

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background:
                    'linear-gradient(135deg, #1d4ed8, #2563eb)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 18,
                  boxShadow:
                    '0 5px 15px rgba(29,78,216,0.20)',
                }}
              >
                JT
              </div>

              <div>
                <h1 className="joech-logo">
                  JOECH TUTOR
                </h1>

                <p className="joech-motto">
                  Excellence Beyond Borders
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="joech-nav-link"
            onClick={() =>
              router.push(
                '/dashboard/results'
              )
            }
          >
            ← Results
          </button>

        </div>
      </header>

      <div className="joech-main">

        {/* PAGE INTRODUCTION */}

        <section className="joech-welcome">

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'flex-start',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >

            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding:
                    '6px 11px',
                  background:
                    '#eff6ff',
                  color: '#1d4ed8',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                ASSESSMENT RESULT
              </div>

              <h1>
                {assessment.title}
              </h1>

              <p>
                Detailed academic performance
                report for{' '}
                <strong>
                  {getStudentName()}
                </strong>
                .
              </p>
            </div>

            <button
              type="button"
              className="joech-button joech-button-secondary"
              onClick={() =>
                router.push(
                  '/dashboard/results'
                )
              }
            >
              ← Back to Results
            </button>

          </div>

        </section>

        {/* STUDENT INFORMATION */}

        <section className="joech-section">

          <div className="joech-section-heading">
            <div>
              <h2>
                Student Information
              </h2>

              <p>
                Details about the student and
                assessment.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 15,
            }}
          >

            <div
              className="joech-card"
              style={{
                boxShadow: 'none',
              }}
            >
              <div className="joech-card-label">
                Student
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                {getStudentName()}
              </div>

              {student?.email && (
                <div
                  style={{
                    marginTop: 5,
                    color: '#64748b',
                    fontSize: 13,
                  }}
                >
                  {student.email}
                </div>
              )}
            </div>

            <div
              className="joech-card"
              style={{
                boxShadow: 'none',
              }}
            >
              <div className="joech-card-label">
                Subject
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                {assessment.subject}
              </div>
            </div>

            <div
              className="joech-card"
              style={{
                boxShadow: 'none',
              }}
            >
              <div className="joech-card-label">
                Grade
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                Grade {assessment.grade}
              </div>
            </div>

            <div
              className="joech-card"
              style={{
                boxShadow: 'none',
              }}
            >
              <div className="joech-card-label">
                Duration
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                {assessment.duration_minutes}{' '}
                minutes
              </div>
            </div>

            <div
              className="joech-card"
              style={{
                boxShadow: 'none',
              }}
            >
              <div className="joech-card-label">
                Submitted
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {formatDate(
                  attempt.submitted_at
                )}
              </div>
            </div>

          </div>

        </section>

        {/* PERFORMANCE SUMMARY */}

        <section
          className="joech-section"
          style={{
            marginTop: 25,
          }}
        >

          <div className="joech-section-heading">

            <div>
              <h2>
                Performance Summary
              </h2>

              <p>
                Overview of the student's
                assessment performance.
              </p>
            </div>

            <div
              style={{
                padding:
                  '8px 15px',
                borderRadius: 20,
                background:
                  score >= 50
                    ? '#dcfce7'
                    : '#fee2e2',
                color:
                  score >= 50
                    ? '#166534'
                    : '#991b1b',
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {score >= 50
                ? 'PASSED'
                : 'FAILED'}
            </div>

          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 16,
            }}
          >

            <div
              className={`joech-result-card ${getScoreClass(
                score
              )}`}
            >
              <span>
                SCORE
              </span>

              <strong>
                {score}%
              </strong>
            </div>

            <div
              className="joech-result-card"
            >
              <span>
                LETTER GRADE
              </span>

              <strong>
                {attempt.letter}
              </strong>
            </div>

            <div
              className="joech-result-card"
            >
              <span>
                CORRECT
              </span>

              <strong>
                {attempt.correct_answers}
              </strong>

              <small>
                of{' '}
                {attempt.total_questions}
              </small>
            </div>

            <div
              className="joech-result-card"
            >
              <span>
                INCORRECT
              </span>

              <strong>
                {failedAnswers}
              </strong>
            </div>

          </div>

          {/* SCORE BAR */}

          <div
            style={{
              marginTop: 25,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 700,
                color: '#64748b',
              }}
            >
              <span>
                Overall Performance
              </span>

              <span>
                {score}%
              </span>
            </div>

            <div
              style={{
                height: 12,
                background:
                  '#e2e8f0',
                borderRadius: 20,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(
                    Math.max(score, 0),
                    100
                  )}%`,
                  height: '100%',
                  background:
                    score >= 70
                      ? '#16a34a'
                      : score >= 50
                        ? '#2563eb'
                        : '#dc2626',
                  borderRadius: 20,
                  transition:
                    'width 0.5s ease',
                }}
              />
            </div>
          </div>

        </section>

        {/* QUESTION REVIEW */}

        <section
          style={{
            marginTop: 30,
          }}
        >

          <div
            className="joech-section-heading"
            style={{
              marginTop: 0,
            }}
          >

            <div>
              <h2>
                Question-by-Question Review
              </h2>

              <p>
                Review each question,
                student's answer and the
                correct answer.
              </p>
            </div>

            <div className="joech-selection-count">
              {questions.length} question
              {questions.length === 1
                ? ''
                : 's'}
            </div>

          </div>

          {questions.length === 0 ? (

            <div className="joech-empty">
              <strong>
                No questions found
              </strong>

              <span>
                There are no question details
                available for this result.
              </span>
            </div>

          ) : (

            <div
              style={{
                display: 'flex',
                flexDirection:
                  'column',
                gap: 18,
              }}
            >

              {questions.map(
                (
                  question,
                  index
                ) => (

                  <article
                    key={question.id}
                    className="joech-result-question"
                  >

                    {/* QUESTION HEADER */}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        gap: 15,
                        flexWrap:
                          'wrap',
                      }}
                    >

                      <div
                        style={{
                          display: 'flex',
                          alignItems:
                            'center',
                          gap: 10,
                        }}
                      >

                        <span
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius:
                              '50%',
                            display:
                              'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'center',
                            background:
                              question.is_correct
                                ? '#dcfce7'
                                : '#fee2e2',
                            color:
                              question.is_correct
                                ? '#166534'
                                : '#991b1b',
                            fontWeight:
                              800,
                          }}
                        >
                          {index + 1}
                        </span>

                        <div>
                          <strong>
                            Question{' '}
                            {index + 1}
                          </strong>

                          <div
                            style={{
                              marginTop: 3,
                              color:
                                '#94a3b8',
                              fontSize:
                                12,
                            }}
                          >
                            {question.topic ||
                              'General'}{' '}
                            •{' '}
                            {question.difficulty ||
                              'Standard'}
                          </div>
                        </div>

                      </div>

                      <span
                        style={{
                          padding:
                            '7px 12px',
                          borderRadius:
                            20,
                          background:
                            question.is_correct
                              ? '#dcfce7'
                              : '#fee2e2',
                          color:
                            question.is_correct
                              ? '#166534'
                              : '#991b1b',
                          fontWeight:
                            800,
                          fontSize:
                            12,
                        }}
                      >
                        {question.is_correct
                          ? '✓ CORRECT'
                          : '✗ INCORRECT'}
                      </span>

                    </div>

                    {/* QUESTION */}

                    <div
                      style={{
                        marginTop: 20,
                      }}
                    >

                      <h3
                        style={{
                          margin: 0,
                          color:
                            '#172033',
                          lineHeight:
                            1.7,
                        }}
                      >
                        {question.prompt}
                      </h3>

                    </div>

                    {/* OPTIONS */}

                    <div
                      style={{
                        marginTop: 20,
                        display:
                          'flex',
                        flexDirection:
                          'column',
                        gap: 10,
                      }}
                    >

                      {question.options.map(
                        (
                          option,
                          optionIndex
                        ) => {

                          const isStudentAnswer =
                            question.selected_option ===
                            optionIndex

                          const isCorrectAnswer =
                            question.correct_option ===
                            optionIndex

                          return (
                            <div
                              key={
                                optionIndex
                              }
                              className={
                                isCorrectAnswer
                                  ? 'joech-answer joech-answer-correct'
                                  : isStudentAnswer
                                    ? 'joech-answer joech-answer-wrong'
                                    : 'joech-answer'
                              }
                            >

                              <div
                                style={{
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  gap: 12,
                                }}
                              >

                                <span
                                  style={{
                                    width: 32,
                                    height: 32,
                                    minWidth: 32,
                                    borderRadius:
                                      '50%',
                                    display:
                                      'flex',
                                    alignItems:
                                      'center',
                                    justifyContent:
                                      'center',
                                    fontWeight:
                                      800,
                                    background:
                                      isCorrectAnswer
                                        ? '#16a34a'
                                        : isStudentAnswer
                                          ? '#dc2626'
                                          : '#e2e8f0',
                                    color:
                                      isCorrectAnswer ||
                                      isStudentAnswer
                                        ? '#fff'
                                        : '#475569',
                                  }}
                                >
                                  {getOptionLabel(
                                    optionIndex
                                  )}
                                </span>

                                <span
                                  style={{
                                    flex: 1,
                                    lineHeight:
                                      1.5,
                                  }}
                                >
                                  {option}
                                </span>

                              </div>

                              <div
                                style={{
                                  display:
                                    'flex',
                                  gap: 7,
                                  flexWrap:
                                    'wrap',
                                }}
                              >

                                {isStudentAnswer && (
                                  <span
                                    className="joech-answer-label"
                                  >
                                    Student Answer
                                  </span>
                                )}

                                {isCorrectAnswer && (
                                  <span
                                    className="joech-answer-label correct"
                                  >
                                    Correct Answer
                                  </span>
                                )}

                              </div>

                            </div>
                          )
                        }
                      )}

                    </div>

                    {/* NOT ANSWERED */}

                    {question.selected_option ===
                      null && (
                      <div
                        style={{
                          marginTop: 15,
                          padding: 12,
                          background:
                            '#fff7ed',
                          border:
                            '1px solid #fed7aa',
                          borderRadius: 8,
                          color:
                            '#9a3412',
                          fontSize: 13,
                          fontWeight:
                            700,
                        }}
                      >
                        ⚠ The student did not
                        answer this question.
                      </div>
                    )}

                    {/* EXPLANATION */}

                    {question.explanation && (
                      <div
                        className="joech-explanation"
                      >

                        <div
                          style={{
                            fontSize:
                              13,
                            fontWeight:
                              800,
                            color:
                              '#1d4ed8',
                            marginBottom:
                              6,
                          }}
                        >
                          💡 EXPLANATION
                        </div>

                        <p>
                          {
                            question.explanation
                          }
                        </p>

                      </div>
                    )}

                  </article>

                )
              )}

            </div>

          )}

        </section>

        {/* TEACHER COMMENT */}

        <section
          className="joech-section"
          style={{
            marginTop: 30,
            marginBottom: 35,
          }}
        >

          <div className="joech-section-heading">

            <div>
              <h2>
                Teacher Feedback
              </h2>

              <p>
                Provide academic feedback
                for this student's result.
              </p>
            </div>

            <div
              style={{
                fontSize: 26,
              }}
            >
              📝
            </div>

          </div>

          <textarea
            value={teacherComment}
            onChange={(event) =>
              setTeacherComment(
                event.target.value
              )
            }
            placeholder="Enter teacher feedback for the student..."
            rows={6}
            className="joech-input"
            style={{
              minHeight: 150,
              resize: 'vertical',
              lineHeight: 1.6,
            }}
          />

          {commentMessage && (
            <div
              className="joech-message"
              style={{
                marginTop: 15,
                background:
                  commentMessage.includes(
                    'successfully'
                  )
                    ? '#f0fdf4'
                    : '#fef2f2',
                borderColor:
                  commentMessage.includes(
                    'successfully'
                  )
                    ? '#bbf7d0'
                    : '#fecaca',
                color:
                  commentMessage.includes(
                    'successfully'
                  )
                    ? '#166534'
                    : '#991b1b',
              }}
            >
              {commentMessage}
            </div>
          )}

          <div
            className="joech-form-footer"
          >

            <div>
              <strong>
                Teacher Feedback
              </strong>

              <div
                style={{
                  marginTop: 4,
                  color: '#94a3b8',
                }}
              >
                This feedback can be used to
                guide the student's progress.
              </div>
            </div>

            <button
              type="button"
              className="joech-button joech-button-primary"
              onClick={
                saveTeacherComment
              }
              disabled={savingComment}
            >
              {savingComment
                ? 'Saving...'
                : 'Save Teacher Comment'}
            </button>

          </div>

        </section>

        {/* FOOTER */}

        <footer className="joech-footer">
          JOECH TUTOR • Excellence Beyond
          Borders
        </footer>

      </div>
    </main>
  )
}