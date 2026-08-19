'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Assessment = {
  id: string
  title: string
  subject: string
  grade: number
  duration_minutes: number
  assigned_at: string
}

export default function StudentAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function loadAssessments() {
    try {
      setLoading(true)
      setMessage('')

      const response = await fetch(
        '/api/student/assessments',
        {
          cache: 'no-store',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(
          data.error ||
            'Unable to load your assessments.'
        )
        return
      }

      setAssessments(data.assessments || [])
    } catch {
      setMessage(
        'Unable to connect to the server.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssessments()
  }, [])

  function formatDate(value: string) {
    if (!value) {
      return 'Not available'
    }

    return new Date(value).toLocaleDateString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  return (
    <main className="student-assessments-page">

      {/* HEADER */}

      <header className="student-portal-header">

        <div className="student-portal-header-inner">

          <Link
            href="/dashboard"
            className="student-brand"
          >
            <img
              src="/joech-logo.jpg"
              alt="JOECH TUTOR"
              className="student-brand-logo"
            />

            <div>
              <div className="student-brand-name">
                JOECH TUTOR
              </div>

              <div className="student-brand-motto">
                Excellence Beyond Borders
              </div>
            </div>
          </Link>

          <div className="student-header-right">

            <Link
              href="/dashboard"
              className="student-header-link"
            >
              Dashboard
            </Link>

            <div className="student-role-badge">
              STUDENT
            </div>

          </div>

        </div>

      </header>

      {/* MAIN */}

      <div className="student-assessments-main">

        {/* BREADCRUMB */}

        <div className="student-breadcrumb">

          <Link href="/dashboard">
            Dashboard
          </Link>

          <span>›</span>

          <span>
            My Assessments
          </span>

        </div>

        {/* HERO */}

        <section className="student-assessments-hero">

          <div className="student-assessments-hero-content">

            <div>

              <div className="student-portal-label">
                STUDENT PORTAL
              </div>

              <h1>
                My Assessments
              </h1>

              <p>
                View and complete the assessments
                assigned to you.
              </p>

            </div>

            <div className="student-assessment-count">

              <div className="student-assessment-count-number">
                {assessments.length}
              </div>

              <div className="student-assessment-count-label">
                Assigned
              </div>

            </div>

          </div>

        </section>

        {/* CONTENT */}

        <section className="student-assessments-section">

          <div className="student-section-heading">

            <div>

              <h2>
                Assigned Assessments
              </h2>

              <p>
                Select an assessment below
                to begin.
              </p>

            </div>

            {!loading &&
              assessments.length > 0 && (
                <div className="student-section-count">
                  {assessments.length}{' '}
                  {assessments.length === 1
                    ? 'assessment'
                    : 'assessments'}
                </div>
              )}

          </div>

          {/* LOADING */}

          {loading && (

            <div className="student-loading-card">

              <div className="student-loading-spinner" />

              <h3>
                Loading assessments...
              </h3>

              <p>
                Please wait while your
                assessments are loaded.
              </p>

            </div>

          )}

          {/* ERROR */}

          {!loading && message && (

            <div className="student-error-card">

              <div className="student-error-icon">
                !
              </div>

              <div>

                <h3>
                  Unable to Load Assessments
                </h3>

                <p>
                  {message}
                </p>

                <button
                  type="button"
                  className="student-retry-button"
                  onClick={loadAssessments}
                >
                  Try Again
                </button>

              </div>

            </div>

          )}

          {/* EMPTY */}

          {!loading &&
            !message &&
            assessments.length === 0 && (

              <div className="student-empty-card">

                <div className="student-empty-icon">
                  📋
                </div>

                <h3>
                  No Assessments Assigned
                </h3>

                <p>
                  You currently have no
                  assessments assigned to you.
                </p>

                <Link
                  href="/dashboard"
                  className="student-back-button"
                >
                  ← Back to Dashboard
                </Link>

              </div>

            )}

          {/* ASSESSMENTS */}

          {!loading &&
            !message &&
            assessments.length > 0 && (

              <div className="student-assessment-grid">

                {assessments.map(
                  (assessment, index) => (

                    <article
                      key={assessment.id}
                      className="student-assessment-card"
                    >

                      {/* CARD TOP */}

                      <div className="student-assessment-card-top">

                        <div className="student-assessment-number">
                          {String(index + 1).padStart(
                            2,
                            '0'
                          )}
                        </div>

                        <div className="student-subject-badge">
                          {assessment.subject}
                        </div>

                      </div>

                      {/* TITLE */}

                      <h3 className="student-assessment-title">
                        {assessment.title}
                      </h3>

                      {/* DETAILS */}

                      <div className="student-assessment-details">

                        <div className="student-detail-item">

                          <span className="student-detail-icon">
                            🎓
                          </span>

                          <div>

                            <span className="student-detail-label">
                              Grade
                            </span>

                            <strong>
                              Grade{' '}
                              {assessment.grade}
                            </strong>

                          </div>

                        </div>

                        <div className="student-detail-item">

                          <span className="student-detail-icon">
                            ⏱
                          </span>

                          <div>

                            <span className="student-detail-label">
                              Duration
                            </span>

                            <strong>
                              {
                                assessment.duration_minutes
                              }{' '}
                              minutes
                            </strong>

                          </div>

                        </div>

                        <div className="student-detail-item">

                          <span className="student-detail-icon">
                            📅
                          </span>

                          <div>

                            <span className="student-detail-label">
                              Assigned
                            </span>

                            <strong>
                              {formatDate(
                                assessment.assigned_at
                              )}
                            </strong>

                          </div>

                        </div>

                      </div>

                      {/* START BUTTON */}

                      <Link
                        href={`/dashboard/student/assessments/take/${assessment.id}`}
                        className="student-start-button"
                      >
                        <span>
                          Start Assessment
                        </span>

                        <span className="student-start-arrow">
                          →
                        </span>
                      </Link>

                    </article>

                  )
                )}

              </div>

            )}

        </section>

        {/* FOOTER */}

        <footer className="student-portal-footer">
          <strong>
            JOECH TUTOR
          </strong>

          <span>
            •
          </span>

          <span>
            Excellence Beyond Borders
          </span>
        </footer>

      </div>

    </main>
  )
}