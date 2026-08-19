'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Result = {
  score: number
  letter: string
  totalQuestions: number
  correctAnswers: number
}

export default function AssessmentResultPage() {
  const params = useParams()
  const router = useRouter()

  const assessmentId = params.id as string

  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadResult() {
      try {
        const response = await fetch(
          `/api/student/assessments/${assessmentId}/result`
        )

        const data = await response.json()

        if (!response.ok) {
          setMessage(
            data.error || 'Unable to load your result.'
          )
          return
        }

        setResult(data.result)
      } catch {
        setMessage('Unable to connect to the server.')
      } finally {
        setLoading(false)
      }
    }

    if (assessmentId) {
      loadResult()
    }
  }, [assessmentId])

  if (loading) {
    return (
      <main style={{ padding: 40, fontFamily: 'Arial' }}>
        <h1>Loading Result...</h1>
      </main>
    )
  }

  if (!result) {
    return (
      <main style={{ padding: 40, fontFamily: 'Arial' }}>
        <h1>Unable to Load Result</h1>
        <p>{message || 'Result not found.'}</p>

        <button
          type="button"
          onClick={() =>
            router.push(
              '/dashboard/student/assessments'
            )
          }
          style={{
            marginTop: 20,
            padding: '10px 18px',
            cursor: 'pointer',
          }}
        >
          Back to My Assessments
        </button>
      </main>
    )
  }

  return (
    <main
      style={{
        padding: 40,
        fontFamily: 'Arial',
        maxWidth: 700,
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <h1>Assessment Result</h1>

      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: 12,
          padding: 30,
          marginTop: 25,
        }}
      >
        <h2>{result.score}%</h2>

        <p>
          <strong>Grade:</strong> {result.letter}
        </p>

        <p>
          <strong>Correct Answers:</strong>{' '}
          {result.correctAnswers}
        </p>

        <p>
          <strong>Total Questions:</strong>{' '}
          {result.totalQuestions}
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          router.push(
            '/dashboard/student/assessments'
          )
        }
        style={{
          marginTop: 25,
          padding: '12px 22px',
          cursor: 'pointer',
        }}
      >
        Back to My Assessments
      </button>
    </main>
  )
}