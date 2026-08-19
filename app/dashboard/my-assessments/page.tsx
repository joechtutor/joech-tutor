'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Assessment = {
  assessment_id: string
  assigned_at: string
  assessment_title?: string
  subject?: string
  grade?: number
  duration_minutes?: number
  question_count?: number
}

export default function MyAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAssessments() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch('/api/assignments')

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error || 'Unable to load assessments'
          )
        }

        setAssessments(data.assignments || [])
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load assessments'
        )
      } finally {
        setLoading(false)
      }
    }

    loadAssessments()
  }, [])

  return (
    <main
      style={{
        padding: 40,
        fontFamily: 'Arial, sans-serif',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      <Link
        href="/dashboard"
        style={{
          textDecoration: 'none',
          fontWeight: 'bold',
        }}
      >
        ← Back to Dashboard
      </Link>

      <h1 style={{ marginTop: 25 }}>
        My Assessments
      </h1>

      <p
        style={{
          color: '#666',
          marginBottom: 30,
        }}
      >
        View assessments assigned to you and complete your available tests.
      </p>

      {loading && (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: 12,
            padding: 25,
          }}
        >
          <p>Loading your assessments...</p>
        </div>
      )}

      {error && (
        <div
          style={{
            border: '1px solid #f0caca',
            background: '#fff5f5',
            borderRadius: 12,
            padding: 25,
            color: '#b00020',
          }}
        >
          <h3>Unable to Load Assessments</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        assessments.length === 0 && (
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: 12,
              padding: 30,
            }}
          >
            <h2>No Assessments Assigned</h2>

            <p>
              You currently have no assessments assigned to you.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        assessments.length > 0 && (
          <div
            style={{
              display: 'grid',
              gap: 20,
            }}
          >
            {assessments.map((assessment) => (
              <section
                key={assessment.assessment_id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 12,
                  padding: 25,
                }}
              >
                <h2>
                  {assessment.assessment_title || 'Assessment'}
                </h2>

                <p>
                  <strong>Subject:</strong>{' '}
                  {assessment.subject || '-'}
                </p>

                <p>
                  <strong>Grade:</strong>{' '}
                  {assessment.grade
                    ? `Grade ${assessment.grade}`
                    : '-'}
                </p>

                <p>
                  <strong>Duration:</strong>{' '}
                  {assessment.duration_minutes
                    ? `${assessment.duration_minutes} minutes`
                    : '-'}
                </p>

                <p>
                  <strong>Questions:</strong>{' '}
                  {assessment.question_count || '-'}
                </p>

                <p style={{ color: '#666' }}>
                  <strong>Assigned:</strong>{' '}
                  {assessment.assigned_at
                    ? new Date(
                        assessment.assigned_at
                      ).toLocaleString()
                    : '-'}
                </p>

                <Link
                  href={`/dashboard/take-assessment/${assessment.assessment_id}`}
                  style={{
                    display: 'inline-block',
                    marginTop: 15,
                    padding: '12px 20px',
                    background: '#111',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: 6,
                    fontWeight: 'bold',
                  }}
                >
                  Start Assessment
                </Link>
              </section>
            ))}
          </div>
        )}
    </main>
  )
}