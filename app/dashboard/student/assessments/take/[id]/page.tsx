'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Question = {
  id: string
  prompt: string
  options: string[]
  topic: string
  difficulty: string
}

type Assessment = {
  id: string
  title: string
  subject: string
  grade: number
  duration_minutes: number
  questions: Question[]
}

export default function TakeAssessmentPage() {
  const params = useParams()
  const router = useRouter()

  const assessmentId = Array.isArray(params.id)
    ? params.id[0]
    : params.id

  const [assessment, setAssessment] =
    useState<Assessment | null>(null)

  const [answers, setAnswers] =
    useState<Record<string, number>>({})

  const [loading, setLoading] = useState(true)

  const [message, setMessage] = useState('')

  const [submitting, setSubmitting] =
    useState(false)

  const [currentQuestion, setCurrentQuestion] =
    useState(0)

  const [timeRemaining, setTimeRemaining] =
    useState<number | null>(null)

  const [autoSubmitting, setAutoSubmitting] =
    useState(false)

  /*
    Load assessment
  */
  useEffect(() => {
    async function loadAssessment() {
      try {
        const response = await fetch(
          `/api/student/assessments/${assessmentId}`
        )

        const data = await response.json()

        if (!response.ok) {
          setMessage(
            data.error ||
              'Unable to load assessment.'
          )
          return
        }

        setAssessment(data.assessment)

        setTimeRemaining(
          data.assessment.duration_minutes * 60
        )
      } catch {
        setMessage(
          'Unable to connect to the server.'
        )
      } finally {
        setLoading(false)
      }
    }

    if (assessmentId) {
      loadAssessment()
    }
  }, [assessmentId])

  /*
    Countdown timer
  */
  useEffect(() => {
    if (
      timeRemaining === null ||
      submitting ||
      !assessment
    ) {
      return
    }

    if (timeRemaining <= 0) {
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining((current) => {
        if (current === null) {
          return null
        }

        if (current <= 1) {
          clearInterval(timer)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [
    timeRemaining,
    submitting,
    assessment,
  ])

  /*
    Automatically submit when time reaches zero
  */
  useEffect(() => {
    if (
      timeRemaining === 0 &&
      assessment &&
      !submitting &&
      !autoSubmitting
    ) {
      setAutoSubmitting(true)
      submitAssessment(true)
    }
  }, [
    timeRemaining,
    assessment,
    submitting,
    autoSubmitting,
  ])

  /*
    Select answer
  */
  function selectAnswer(
    questionId: string,
    optionIndex: number
  ) {
    setAnswers((current) => ({
      ...current,
      [questionId]: optionIndex,
    }))
  }

  /*
    Format timer
  */
  function formatTime(
    seconds: number | null
  ) {
    if (seconds === null) {
      return '--:--'
    }

    const minutes = Math.floor(
      seconds / 60
    )

    const remainingSeconds =
      seconds % 60

    return `${String(minutes).padStart(
      2,
      '0'
    )}:${String(remainingSeconds).padStart(
      2,
      '0'
    )}`
  }

  /*
    Submit assessment
  */
  async function submitAssessment(
    automatic = false
  ) {
    if (!assessment) return

    if (
      !automatic &&
      Object.keys(answers).length !==
        assessment.questions.length
    ) {
      setMessage(
        'Please answer all questions before submitting.'
      )
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch(
        `/api/student/assessments/${assessment.id}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            answers,
          }),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        setMessage(
          data.error ||
            'Unable to submit assessment.'
        )
        setSubmitting(false)
        setAutoSubmitting(false)
        return
      }

      router.push(
        `/dashboard/student/assessments/${assessment.id}/result`
      )
    } catch {
      setMessage(
        'Unable to connect to the server.'
      )

      setSubmitting(false)
      setAutoSubmitting(false)
    }
  }

  /*
    Loading
  */
  if (loading) {
    return (
      <main
        style={{
          padding: 40,
          fontFamily: 'Arial, sans-serif',
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        <h1>
          Loading Assessment...
        </h1>

        <p>
          Please wait while your
          assessment loads.
        </p>
      </main>
    )
  }

  /*
    Assessment failed to load
  */
  if (!assessment) {
    return (
      <main
        style={{
          padding: 40,
          fontFamily: 'Arial, sans-serif',
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        <h1>
          Unable to Load Assessment
        </h1>

        <p>
          {message ||
            'Assessment not found.'}
        </p>
      </main>
    )
  }

  const question =
    assessment.questions[
      currentQuestion
    ]

  const answeredCount =
    Object.keys(answers).length

  const totalQuestions =
    assessment.questions.length

  const isTimeCritical =
    timeRemaining !== null &&
    timeRemaining <= 60

  const isTimeWarning =
    timeRemaining !== null &&
    timeRemaining <= 300 &&
    timeRemaining > 60

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f7fa',
        padding: '25px 15px 50px',
        fontFamily:
          'Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <header
          style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: 20,
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.08)',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 26,
                }}
              >
                {assessment.title}
              </h1>

              <p
                style={{
                  margin: '8px 0 0',
                  color: '#555',
                }}
              >
                {assessment.subject} •
                Grade {assessment.grade}
              </p>
            </div>

            {/* Timer */}
            <div
              style={{
                padding:
                  '12px 20px',
                borderRadius: 10,
                background:
                  isTimeCritical
                    ? '#fee2e2'
                    : isTimeWarning
                    ? '#fff7ed'
                    : '#eef2ff',
                border:
                  isTimeCritical
                    ? '2px solid #dc2626'
                    : isTimeWarning
                    ? '2px solid #f97316'
                    : '2px solid #4f46e5',
                minWidth: 150,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform:
                    'uppercase',
                  marginBottom: 4,
                }}
              >
                Time Remaining
              </div>

              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color:
                    isTimeCritical
                      ? '#dc2626'
                      : isTimeWarning
                      ? '#ea580c'
                      : '#3730a3',
                }}
              >
                {formatTime(
                  timeRemaining
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Automatic submission message */}
        {autoSubmitting && (
          <div
            style={{
              background: '#fff7ed',
              border:
                '1px solid #f97316',
              padding: 15,
              borderRadius: 8,
              marginBottom: 20,
              fontWeight: 700,
            }}
          >
            Time is up. Your assessment
            is being submitted
            automatically...
          </div>
        )}

        {/* Progress */}
        <section
          style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              marginBottom: 10,
              fontWeight: 700,
            }}
          >
            <span>
              Question {currentQuestion + 1}{' '}
              of {totalQuestions}
            </span>

            <span>
              Answered: {answeredCount}/
              {totalQuestions}
            </span>
          </div>

          <div
            style={{
              height: 8,
              background: '#e5e7eb',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${
                  totalQuestions > 0
                    ? (answeredCount /
                        totalQuestions) *
                      100
                    : 0
                }%`,
                background:
                  '#4f46e5',
                transition:
                  'width 0.2s ease',
              }}
            />
          </div>
        </section>

        {/* Question */}
        <section
          style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: 25,
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              gap: 15,
              flexWrap: 'wrap',
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              Question {currentQuestion + 1}
            </h2>

            <span
              style={{
                fontSize: 13,
                color: '#666',
              }}
            >
              {question.topic} •{' '}
              {question.difficulty}
            </span>
          </div>

          <p
            style={{
              fontSize: 19,
              lineHeight: 1.6,
              fontWeight: 600,
            }}
          >
            {question.prompt}
          </p>

          {/* Options */}
          <div
            style={{
              marginTop: 20,
            }}
          >
            {question.options.map(
              (
                option,
                optionIndex
              ) => {
                const selected =
                  answers[
                    question.id
                  ] === optionIndex

                return (
                  <label
                    key={optionIndex}
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      gap: 12,
                      padding: 15,
                      marginTop: 10,
                      border:
                        selected
                          ? '2px solid #4f46e5'
                          : '1px solid #d1d5db',
                      borderRadius: 8,
                      background:
                        selected
                          ? '#eef2ff'
                          : '#ffffff',
                      cursor:
                        'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name={
                        question.id
                      }
                      checked={
                        selected
                      }
                      onChange={() =>
                        selectAnswer(
                          question.id,
                          optionIndex
                        )
                      }
                    />

                    <strong>
                      {String.fromCharCode(
                        65 +
                          optionIndex
                      )}
                      .
                    </strong>

                    <span>
                      {option}
                    </span>
                  </label>
                )
              }
            )}
          </div>
        </section>

        {/* Navigation */}
        <section
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: 10,
            marginTop: 20,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() =>
              setCurrentQuestion(
                (current) =>
                  Math.max(
                    0,
                    current - 1
                  )
              )
            }
            disabled={
              currentQuestion === 0 ||
              submitting
            }
            style={{
              padding:
                '12px 22px',
              border: '1px solid #ccc',
              borderRadius: 8,
              background:
                currentQuestion ===
                  0 || submitting
                  ? '#e5e7eb'
                  : '#ffffff',
              cursor:
                currentQuestion ===
                  0 || submitting
                  ? 'not-allowed'
                  : 'pointer',
              fontWeight: 700,
            }}
          >
            ← Previous
          </button>

          {currentQuestion <
          totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() =>
                setCurrentQuestion(
                  (current) =>
                    Math.min(
                      totalQuestions -
                        1,
                      current + 1
                    )
                )
              }
              disabled={submitting}
              style={{
                padding:
                  '12px 22px',
                border: 'none',
                borderRadius: 8,
                background:
                  '#4f46e5',
                color:
                  '#ffffff',
                cursor:
                  'pointer',
                fontWeight: 700,
              }}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (
                  Object.keys(
                    answers
                  ).length !==
                  totalQuestions
                ) {
                  setMessage(
                    'Please answer all questions before submitting.'
                  )
                  return
                }

                const confirmed =
                  window.confirm(
                    'Are you sure you want to submit your assessment? You will not be able to change your answers after submission.'
                  )

                if (confirmed) {
                  submitAssessment()
                }
              }}
              disabled={submitting}
              style={{
                padding:
                  '13px 26px',
                border: 'none',
                borderRadius: 8,
                background:
                  '#16a34a',
                color:
                  '#ffffff',
                cursor:
                  submitting
                    ? 'not-allowed'
                    : 'pointer',
                fontWeight: 800,
              }}
            >
              {submitting
                ? 'Submitting...'
                : 'Submit Assessment'}
            </button>
          )}
        </section>

        {/* Question Navigator */}
        <section
          style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: 20,
            marginTop: 20,
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Question Navigator
          </h3>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {assessment.questions.map(
              (
                item,
                index
              ) => {
                const answered =
                  answers[
                    item.id
                  ] !== undefined

                const active =
                  index ===
                  currentQuestion

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setCurrentQuestion(
                        index
                      )
                    }
                    disabled={
                      submitting
                    }
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 8,
                      border:
                        active
                          ? '3px solid #111827'
                          : '1px solid #d1d5db',
                      background:
                        answered
                          ? '#dcfce7'
                          : '#f9fafb',
                      fontWeight: 800,
                      cursor:
                        'pointer',
                    }}
                  >
                    {index + 1}
                  </button>
                )
              }
            )}
          </div>

          <p
            style={{
              marginBottom: 0,
              marginTop: 15,
              color: '#666',
              fontSize: 14,
            }}
          >
            Green = answered • White =
            unanswered • Dark border =
            current question
          </p>
        </section>

        {/* Message */}
        {message && (
          <div
            style={{
              marginTop: 20,
              padding: 15,
              borderRadius: 8,
              background: '#fee2e2',
              border:
                '1px solid #ef4444',
              color: '#991b1b',
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}
      </div>
    </main>
  )
}