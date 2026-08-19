'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Assessment = {
  id: string
  title: string
  subject: string
  grade: number
  duration_minutes: number
}

type Result = {
  id: string
  assessment_id: string
  score: number
  letter: string
  total_questions: number
  correct_answers: number
  created_at: string | null
  assessment: Assessment | null
}

export default function StudentResultsPage() {
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
          '/api/student/results',
          {
            cache: 'no-store',
          }
        )

        const data = await response.json()

        if (!response.ok) {
          setMessage(
            data.error ||
              'Unable to load your results.'
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

  const scores = results
    .map((result) => Number(result.score))
    .filter((score) => !Number.isNaN(score))

  const averageScore =
    scores.length > 0
      ? Math.round(
          scores.reduce(
            (total, score) => total + score,
            0
          ) / scores.length
        )
      : 0

  const bestScore =
    scores.length > 0
      ? Math.max(...scores)
      : 0

  const totalCorrect = results.reduce(
    (total, result) =>
      total + Number(result.correct_answers || 0),
    0
  )

  const totalQuestions = results.reduce(
    (total, result) =>
      total + Number(result.total_questions || 0),
    0
  )

  const overallAccuracy =
    totalQuestions > 0
      ? Math.round(
          (totalCorrect / totalQuestions) * 100
        )
      : 0

  function getScoreClass(score: number) {
    if (score >= 70) {
      return 'result-score-excellent'
    }

    if (score >= 50) {
      return 'result-score-average'
    }

    return 'result-score-low'
  }

  function getPerformanceLabel(score: number) {
    if (score >= 80) return 'Excellent'
    if (score >= 70) return 'Very Good'
    if (score >= 60) return 'Good'
    if (score >= 50) return 'Fair'
    return 'Needs Improvement'
  }

  function formatDate(date: string | null) {
    if (!date) {
      return 'Recently completed'
    }

    return new Date(date).toLocaleDateString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  return (
    <main className="results-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="results-header">
        <div className="results-header-inner">

          <Link
            href="/dashboard"
            className="results-brand"
          >
            <Image
              src="/joech-logo.jpg"
              alt="JOECH TUTOR"
              width={64}
              height={64}
              priority
              className="results-brand-logo"
            />

            <div className="results-brand-text">
              <div className="results-brand-name">
                JOECH TUTOR
              </div>

              <div className="results-brand-motto">
                Excellence Beyond Borders
              </div>
            </div>
          </Link>

          <div className="results-header-actions">

            <Link
              href="/dashboard/student/assessments"
              className="results-assessment-button"
            >
              <span>＋</span>
              My Assessments
            </Link>

            <Link
              href="/dashboard"
              className="results-home-button"
            >
              Dashboard
            </Link>

          </div>

        </div>
      </header>


      {/* =====================================================
          MAIN
          ===================================================== */}

      <div className="results-container">

        {/* ===================================================
            PAGE INTRO
            =================================================== */}

        <section className="results-page-intro">

          <div>

            <span className="results-kicker">
              STUDENT PERFORMANCE
            </span>

            <h1>
              My Results
            </h1>

            <p>
              Review your assessment performance,
              track your progress and identify areas
              where you can improve.
            </p>

          </div>

          <div className="results-intro-badge">
            <span>✓</span>
            Completed Assessments
            <strong>{results.length}</strong>
          </div>

        </section>


        {/* ===================================================
            LOADING
            =================================================== */}

        {loading && (
          <section className="results-loading-card">

            <div className="loading-spinner" />

            <h2>
              Loading your results
            </h2>

            <p>
              Please wait while we retrieve
              your assessment performance.
            </p>

          </section>
        )}


        {/* ===================================================
            ERROR
            =================================================== */}

        {!loading && message && (
          <section className="results-message-card">

            <div className="message-icon">
              !
            </div>

            <div>
              <h2>
                Unable to load results
              </h2>

              <p>
                {message}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="retry-button"
              >
                Try Again
              </button>
            </div>

          </section>
        )}


        {/* ===================================================
            SUMMARY
            =================================================== */}

        {!loading &&
          !message &&
          results.length > 0 && (
            <>
              <section className="results-summary">

                <div className="summary-card">

                  <div className="summary-icon summary-blue">
                    ◫
                  </div>

                  <div>
                    <span>
                      COMPLETED
                    </span>

                    <strong>
                      {results.length}
                    </strong>

                    <small>
                      Assessments completed
                    </small>
                  </div>

                </div>


                <div className="summary-card">

                  <div className="summary-icon summary-green">
                    ✓
                  </div>

                  <div>
                    <span>
                      AVERAGE SCORE
                    </span>

                    <strong>
                      {averageScore}%
                    </strong>

                    <small>
                      Overall performance
                    </small>
                  </div>

                </div>


                <div className="summary-card">

                  <div className="summary-icon summary-gold">
                    ★
                  </div>

                  <div>
                    <span>
                      BEST SCORE
                    </span>

                    <strong>
                      {bestScore}%
                    </strong>

                    <small>
                      Highest achievement
                    </small>
                  </div>

                </div>


                <div className="summary-card">

                  <div className="summary-icon summary-purple">
                    ◆
                  </div>

                  <div>
                    <span>
                      ACCURACY
                    </span>

                    <strong>
                      {overallAccuracy}%
                    </strong>

                    <small>
                      Correct answers
                    </small>
                  </div>

                </div>

              </section>


              {/* =================================================
                  CONTENT GRID
                  ================================================= */}

              <div className="results-main-grid">

                {/* ===============================================
                    RESULTS LIST
                    =============================================== */}

                <section className="results-panel">

                  <div className="results-panel-heading">

                    <div>
                      <span className="panel-kicker">
                        ASSESSMENT HISTORY
                      </span>

                      <h2>
                        Your Results
                      </h2>

                      <p>
                        Your recently completed
                        assessments and scores.
                      </p>
                    </div>

                    <div className="results-count">
                      {results.length}{' '}
                      {results.length === 1
                        ? 'Result'
                        : 'Results'}
                    </div>

                  </div>


                  <div className="results-list">

                    {results.map(
                      (result, index) => {

                        const score =
                          Number(result.score)

                        const percentage =
                          Math.max(
                            0,
                            Math.min(
                              100,
                              score
                            )
                          )

                        const performance =
                          getPerformanceLabel(
                            score
                          )

                        return (
                          <article
                            key={result.id}
                            className="result-card"
                          >

                            <div className="result-card-top">

                              <div className="result-index">
                                {String(
                                  index + 1
                                ).padStart(
                                  2,
                                  '0'
                                )}
                              </div>

                              <div className="result-main-info">

                                <div className="result-title-row">

                                  <h3>
                                    {result
                                      .assessment
                                      ?.title ||
                                      'Assessment'}
                                  </h3>

                                  <span
                                    className={`performance-badge ${getScoreClass(
                                      score
                                    )}`}
                                  >
                                    {performance}
                                  </span>

                                </div>

                                <div className="result-meta">

                                  <span>
                                    <strong>
                                      Subject
                                    </strong>

                                    {result
                                      .assessment
                                      ?.subject ||
                                      'N/A'}
                                  </span>

                                  <span>
                                    <strong>
                                      Grade
                                    </strong>

                                    {result
                                      .assessment
                                      ?.grade ||
                                      'N/A'}
                                  </span>

                                  <span>
                                    <strong>
                                      Completed
                                    </strong>

                                    {formatDate(
                                      result.created_at
                                    )}
                                  </span>

                                </div>

                              </div>


                              <div className="result-score-box">

                                <strong
                                  className={getScoreClass(
                                    score
                                  )}
                                >
                                  {score}%
                                </strong>

                                <span>
                                  Grade{' '}
                                  {result.letter ||
                                    '-'}
                                </span>

                              </div>

                            </div>


                            {/* SCORE PROGRESS */}

                            <div className="result-progress-section">

                              <div className="result-progress-labels">

                                <span>
                                  Performance
                                </span>

                                <strong>
                                  {percentage}%
                                </strong>

                              </div>

                              <div className="result-progress-track">

                                <div
                                  className={`result-progress-fill ${getScoreClass(
                                    score
                                  )}`}
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />

                              </div>

                            </div>


                            {/* RESULT DETAILS */}

                            <div className="result-bottom">

                              <div className="result-stat">

                                <span className="result-stat-icon">
                                  ✓
                                </span>

                                <div>
                                  <small>
                                    CORRECT
                                  </small>

                                  <strong>
                                    {
                                      result.correct_answers
                                    }
                                  </strong>
                                </div>

                              </div>


                              <div className="result-stat">

                                <span className="result-stat-icon neutral">
                                  #
                                </span>

                                <div>
                                  <small>
                                    TOTAL QUESTIONS
                                  </small>

                                  <strong>
                                    {
                                      result.total_questions
                                    }
                                  </strong>
                                </div>

                              </div>


                              <div className="result-stat">

                                <span className="result-stat-icon blue">
                                  %
                                </span>

                                <div>
                                  <small>
                                    SCORE
                                  </small>

                                  <strong>
                                    {score}%
                                  </strong>
                                </div>

                              </div>


                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/student/assessments/${result.assessment_id}/result`
                                  )
                                }
                                className="view-result-button"
                              >
                                View Result
                                <span>
                                  →
                                </span>
                              </button>

                            </div>

                          </article>
                        )
                      }
                    )}

                  </div>

                </section>


                {/* ===============================================
                    RIGHT SIDEBAR
                    =============================================== */}

                <aside className="results-sidebar">

                  {/* =============================================
                      PERFORMANCE CARD
                      ============================================= */}

                  <section className="performance-card">

                    <div className="performance-card-heading">

                      <div>
                        <span>
                          OVERALL PERFORMANCE
                        </span>

                        <h2>
                          Keep Growing
                        </h2>
                      </div>

                      <div className="performance-star">
                        ★
                      </div>

                    </div>


                    <div
                      className="results-ring"
                      style={{
                        background:
                          `conic-gradient(#ffffff ${averageScore}%, rgba(255,255,255,.18) ${averageScore}% 100%)`,
                      }}
                    >

                      <div className="results-ring-inner">

                        <strong>
                          {averageScore}%
                        </strong>

                        <span>
                          Average
                        </span>

                      </div>

                    </div>


                    <p>
                      {averageScore >= 70
                        ? 'Excellent work! Keep maintaining your strong performance.'
                        : averageScore >= 50
                          ? 'Good progress! Keep practising to reach the next level.'
                          : 'Keep practising and use every assessment as an opportunity to improve.'}
                    </p>

                  </section>


                  {/* =============================================
                      PERFORMANCE TARGET
                      ============================================= */}

                  <section className="target-card">

                    <div className="target-heading">

                      <div>
                        <span>
                          YOUR TARGET
                        </span>

                        <h2>
                          70%+
                        </h2>
                      </div>

                      <div className="target-icon">
                        🎯
                      </div>

                    </div>


                    <div className="target-track">

                      <div
                        className="target-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (averageScore /
                                70) *
                                100
                            )
                          )}%`,
                        }}
                      />

                    </div>

                    <p>
                      {averageScore >= 70
                        ? 'You have reached your target. Excellent!'
                        : `${70 - averageScore}% more to reach your 70% target.`}
                    </p>

                  </section>


                  {/* =============================================
                      QUICK ACTIONS
                      ============================================= */}

                  <section className="results-actions-card">

                    <div className="actions-heading">

                      <div>
                        <span>
                          SHORTCUTS
                        </span>

                        <h2>
                          Quick Access
                        </h2>
                      </div>

                      <div className="actions-icon">
                        ⚡
                      </div>

                    </div>


                    <Link
                      href="/dashboard/student/assessments"
                      className="result-action-link"
                    >

                      <div className="action-link-icon action-blue">
                        📝
                      </div>

                      <div>
                        <strong>
                          Assessments
                        </strong>

                        <small>
                          Take an assessment
                        </small>
                      </div>

                      <span>
                        →
                      </span>

                    </Link>


                    <Link
                      href="/dashboard"
                      className="result-action-link"
                    >

                      <div className="action-link-icon action-green">
                        🏠
                      </div>

                      <div>
                        <strong>
                          Dashboard
                        </strong>

                        <small>
                          Return to dashboard
                        </small>
                      </div>

                      <span>
                        →
                      </span>

                    </Link>

                  </section>

                </aside>

              </div>


              {/* =================================================
                  MOTIVATIONAL MESSAGE
                  ================================================= */}

              <section className="results-motivation">

                <div className="motivation-icon">
                  ✦
                </div>

                <div>

                  <strong>
                    Excellence Beyond Borders
                  </strong>

                  <p>
                    Your results are not just numbers.
                    They show your progress, effort and
                    commitment to learning. Keep improving
                    one assessment at a time.
                  </p>

                </div>

              </section>

            </>
          )}


        {/* ===================================================
            NO RESULTS
            =================================================== */}

        {!loading &&
          !message &&
          results.length === 0 && (

            <section className="no-results-card">

              <div className="no-results-icon">
                📊
              </div>

              <span className="results-kicker">
                PERFORMANCE HISTORY
              </span>

              <h2>
                No Results Yet
              </h2>

              <p>
                You have not completed any assessments
                yet. Complete your first assessment to
                start building your performance history.
              </p>

              <Link
                href="/dashboard/student/assessments"
                className="no-results-button"
              >
                View My Assessments
                <span>→</span>
              </Link>

            </section>

          )}

      </div>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="results-footer">

        <div>

          <strong>
            JOECH TUTOR
          </strong>

          <span>
            Excellence Beyond Borders
          </span>

        </div>

        <p>
          Mathematics & English Assessment Platform
        </p>

      </footer>


      {/* =====================================================
          STYLES
          ===================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .results-page {
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

        /* ================================================
           HEADER
        ================================================= */

        .results-header {
          position: sticky;
          top: 0;
          z-index: 30;
          background: #ffffff;
          border-bottom: 1px solid #e5e9f0;
        }

        .results-header-inner {
          max-width: 1380px;
          min-height: 84px;
          margin: 0 auto;
          padding: 12px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .results-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          color: inherit;
          text-decoration: none;
        }

        .results-brand-logo {
          width: 58px;
          height: 58px;
          object-fit: cover;
          border-radius: 10px;
        }

        .results-brand-name {
          color: #0d2340;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: .4px;
        }

        .results-brand-motto {
          margin-top: 2px;
          color: #0b5ed7;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .5px;
        }

        .results-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .results-assessment-button,
        .results-home-button {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 16px;
          border-radius: 9px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
        }

        .results-assessment-button {
          color: #ffffff;
          background: #0b5ed7;
          box-shadow:
            0 8px 18px
            rgba(11,94,215,.18);
        }

        .results-home-button {
          color: #0b5ed7;
          background: #eef5ff;
          border: 1px solid #d7e5fa;
        }

        /* ================================================
           CONTAINER
        ================================================= */

        .results-container {
          max-width: 1380px;
          margin: 0 auto;
          padding: 34px 32px 45px;
        }

        /* ================================================
           PAGE INTRO
        ================================================= */

        .results-page-intro {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 25px;
          margin-bottom: 25px;
        }

        .results-kicker {
          display: block;
          color: #0b5ed7;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .results-page-intro h1 {
          margin: 6px 0 5px;
          color: #172033;
          font-size: 38px;
          line-height: 1.1;
          letter-spacing: -1px;
          font-weight: 850;
        }

        .results-page-intro p {
          max-width: 650px;
          margin: 0;
          color: #718096;
          font-size: 14px;
          line-height: 1.65;
        }

        .results-intro-badge {
          min-width: 190px;
          padding: 15px 17px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          background: #ffffff;
          border: 1px solid #e5e9f0;
          border-radius: 13px;
          box-shadow:
            0 7px 20px
            rgba(23,32,51,.04);
          color: #718096;
          font-size: 10px;
          font-weight: 800;
        }

        .results-intro-badge span {
          width: 27px;
          height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #e8f8ef;
          color: #159957;
          font-size: 13px;
        }

        .results-intro-badge strong {
          margin-left: auto;
          color: #172033;
          font-size: 20px;
        }

        /* ================================================
           SUMMARY
        ================================================= */

        .results-summary {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 17px;
          margin-bottom: 22px;
        }

        .summary-card {
          min-height: 112px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 19px;
          background: #ffffff;
          border: 1px solid #e5e9f0;
          border-radius: 15px;
          box-shadow:
            0 8px 24px
            rgba(23,32,51,.045);
        }

        .summary-icon {
          width: 47px;
          height: 47px;
          flex: 0 0 47px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 19px;
          font-weight: 900;
        }

        .summary-blue {
          color: #0b5ed7;
          background: #e8f1ff;
        }

        .summary-green {
          color: #159957;
          background: #e8f8ef;
        }

        .summary-gold {
          color: #c88a00;
          background: #fff5d9;
        }

        .summary-purple {
          color: #7048c8;
          background: #f0eaff;
        }

        .summary-card > div:last-child {
          min-width: 0;
        }

        .summary-card span {
          display: block;
          color: #718096;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .8px;
        }

        .summary-card strong {
          display: block;
          margin-top: 3px;
          color: #172033;
          font-size: 25px;
          line-height: 1.1;
        }

        .summary-card small {
          display: block;
          margin-top: 4px;
          color: #8993a5;
          font-size: 10px;
        }

        /* ================================================
           MAIN GRID
        ================================================= */

        .results-main-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr) 350px;
          gap: 22px;
          align-items: start;
        }

        .results-panel {
          min-width: 0;
          padding: 27px;
          background: #ffffff;
          border: 1px solid #e5e9f0;
          border-radius: 17px;
          box-shadow:
            0 8px 24px
            rgba(23,32,51,.05);
        }

        .results-panel-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .panel-kicker {
          color: #0b5ed7;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .results-panel-heading h2 {
          margin: 5px 0 4px;
          color: #172033;
          font-size: 24px;
        }

        .results-panel-heading p {
          margin: 0;
          color: #718096;
          font-size: 12px;
          line-height: 1.6;
        }

        .results-count {
          padding: 7px 10px;
          border-radius: 8px;
          background: #f1f5fa;
          color: #718096;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        /* ================================================
           RESULT CARD
        ================================================= */

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .result-card {
          padding: 19px;
          border: 1px solid #e5eaf1;
          border-radius: 14px;
          background: #ffffff;
          transition:
            transform .18s ease,
            border-color .18s ease,
            box-shadow .18s ease;
        }

        .result-card:hover {
          transform: translateY(-2px);
          border-color: #cdddf3;
          box-shadow:
            0 10px 25px
            rgba(23,32,51,.065);
        }

        .result-card-top {
          display: grid;
          grid-template-columns:
            36px minmax(0, 1fr) 90px;
          gap: 13px;
          align-items: start;
        }

        .result-index {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #f0f5fb;
          color: #718096;
          font-size: 10px;
          font-weight: 900;
        }

        .result-main-info {
          min-width: 0;
        }

        .result-title-row {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
        }

        .result-title-row h3 {
          margin: 0;
          color: #172033;
          font-size: 15px;
          font-weight: 800;
        }

        .performance-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 7px;
          border-radius: 999px;
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .4px;
        }

        .result-score-excellent {
          color: #159957;
        }

        .result-score-average {
          color: #c88a00;
        }

        .result-score-low {
          color: #d64545;
        }

        .performance-badge.result-score-excellent {
          background: #e8f8ef;
        }

        .performance-badge.result-score-average {
          background: #fff5d9;
        }

        .performance-badge.result-score-low {
          background: #fff0f0;
        }

        .result-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 8px;
        }

        .result-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #8993a5;
          font-size: 10px;
        }

        .result-meta strong {
          color: #5e6b7d;
          font-weight: 800;
        }

        .result-score-box {
          text-align: right;
        }

        .result-score-box strong {
          display: block;
          font-size: 27px;
          line-height: 1;
          font-weight: 900;
        }

        .result-score-box span {
          display: block;
          margin-top: 5px;
          color: #718096;
          font-size: 10px;
          font-weight: 800;
        }

        /* ================================================
           PROGRESS
        ================================================= */

        .result-progress-section {
          margin-top: 17px;
          padding-top: 15px;
          border-top: 1px solid #edf0f4;
        }

        .result-progress-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 7px;
          color: #8993a5;
          font-size: 9px;
          font-weight: 800;
        }

        .result-progress-labels strong {
          color: #172033;
        }

        .result-progress-track {
          height: 7px;
          overflow: hidden;
          border-radius: 999px;
          background: #edf1f6;
        }

        .result-progress-fill {
          height: 100%;
          border-radius: inherit;
          transition: width .5s ease;
        }

        .result-progress-fill.result-score-excellent {
          background: #159957;
        }

        .result-progress-fill.result-score-average {
          background: #d39a18;
        }

        .result-progress-fill.result-score-low {
          background: #d64545;
        }

        /* ================================================
           BOTTOM RESULT DETAILS
        ================================================= */

        .result-bottom {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-top: 16px;
          padding-top: 15px;
          border-top: 1px solid #edf0f4;
        }

        .result-stat {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .result-stat-icon {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #e8f8ef;
          color: #159957;
          font-size: 12px;
          font-weight: 900;
        }

        .result-stat-icon.neutral {
          background: #f1f4f8;
          color: #718096;
        }

        .result-stat-icon.blue {
          background: #e8f1ff;
          color: #0b5ed7;
        }

        .result-stat div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .result-stat small {
          color: #8993a5;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .4px;
        }

        .result-stat strong {
          color: #172033;
          font-size: 13px;
        }

        .view-result-button {
          min-height: 38px;
          margin-left: auto;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          border-radius: 9px;
          background: #0b5ed7;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          box-shadow:
            0 7px 16px
            rgba(11,94,215,.15);
          transition:
            transform .18s ease,
            box-shadow .18s ease;
        }

        .view-result-button:hover {
          transform: translateY(-2px);
          box-shadow:
            0 10px 20px
            rgba(11,94,215,.22);
        }

        /* ================================================
           SIDEBAR
        ================================================= */

        .results-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ================================================
           PERFORMANCE CARD
        ================================================= */

        .performance-card {
          padding: 25px;
          overflow: hidden;
          border-radius: 17px;
          background:
            linear-gradient(
              145deg,
              #082b59 0%,
              #0b5ed7 100%
            );
          color: #ffffff;
          box-shadow:
            0 15px 35px
            rgba(8,43,89,.15);
        }

        .performance-card-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .performance-card-heading span {
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
          opacity: .72;
        }

        .performance-card-heading h2 {
          margin: 5px 0 0;
          font-size: 21px;
        }

        .performance-star {
          font-size: 24px;
        }

        .results-ring {
          width: 165px;
          height: 165px;
          margin: 25px auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .results-ring-inner {
          width: 128px;
          height: 128px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #ffffff;
          color: #172033;
        }

        .results-ring-inner strong {
          font-size: 29px;
          line-height: 1;
        }

        .results-ring-inner span {
          margin-top: 5px;
          color: #718096;
          font-size: 10px;
        }

        .performance-card > p {
          margin: 0;
          color: rgba(255,255,255,.82);
          font-size: 11px;
          line-height: 1.65;
          text-align: center;
        }

        /* ================================================
           TARGET
        ================================================= */

        .target-card {
          padding: 23px;
          background: #ffffff;
          border: 1px solid #e5e9f0;
          border-radius: 17px;
          box-shadow:
            0 8px 24px
            rgba(23,32,51,.05);
        }

        .target-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .target-heading span {
          color: #0b5ed7;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .target-heading h2 {
          margin: 4px 0 0;
          color: #172033;
          font-size: 24px;
        }

        .target-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #fff5d9;
          font-size: 19px;
        }

        .target-track {
          height: 9px;
          margin-top: 18px;
          overflow: hidden;
          border-radius: 999px;
          background: #edf1f6;
        }

        .target-fill {
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #0b5ed7,
              #2d83ed
            );
        }

        .target-card p {
          margin: 10px 0 0;
          color: #718096;
          font-size: 11px;
          line-height: 1.5;
        }

        /* ================================================
           ACTIONS
        ================================================= */

        .results-actions-card {
          padding: 23px;
          background: #ffffff;
          border: 1px solid #e5e9f0;
          border-radius: 17px;
          box-shadow:
            0 8px 24px
            rgba(23,32,51,.05);
        }

        .actions-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 13px;
        }

        .actions-heading span {
          color: #0b5ed7;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .actions-heading h2 {
          margin: 4px 0 0;
          color: #172033;
          font-size: 20px;
        }

        .actions-icon {
          font-size: 21px;
        }

        .result-action-link {
          min-height: 58px;
          display: flex;
          align-items: center;
          gap: 11px;
          border-top: 1px solid #edf0f4;
          color: inherit;
          text-decoration: none;
        }

        .action-link-icon {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          font-size: 16px;
        }

        .action-blue {
          background: #e8f1ff;
        }

        .action-green {
          background: #e8f8ef;
        }

        .result-action-link > div:nth-child(2) {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .result-action-link strong {
          color: #172033;
          font-size: 12px;
        }

        .result-action-link small {
          color: #8993a5;
          font-size: 9px;
        }

        .result-action-link > span {
          color: #0b5ed7;
          font-size: 17px;
          font-weight: 800;
        }

        /* ================================================
           MOTIVATION
        ================================================= */

        .results-motivation {
          display: flex;
          align-items: center;
          gap: 17px;
          margin-top: 22px;
          padding: 22px 26px;
          background: #eef6ff;
          border: 1px solid #dbe8f8;
          border-radius: 17px;
        }

        .motivation-icon {
          width: 45px;
          height: 45px;
          flex: 0 0 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #0b5ed7;
          color: #ffffff;
          font-size: 21px;
        }

        .results-motivation strong {
          color: #0d3b70;
          font-size: 13px;
        }

        .results-motivation p {
          margin: 5px 0 0;
          color: #5e7189;
          font-size: 11px;
          line-height: 1.6;
        }

        /* ================================================
           NO RESULTS
        ================================================= */

        .no-results-card {
          max-width: 700px;
          margin: 30px auto;
          padding: 55px 30px;
          text-align: center;
          background: #ffffff;
          border: 1px solid #e5e9f0;
          border-radius: 18px;
          box-shadow:
            0 10px 30px
            rgba(23,32,51,.05);
        }

        .no-results-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 17px;
          background: #e8f1ff;
          font-size: 28px;
        }

        .no-results-card h2 {
          margin: 7px 0;
          color: #172033;
          font-size: 25px;
        }

        .no-results-card p {
          max-width: 500px;
          margin: 0 auto 22px;
          color: #718096;
          font-size: 13px;
          line-height: 1.7;
        }

        .no-results-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 45px;
          padding: 0 18px;
          border-radius: 9px;
          background: #0b5ed7;
          color: #ffffff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
        }

        /* ================================================
           LOADING
        ================================================= */

        .results-loading-card {
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: #ffffff;
          border: 1px solid #e5e9f0;
          border-radius: 17px;
          box-shadow:
            0 8px 24px
            rgba(23,32,51,.05);
        }

        .loading-spinner {
          width: 38px;
          height: 38px;
          margin-bottom: 18px;
          border: 4px solid #e4ecf7;
          border-top-color: #0b5ed7;
          border-radius: 50%;
          animation: resultsSpin .8s linear infinite;
        }

        @keyframes resultsSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .results-loading-card h2 {
          margin: 0 0 5px;
          color: #172033;
          font-size: 18px;
        }

        .results-loading-card p {
          margin: 0;
          color: #718096;
          font-size: 12px;
        }

        /* ================================================
           ERROR
        ================================================= */

        .results-message-card {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          padding: 22px;
          background: #ffffff;
          border: 1px solid #fed7aa;
          border-radius: 15px;
          box-shadow:
            0 8px 24px
            rgba(23,32,51,.04);
        }

        .message-icon {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #fff7ed;
          color: #c2410c;
          font-weight: 900;
        }

        .results-message-card h2 {
          margin: 0 0 5px;
          color: #172033;
          font-size: 16px;
        }

        .results-message-card p {
          margin: 0;
          color: #718096;
          font-size: 12px;
        }

        .retry-button {
          margin-top: 14px;
          min-height: 38px;
          padding: 0 14px;
          border: 0;
          border-radius: 8px;
          background: #0b5ed7;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        /* ================================================
           FOOTER
        ================================================= */

        .results-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 24px 32px;
          border-top: 1px solid #e2e7ee;
          background: #ffffff;
          color: #718096;
        }

        .results-footer > div {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .results-footer strong {
          color: #172033;
          font-size: 13px;
          letter-spacing: .5px;
        }

        .results-footer span {
          color: #0b5ed7;
          font-size: 10px;
          font-weight: 700;
        }

        .results-footer p {
          margin: 0;
          font-size: 10px;
        }

        /* ================================================
           HOVER
        ================================================= */

        .results-assessment-button,
        .results-home-button,
        .no-results-button {
          transition:
            transform .18s ease,
            box-shadow .18s ease;
        }

        .results-assessment-button:hover,
        .results-home-button:hover,
        .no-results-button:hover {
          transform: translateY(-2px);
        }

        /* ================================================
           TABLET
        ================================================= */

        @media (max-width: 1100px) {

          .results-summary {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .results-main-grid {
            grid-template-columns: 1fr;
          }

          .results-sidebar {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

        }

        /* ================================================
           MOBILE
        ================================================= */

        @media (max-width: 760px) {

          .results-header-inner {
            min-height: 72px;
            padding: 10px 16px;
          }

          .results-brand-logo {
            width: 48px;
            height: 48px;
          }

          .results-brand-name {
            font-size: 17px;
          }

          .results-brand-motto {
            font-size: 9px;
          }

          .results-header-actions {
            gap: 6px;
          }

          .results-home-button {
            display: none;
          }

          .results-assessment-button {
            min-height: 38px;
            padding: 0 11px;
            font-size: 10px;
          }

          .results-container {
            padding: 25px 16px 35px;
          }

          .results-page-intro {
            align-items: flex-start;
            flex-direction: column;
          }

          .results-page-intro h1 {
            font-size: 32px;
          }

          .results-intro-badge {
            width: 100%;
          }

          .results-summary {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 11px;
          }

          .summary-card {
            min-height: 98px;
            padding: 13px;
            gap: 9px;
          }

          .summary-icon {
            width: 39px;
            height: 39px;
            flex-basis: 39px;
            font-size: 16px;
          }

          .summary-card strong {
            font-size: 20px;
          }

          .summary-card small {
            font-size: 8px;
          }

          .results-panel {
            padding: 19px;
          }

          .results-panel-heading {
            flex-direction: column;
            gap: 10px;
          }

          .result-card {
            padding: 15px;
          }

          .result-card-top {
            grid-template-columns:
              32px minmax(0, 1fr);
          }

          .result-index {
            width: 30px;
            height: 30px;
          }

          .result-score-box {
            grid-column: 2;
            text-align: left;
            margin-top: -2px;
          }

          .result-score-box strong {
            display: inline;
            font-size: 25px;
          }

          .result-score-box span {
            display: inline;
            margin-left: 7px;
          }

          .result-bottom {
            flex-wrap: wrap;
            gap: 13px;
          }

          .view-result-button {
            width: 100%;
            margin-left: 0;
          }

          .results-sidebar {
            display: flex;
          }

          .results-motivation {
            align-items: flex-start;
            padding: 19px;
          }

          .results-footer {
            flex-direction: column;
            align-items: flex-start;
            padding: 22px 16px;
          }

        }

        /* ================================================
           SMALL MOBILE
        ================================================= */

        @media (max-width: 480px) {

          .results-summary {
            grid-template-columns: 1fr;
          }

          .results-page-intro h1 {
            font-size: 29px;
          }

          .result-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }

          .result-title-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .performance-badge {
            width: fit-content;
          }

        }

      `}</style>

    </main>
  )
}