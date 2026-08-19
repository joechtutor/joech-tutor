'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Assessment = {
  id: string
  title: string
  subject: string
  grade: number
  duration_minutes: number
}

type Student = {
  id: string
  full_name: string | null
  email: string | null
}

type Result = {
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
  assessment: Assessment | null
  student: Student | null
}

export default function AdminResultsPage() {
  const router = useRouter()

  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true)
        setMessage('')

        const response = await fetch(
          '/api/admin/results',
          {
            cache: 'no-store',
          }
        )

        const data = await response.json()

        if (!response.ok) {
          setMessage(
            data.error ||
              'Unable to load assessment results.'
          )
          return
        }

        setResults(data.results || [])
      } catch {
        setMessage(
          'Unable to connect to the server.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [])

  function getStudentName(
    student: Student | null
  ) {
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
    date: string | null
  ) {
    if (!date) {
      return 'Not available'
    }

    return new Date(date).toLocaleString()
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        padding: 40,
        fontFamily:
          'Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
            marginBottom: 30,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 32,
              }}
            >
              Assessment Results
            </h1>

            <p
              style={{
                color: '#555',
                marginTop: 8,
              }}
            >
              View completed student
              assessment results.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/dashboard'
              )
            }
            style={{
              padding:
                '11px 18px',
              borderRadius: 8,
              border:
                '1px solid #ccc',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ← Dashboard
          </button>
        </div>

        {/* LOADING */}

        {loading && (
          <section
            style={{
              background: '#fff',
              padding: 30,
              borderRadius: 12,
            }}
          >
            <h2>
              Loading Results...
            </h2>

            <p>
              Please wait while the
              results are loaded.
            </p>
          </section>
        )}

        {/* ERROR */}

        {message && (
          <section
            style={{
              background: '#fff7ed',
              border:
                '1px solid #fed7aa',
              color: '#9a3412',
              padding: 20,
              borderRadius: 10,
            }}
          >
            <strong>
              Unable to load results
            </strong>

            <p>{message}</p>
          </section>
        )}

        {/* NO RESULTS */}

        {!loading &&
          !message &&
          results.length === 0 && (
            <section
              style={{
                background: '#fff',
                padding: 30,
                borderRadius: 12,
              }}
            >
              <h2>
                No Completed Results
              </h2>

              <p>
                No student has completed
                an assessment yet.
              </p>
            </section>
          )}

        {/* RESULTS */}

        {!loading &&
          !message &&
          results.length > 0 && (
            <section
              style={{
                background: '#fff',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow:
                  '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  padding: 20,
                  borderBottom:
                    '1px solid #eee',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  Completed Assessments
                </h2>

                <p
                  style={{
                    marginBottom: 0,
                    color: '#666',
                  }}
                >
                  {results.length}{' '}
                  completed attempt
                  {results.length ===
                  1
                    ? ''
                    : 's'}
                </p>
              </div>

              <div
                style={{
                  overflowX: 'auto',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse:
                      'collapse',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          '#f8fafc',
                        textAlign:
                          'left',
                      }}
                    >
                      <th
                        style={{
                          padding: 15,
                          borderBottom:
                            '1px solid #ddd',
                        }}
                      >
                        Student
                      </th>

                      <th
                        style={{
                          padding: 15,
                          borderBottom:
                            '1px solid #ddd',
                        }}
                      >
                        Assessment
                      </th>

                      <th
                        style={{
                          padding: 15,
                          borderBottom:
                            '1px solid #ddd',
                        }}
                      >
                        Subject
                      </th>

                      <th
                        style={{
                          padding: 15,
                          borderBottom:
                            '1px solid #ddd',
                        }}
                      >
                        Grade
                      </th>

                      <th
                        style={{
                          padding: 15,
                          borderBottom:
                            '1px solid #ddd',
                        }}
                      >
                        Score
                      </th>

                      <th
                        style={{
                          padding: 15,
                          borderBottom:
                            '1px solid #ddd',
                        }}
                      >
                        Correct
                      </th>

                      <th
                        style={{
                          padding: 15,
                          borderBottom:
                            '1px solid #ddd',
                        }}
                      >
                        Submitted
                      </th>

                      <th
                        style={{
                          padding: 15,
                          borderBottom:
                            '1px solid #ddd',
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.map(
                      (result) => (
                        <tr
                          key={result.id}
                        >
                          <td
                            style={{
                              padding: 15,
                              borderBottom:
                                '1px solid #eee',
                            }}
                          >
                            <strong>
                              {getStudentName(
                                result.student
                              )}
                            </strong>

                            {result.student
                              ?.email && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color:
                                    '#777',
                                  marginTop: 4,
                                }}
                              >
                                {
                                  result
                                    .student
                                    .email
                                }
                              </div>
                            )}
                          </td>

                          <td
                            style={{
                              padding: 15,
                              borderBottom:
                                '1px solid #eee',
                            }}
                          >
                            {result.assessment
                              ?.title ||
                              'Assessment'}
                          </td>

                          <td
                            style={{
                              padding: 15,
                              borderBottom:
                                '1px solid #eee',
                            }}
                          >
                            {result.assessment
                              ?.subject ||
                              'N/A'}
                          </td>

                          <td
                            style={{
                              padding: 15,
                              borderBottom:
                                '1px solid #eee',
                            }}
                          >
                            {result.assessment
                              ?.grade ||
                              'N/A'}
                          </td>

                          <td
                            style={{
                              padding: 15,
                              borderBottom:
                                '1px solid #eee',
                            }}
                          >
                            <strong>
                              {result.score}%
                            </strong>

                            <div
                              style={{
                                fontSize: 12,
                                marginTop: 3,
                              }}
                            >
                              Grade{' '}
                              {
                                result.letter
                              }
                            </div>
                          </td>

                          <td
                            style={{
                              padding: 15,
                              borderBottom:
                                '1px solid #eee',
                            }}
                          >
                            {
                              result.correct_answers
                            }{' '}
                            /{' '}
                            {
                              result.total_questions
                            }
                          </td>

                          <td
                            style={{
                              padding: 15,
                              borderBottom:
                                '1px solid #eee',
                              whiteSpace:
                                'nowrap',
                            }}
                          >
                            {formatDate(
                              result.submitted_at
                            )}
                          </td>

                          <td
                            style={{
                              padding: 15,
                              borderBottom:
                                '1px solid #eee',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/dashboard/results/${result.id}`
                                )
                              }
                              style={{
                                padding:
                                  '9px 14px',
                                borderRadius: 7,
                                border:
                                  'none',
                                background:
                                  '#2563eb',
                                color:
                                  '#fff',
                                cursor:
                                  'pointer',
                                fontWeight:
                                  'bold',
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
      </div>
    </main>
  )
}