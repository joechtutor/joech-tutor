'use client'

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

export default function AssessmentDetailsPage() {
  const params = useParams()
  const assessmentId = params.id as string

  const [assessment, setAssessment] =
    useState<Assessment | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

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

    if (assessmentId) {
      loadAssessment()
    }
  }, [assessmentId])

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
        <Link href="/dashboard/assessments">
          ← Back to Assessments
        </Link>

        <h1
          style={{
            marginTop: 25,
          }}
        >
          Unable to Load Assessment
        </h1>

        <p style={{ color: 'red' }}>
          {error || 'Assessment not found.'}
        </p>
      </main>
    )
  }

  const questions = [
    ...(assessment.assessment_questions || []),
  ].sort(
    (a, b) =>
      a.position - b.position
  )

  return (
    <main
      style={{
        padding: 40,
        fontFamily: 'Arial, sans-serif',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      <Link href="/dashboard/assessments">
        ← Back to Assessments
      </Link>

      <h1
        style={{
          marginTop: 20,
        }}
      >
        {assessment.title}
      </h1>

      <section
        style={{
          border: '1px solid #ddd',
          borderRadius: 12,
          padding: 25,
          marginTop: 25,
        }}
      >
        <h2>Assessment Information</h2>

        <p>
          <strong>Subject:</strong>{' '}
          {assessment.subject}
        </p>

        <p>
          <strong>Grade:</strong> Grade{' '}
          {assessment.grade}
        </p>

        <p>
          <strong>Duration:</strong>{' '}
          {assessment.duration_minutes}{' '}
          minutes
        </p>

        <p>
          <strong>Questions:</strong>{' '}
          {questions.length}
        </p>

        <p>
          <strong>Created:</strong>{' '}
          {new Date(
            assessment.created_at
          ).toLocaleDateString()}
        </p>
      </section>

      <section
        style={{
          marginTop: 35,
        }}
      >
        <h2>Questions</h2>

        {questions.length === 0 ? (
          <p>
            No questions have been added
            to this assessment.
          </p>
        ) : (
          questions.map(
            (item, index) => {
              const question =
                item.question

              return (
                <article
                  key={
                    item.question_id
                  }
                  style={{
                    border:
                      '1px solid #ddd',
                    borderRadius: 10,
                    padding: 20,
                    marginBottom: 15,
                  }}
                >
                  <h3>
                    Question {index + 1}
                  </h3>

                  {question ? (
                    <>
                      <p>
                        <strong>
                          Topic:
                        </strong>{' '}
                        {question.topic ||
                          'Not specified'}
                      </p>

                      <p>
                        <strong>
                          Difficulty:
                        </strong>{' '}
                        {
                          question.difficulty
                        }
                      </p>

                      <p
                        style={{
                          fontSize: 17,
                          lineHeight: 1.6,
                        }}
                      >
                        {question.prompt}
                      </p>

                      {Array.isArray(
                        question.options
                      ) &&
                        question.options
                          .length >
                          0 && (
                          <ol
                            type="A"
                            style={{
                              lineHeight:
                                1.8,
                            }}
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
                                  {option}
                                </li>
                              )
                            )}
                          </ol>
                        )}
                    </>
                  ) : (
                    <p>
                      Question information
                      is unavailable.
                    </p>
                  )}
                </article>
              )
            }
          )
        )}
      </section>
    </main>
  )
}