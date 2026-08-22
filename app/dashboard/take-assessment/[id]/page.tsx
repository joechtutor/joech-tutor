'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  useParams,
  useRouter,
} from 'next/navigation'

type Question = {
  id: string
  subject: string
  grade: number
  topic: string
  difficulty: string
  prompt: string
  options: string[]
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
  assessment_questions?: AssessmentQuestion[]
}

export default function TakeAssessmentPage() {
 const params = useParams<{
  id?: string | string[]
}>()

const router = useRouter()

const assessmentId = Array.isArray(params?.id)
  ? params.id[0]
  : params?.id || ''

  const [assessment, setAssessment] =
    useState<Assessment | null>(null)

  const [answers, setAnswers] =
    useState<Record<string, string>>({})

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState('')

  const [timeLeft, setTimeLeft] =
    useState(0)

  useEffect(() => {
    async function loadAssessment() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          `/api/assessments/${assessmentId}`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Unable to load assessment'
          )
        }

        const loadedAssessment =
          data.assessment || data

        setAssessment(loadedAssessment)

        setTimeLeft(
          loadedAssessment.duration_minutes * 60
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

    if (assessmentId) {
      loadAssessment()
    }
  }, [assessmentId])

  useEffect(() => {
    if (
      loading ||
      !assessment ||
      timeLeft <= 0 ||
      submitting
    ) {
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          clearInterval(timer)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [
    loading,
    assessment,
    timeLeft,
    submitting,
  ])

  function selectAnswer(
    questionId: string,
    answer: string
  ) {
    setAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }))
  }

  async function submitAssessment() {
    if (submitting) {
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to submit this assessment?'
    )

    if (!confirmed) {
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch(
        '/api/attempts/submit',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            assessment_id:
              assessmentId,
            answers,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Unable to submit assessment'
        )
      }

      /*
       * Submission successful.
       * Go to the student's result page.
       */
      router.push(
        `/dashboard/student/assessments/${assessmentId}/result`
      )
    } catch (err) {
      setSubmitting(false)

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit assessment'
      )
    }
  }

  function formatTime(seconds: number) {
    const minutes =
      Math.floor(seconds / 60)

    const remainingSeconds =
      seconds % 60

    return `${String(minutes).padStart(
      2,
      '0'
    )}:${String(
      remainingSeconds
    ).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <main
        style={{
          padding: 40,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <p>Loading assessment...</p>
      </main>
    )
  }

  if (error || !assessment) {
    return (
      <main
        style={{
          padding: 40,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <Link href="/dashboard/my-assessments">
          â† Back to My Assessments
        </Link>

        <h1
          style={{
            marginTop: 25,
          }}
        >
          Unable to Load Assessment
        </h1>

        <p
          style={{
            color: 'red',
          }}
        >
          {error ||
            'Assessment not found.'}
        </p>
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

  const answeredCount =
    Object.keys(answers).length

  return (
    <main
      style={{
        padding: 30,
        fontFamily:
          'Arial, sans-serif',
        maxWidth: 1000,
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
          marginBottom: 25,
          position: 'sticky',
          top: 0,
          background: '#fff',
          padding: '15px 0',
          borderBottom:
            '1px solid #ddd',
          zIndex: 10,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
            }}
          >
            {assessment.title}
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              color: '#666',
            }}
          >
            Grade {assessment.grade}{' '}
            â€¢ {assessment.subject}
          </p>
        </div>

        <div
          style={{
            textAlign: 'center',
            border: '2px solid #111',
            borderRadius: 10,
            padding: '10px 18px',
            minWidth: 100,
          }}
        >
          <small>Time Left</small>

          <strong
            style={{
              display: 'block',
              fontSize: 22,
            }}
          >
            {formatTime(timeLeft)}
          </strong>
        </div>
      </div>

      {/* SUMMARY */}
      <section
        style={{
          border:
            '1px solid #ddd',
          borderRadius: 10,
          padding: 20,
          marginBottom: 25,
        }}
      >
        <p>
          <strong>
            Questions:
          </strong>{' '}
          {questions.length}
        </p>

        <p>
          <strong>
            Answered:
          </strong>{' '}
          {answeredCount} /{' '}
          {questions.length}
        </p>
      </section>

      {/* TIME UP */}
      {timeLeft === 0 && (
        <div
          style={{
            background: '#fff5f5',
            border:
              '1px solid #f0caca',
            padding: 20,
            borderRadius: 10,
            marginBottom: 25,
          }}
        >
          <strong>
            Time is up.
          </strong>

          <p>
            Please submit your
            assessment.
          </p>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div
          style={{
            color: 'red',
            background: '#fff5f5',
            border:
              '1px solid #f0caca',
            padding: 15,
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* QUESTIONS */}
      {questions.map(
        (item, index) => {

          /*
           * IMPORTANT:
           * The API returns "question",
           * not "questions".
           */
          const question =
            item.question

          if (!question) {
            return (
              <section
                key={
                  item.question_id
                }
                style={{
                  border:
                    '1px solid #ddd',
                  padding: 20,
                  borderRadius: 10,
                  marginBottom: 20,
                }}
              >
                <h2>
                  Question {index + 1}
                </h2>

                <p
                  style={{
                    color: 'red',
                  }}
                >
                  Question information
                  unavailable.
                </p>
              </section>
            )
          }

          return (
            <section
              key={
                item.question_id
              }
              style={{
                border:
                  '1px solid #ddd',
                borderRadius: 12,
                padding: 25,
                marginBottom: 20,
              }}
            >
              <h2>
                Question {index + 1}
              </h2>

              <p
                style={{
                  color: '#666',
                }}
              >
                <strong>
                  Topic:
                </strong>{' '}
                {question.topic}
              </p>

              <p
                style={{
                  fontSize: 18,
                  lineHeight: 1.7,
                }}
              >
                {question.prompt}
              </p>

              {/* OPTIONS */}
              <div>
                {Array.isArray(
                  question.options
                ) &&
                  question.options.map(
                    (
                      option,
                      optionIndex
                    ) => {
                      const letter =
                        String.fromCharCode(
                          65 +
                            optionIndex
                        )

                      const selected =
                        answers[
                          question.id
                        ] === option

                      return (
                        <label
                          key={
                            optionIndex
                          }
                          style={{
                            display:
                              'block',

                            border:
                              selected
                                ? '2px solid #111'
                                : '1px solid #ddd',

                            background:
                              selected
                                ? '#f5f5f5'
                                : '#fff',

                            padding: 15,
                            marginBottom: 10,
                            borderRadius: 8,
                            cursor:
                              'pointer',
                          }}
                        >
                          <input
                            type="radio"
                            name={
                              question.id
                            }
                            value={
                              option
                            }
                            checked={
                              selected
                            }
                            onChange={() =>
                              selectAnswer(
                                question.id,
                                option
                              )
                            }
                            style={{
                              marginRight: 10,
                            }}
                          />

                          <strong>
                            {letter}.
                          </strong>{' '}
                          {option}
                        </label>
                      )
                    }
                  )}
              </div>
            </section>
          )
        }
      )}

      {/* SUBMIT */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 35,
          marginBottom: 50,
        }}
      >
        <button
          type="button"
          onClick={
            submitAssessment
          }
          disabled={
            submitting ||
            questions.length === 0
          }
          style={{
            padding:
              '15px 35px',
            fontSize: 17,
            fontWeight: 'bold',

            cursor:
              submitting ||
              questions.length === 0
                ? 'not-allowed'
                : 'pointer',

            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: 8,

            opacity:
              submitting ||
              questions.length === 0
                ? 0.6
                : 1,
          }}
        >
          {submitting
            ? 'Submitting...'
            : 'Submit Assessment'}
        </button>
      </div>
    </main>
  )
}
