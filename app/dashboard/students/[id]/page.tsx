'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Student = {
  id: string
  full_name: string | null
  email: string | null
  grade: number | null
  created_at: string | null
}

type AssignedAssessment = {
  id: string
  title: string
  subject: string
  grade: number
  assigned_at: string
}

type CompletedAssessment = {
  id: string
  title: string
  subject: string
  score: number
  letter: string
  submitted_at: string | null
}

type Performance = {
  assigned: number
  completed: number
  average_score: number
  highest_score: number
  lowest_score: number
  passed: number
  failed: number
  pass_rate: number
}

export default function StudentProfilePage() {
const params = useParams<{
  id?: string | string[]
}>()

const studentId = Array.isArray(params?.id)
  ? params.id[0]
  : params?.id || ''

  const [student, setStudent] =
    useState<Student | null>(null)

  const [assignedAssessments, setAssignedAssessments] =
    useState<AssignedAssessment[]>([])

  const [completedAssessments, setCompletedAssessments] =
    useState<CompletedAssessment[]>([])

  const [performance, setPerformance] =
    useState<Performance | null>(null)

  const [loading, setLoading] = useState(true)

  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadStudentProfile() {
      try {
        setLoading(true)
        setMessage('')

        const response = await fetch(
          `/api/students/${studentId}`,
          {
            cache: 'no-store',
          }
        )

        const data = await response.json()

        if (!response.ok) {
          setMessage(
            data.error ||
              'Unable to load student profile.'
          )
          return
        }

        setStudent(data.student || null)

        setAssignedAssessments(
          data.assignedAssessments || []
        )

        setCompletedAssessments(
          data.completedAssessments || []
        )

        setPerformance(data.performance || null)
      } catch (error) {
        console.error(
          'Student profile loading error:',
          error
        )

        setMessage(
          'Unable to connect to the server.'
        )
      } finally {
        setLoading(false)
      }
    }

    if (studentId) {
      loadStudentProfile()
    }
  }, [studentId])

  function getStudentInitials() {
    if (!student?.full_name) {
      return 'ST'
    }

    const names = student.full_name
      .trim()
      .split(/\s+/)

    if (names.length === 1) {
      return names[0]
        .substring(0, 2)
        .toUpperCase()
    }

    return (
      names[0][0] +
      names[names.length - 1][0]
    ).toUpperCase()
  }

  function getStudentName() {
    return (
      student?.full_name ||
      student?.email ||
      'Student'
    )
  }

  function formatDate(value: string | null) {
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

  function getPerformanceLabel(score: number) {
    if (score >= 80) {
      return 'Excellent Performance'
    }

    if (score >= 70) {
      return 'Very Good Performance'
    }

    if (score >= 60) {
      return 'Good Performance'
    }

    if (score >= 50) {
      return 'Satisfactory Performance'
    }

    return 'Needs Improvement'
  }

  function getScoreColor(score: number) {
    if (score >= 70) {
      return 'excellent'
    }

    if (score >= 50) {
      return 'good'
    }

    if (score >= 40) {
      return 'warning'
    }

    return 'failed'
  }

  function getLetterColor(letter: string) {
    switch (letter.toUpperCase()) {
      case 'A':
        return 'letter-a'
      case 'B':
        return 'letter-b'
      case 'C':
        return 'letter-c'
      case 'D':
        return 'letter-d'
      default:
        return 'letter-f'
    }
  }

  if (loading) {
    return (
      <>
        <style jsx global>{styles}</style>

        <main className="profile-page">
          <div className="loading-card">
            <div className="loading-spinner" />

            <h2>
              Loading Student Profile
            </h2>

            <p>
              Please wait while the student
              information is being loaded.
            </p>
          </div>
        </main>
      </>
    )
  }

  if (!student) {
    return (
      <>
        <style jsx global>{styles}</style>

        <main className="profile-page">
          <div className="error-card">
            <div className="error-icon">
              !
            </div>

            <h2>
              Unable to Load Student
            </h2>

            <p>
              {message ||
                'Student profile could not be found.'}
            </p>

            <Link
              href="/dashboard/students"
              className="primary-button"
            >
              â† Back to Students
            </Link>
          </div>
        </main>
      </>
    )
  }

  const averageScore =
    performance?.average_score || 0

  const passRate =
    performance?.pass_rate || 0

  return (
    <>
      <style jsx global>{styles}</style>

      <main className="profile-page">

        <div className="profile-container">

          {/* BREADCRUMB */}

          <div className="breadcrumb">
            <Link href="/dashboard">
              Dashboard
            </Link>

            <span>/</span>

            <Link href="/dashboard/students">
              Students
            </Link>

            <span>/</span>

            <strong>
              Student Profile
            </strong>
          </div>

          {/* TOP ACTIONS */}

          <div className="top-actions">

            <Link
              href="/dashboard/students"
              className="back-button"
            >
              â† Back to Students
            </Link>

            <Link
              href="/dashboard"
              className="dashboard-button"
            >
              Dashboard
            </Link>

          </div>

          {/* STUDENT HERO */}

          <section className="student-hero">

            <div className="hero-left">

              <div className="student-avatar">
                {getStudentInitials()}
              </div>

              <div className="student-information">

                <span className="hero-label">
                  STUDENT PERFORMANCE PROFILE
                </span>

                <h1>
                  {getStudentName()}
                </h1>

                <p>
                  Academic performance and
                  assessment history
                </p>

                <div className="student-meta">

                  <div className="meta-item">
                    <span className="meta-label">
                      EMAIL
                    </span>

                    <span className="meta-value">
                      {student.email ||
                        'Not available'}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">
                      GRADE
                    </span>

                    <span className="meta-value">
                      Grade {student.grade || 'N/A'}
                    </span>
                  </div>

                  <div className="meta-item">
                    <span className="meta-label">
                      REGISTERED
                    </span>

                    <span className="meta-value">
                      {formatDate(
                        student.created_at
                      )}
                    </span>
                  </div>

                </div>

              </div>

            </div>

            <div className="pass-rate">

              <span>
                OVERALL PASS RATE
              </span>

              <strong>
                {passRate}%
              </strong>

              <small>
                {performance?.passed || 0}{' '}
                passed
              </small>

            </div>

          </section>

          {/* PERFORMANCE TITLE */}

          <div className="section-heading">

            <div>
              <span className="section-kicker">
                ACADEMIC ANALYTICS
              </span>

              <h2>
                Performance Overview
              </h2>

              <p>
                A complete summary of this
                student's assessment performance.
              </p>
            </div>

            <div className="pass-badge">
              âœ“ {passRate}% Pass Rate
            </div>

          </div>

          {/* PERFORMANCE CARDS */}

          <section className="performance-grid">

            <div className="stat-card purple">
              <div className="stat-icon">
                A
              </div>

              <span>
                Assigned
              </span>

              <strong>
                {performance?.assigned || 0}
              </strong>

              <small>
                Assessments assigned
              </small>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">
                âœ“
              </div>

              <span>
                Completed
              </span>

              <strong>
                {performance?.completed || 0}
              </strong>

              <small>
                Assessments completed
              </small>
            </div>

            <div className="stat-card blue">
              <div className="stat-icon">
                %
              </div>

              <span>
                Average Score
              </span>

              <strong>
                {averageScore}%
              </strong>

              <small>
                Overall average
              </small>
            </div>

            <div className="stat-card gold">
              <div className="stat-icon">
                â†‘
              </div>

              <span>
                Highest Score
              </span>

              <strong>
                {performance?.highest_score || 0}%
              </strong>

              <small>
                Best performance
              </small>
            </div>

            <div className="stat-card red">
              <div className="stat-icon">
                â†“
              </div>

              <span>
                Lowest Score
              </span>

              <strong>
                {performance?.lowest_score || 0}%
              </strong>

              <small>
                Lowest performance
              </small>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">
                âœ“
              </div>

              <span>
                Passed
              </span>

              <strong>
                {performance?.passed || 0}
              </strong>

              <small>
                Assessments passed
              </small>
            </div>

            <div className="stat-card red">
              <div className="stat-icon">
                !
              </div>

              <span>
                Failed
              </span>

              <strong>
                {performance?.failed || 0}
              </strong>

              <small>
                Assessments failed
              </small>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">
                %
              </div>

              <span>
                Pass Rate
              </span>

              <strong>
                {passRate}%
              </strong>

              <small>
                Overall success rate
              </small>
            </div>

          </section>

          {/* PERFORMANCE SUMMARY */}

          <section className="summary-card">

            <div className="summary-header">

              <div>
                <span className="section-kicker">
                  PERFORMANCE ANALYSIS
                </span>

                <h2>
                  Performance Summary
                </h2>

                <p>
                  Overall academic performance
                  based on completed assessments.
                </p>
              </div>

              <div className="summary-score">
                {averageScore}%
              </div>

            </div>

            <div className="summary-status">
              {getPerformanceLabel(
                averageScore
              )}
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(
                    averageScore,
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="progress-labels">
              <span>0%</span>
              <span>50%</span>
              <span>70%</span>
              <span>100%</span>
            </div>

          </section>

          {/* ASSIGNED ASSESSMENTS */}

          <section className="content-card">

            <div className="content-header">

              <div>
                <span className="section-kicker">
                  CURRENT WORK
                </span>

                <h2>
                  Assigned Assessments
                </h2>

                <p>
                  Assessments currently assigned
                  to this student.
                </p>
              </div>

              <span className="count-badge">
                {assignedAssessments.length}{' '}
                assigned
              </span>

            </div>

            {assignedAssessments.length === 0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  A
                </div>

                <h3>
                  No assessments assigned
                </h3>

                <p>
                  Assessments assigned to this
                  student will appear here.
                </p>

              </div>

            ) : (

              <div className="table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>Assessment</th>
                      <th>Subject</th>
                      <th>Grade</th>
                      <th>Assigned</th>
                    </tr>
                  </thead>

                  <tbody>

                    {assignedAssessments.map(
                      assessment => (

                        <tr
                          key={assessment.id}
                        >

                          <td>
                            <strong>
                              {assessment.title}
                            </strong>
                          </td>

                          <td>
                            <span className="subject-badge">
                              {assessment.subject}
                            </span>
                          </td>

                          <td>
                            Grade {assessment.grade}
                          </td>

                          <td>
                            {formatDate(
                              assessment.assigned_at
                            )}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

          {/* ASSESSMENT HISTORY */}

          <section className="content-card">

            <div className="content-header">

              <div>
                <span className="section-kicker">
                  RESULTS
                </span>

                <h2>
                  Assessment History
                </h2>

                <p>
                  Detailed record of completed
                  assessments.
                </p>
              </div>

              <span className="count-badge">
                {completedAssessments.length}{' '}
                completed
              </span>

            </div>

            {completedAssessments.length === 0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  âœ“
                </div>

                <h3>
                  No completed assessments
                </h3>

                <p>
                  Completed assessment results
                  will appear here.
                </p>

              </div>

            ) : (

              <div className="table-wrapper">

                <table>

                  <thead>

                    <tr>
                      <th>Assessment</th>
                      <th>Subject</th>
                      <th>Score</th>
                      <th>Grade</th>
                      <th>Submitted</th>
                      <th>Action</th>
                    </tr>

                  </thead>

                  <tbody>

                    {completedAssessments.map(
                      assessment => (

                        <tr
                          key={assessment.id}
                        >

                          <td>
                            <strong>
                              {assessment.title}
                            </strong>
                          </td>

                          <td>
                            <span className="subject-badge">
                              {assessment.subject}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`score-badge ${getScoreColor(
                                assessment.score
                              )}`}
                            >
                              {assessment.score}%
                            </span>
                          </td>

                          <td>
                            <span
                              className={`letter-badge ${getLetterColor(
                                assessment.letter
                              )}`}
                            >
                              {assessment.letter}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              assessment.submitted_at
                            )}
                          </td>

                          <td>
                            <Link
                              href={`/dashboard/results/${assessment.id}`}
                              className="view-result"
                            >
                              View Result â†’
                            </Link>
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

          {/* FOOTER */}

          <footer className="profile-footer">
            <strong>
              JOECH TUTOR
            </strong>

            <span>
              Excellence Beyond Borders
            </span>
          </footer>

        </div>

      </main>
    </>
  )
}

const styles = `
  * {
    box-sizing: border-box;
  }

  .profile-page {
    min-height: 100vh;
    background: #f4f6fb;
    color: #172033;
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
    padding: 32px 24px 60px;
  }

  .profile-container {
    width: 100%;
    max-width: 1220px;
    margin: 0 auto;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 13px;
    color: #7a8295;
    margin-bottom: 18px;
  }

  .breadcrumb a {
    color: #5531a7;
    text-decoration: none;
    font-weight: 600;
  }

  .breadcrumb a:hover {
    text-decoration: underline;
  }

  .breadcrumb strong {
    color: #343b4d;
    font-weight: 700;
  }

  .top-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
  }

  .back-button,
  .dashboard-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    padding: 0 15px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    transition: .2s ease;
  }

  .back-button {
    color: #4b2a91;
    background: #eee9fb;
  }

  .back-button:hover {
    background: #e3dbf7;
  }

  .dashboard-button {
    color: white;
    background: #5427a5;
    box-shadow: 0 6px 15px rgba(84,39,165,.18);
  }

  .dashboard-button:hover {
    background: #45208c;
    transform: translateY(-1px);
  }

  .student-hero {
    min-height: 260px;
    border-radius: 20px;
    padding: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
    color: white;
    overflow: hidden;
    position: relative;
    background:
      radial-gradient(
        circle at 85% 20%,
        rgba(255,255,255,.15),
        transparent 28%
      ),
      linear-gradient(
        120deg,
        #28125d 0%,
        #4d2296 48%,
        #6b3cc2 100%
      );
    box-shadow: 0 14px 35px rgba(51,26,101,.18);
  }

  .student-hero::after {
    content: "";
    position: absolute;
    width: 250px;
    height: 250px;
    right: -90px;
    bottom: -130px;
    border-radius: 50%;
    background: rgba(255,255,255,.08);
  }

  .hero-left {
    display: flex;
    align-items: center;
    gap: 24px;
    position: relative;
    z-index: 2;
  }

  .student-avatar {
    width: 94px;
    height: 94px;
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: rgba(255,255,255,.15);
    border: 1px solid rgba(255,255,255,.28);
    font-size: 28px;
    font-weight: 900;
    box-shadow: inset 0 1px rgba(255,255,255,.18);
  }

  .student-information {
    min-width: 0;
  }

  .hero-label,
  .section-kicker {
    display: block;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .hero-label {
    color: rgba(255,255,255,.68);
    margin-bottom: 7px;
  }

  .student-information h1 {
    margin: 0;
    font-size: clamp(25px, 3vw, 38px);
    line-height: 1.1;
    font-weight: 850;
    letter-spacing: -.7px;
  }

  .student-information p {
    margin: 8px 0 18px;
    color: rgba(255,255,255,.76);
    font-size: 14px;
  }

  .student-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 18px 28px;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 120px;
  }

  .meta-label {
    color: rgba(255,255,255,.55);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .meta-value {
    color: white;
    font-size: 12px;
    font-weight: 650;
  }

  .pass-rate {
    min-width: 180px;
    padding: 22px;
    text-align: center;
    border-radius: 16px;
    background: rgba(255,255,255,.10);
    border: 1px solid rgba(255,255,255,.17);
    position: relative;
    z-index: 2;
  }

  .pass-rate span {
    display: block;
    font-size: 10px;
    letter-spacing: 1px;
    font-weight: 800;
    color: rgba(255,255,255,.62);
  }

  .pass-rate strong {
    display: block;
    margin: 5px 0 2px;
    font-size: 42px;
    line-height: 1;
  }

  .pass-rate small {
    color: rgba(255,255,255,.68);
    font-size: 11px;
  }

  .section-heading {
    margin: 32px 0 17px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
  }

  .section-kicker {
    color: #7652bd;
    margin-bottom: 6px;
  }

  .section-heading h2,
  .content-header h2,
  .summary-header h2 {
    margin: 0;
    color: #20263a;
    font-size: 21px;
    font-weight: 850;
    letter-spacing: -.3px;
  }

  .section-heading p,
  .content-header p,
  .summary-header p {
    margin: 5px 0 0;
    color: #7b8395;
    font-size: 12px;
  }

  .pass-badge {
    padding: 8px 13px;
    border-radius: 999px;
    color: #28734b;
    background: #e8f7ee;
    border: 1px solid #ccebd9;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
  }

  .performance-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .stat-card {
    min-height: 145px;
    padding: 18px;
    background: white;
    border: 1px solid #e6e8ef;
    border-radius: 15px;
    box-shadow: 0 5px 17px rgba(29,36,55,.045);
    position: relative;
    overflow: hidden;
  }

  .stat-card::after {
    content: "";
    position: absolute;
    right: -20px;
    bottom: -30px;
    width: 85px;
    height: 85px;
    border-radius: 50%;
    opacity: .65;
  }

  .stat-card.purple::after {
    background: #eee7fc;
  }

  .stat-card.green::after {
    background: #e4f7eb;
  }

  .stat-card.blue::after {
    background: #e6efff;
  }

  .stat-card.gold::after {
    background: #fff3d6;
  }

  .stat-card.red::after {
    background: #fde8e8;
  }

  .stat-icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 13px;
    font-size: 12px;
    font-weight: 900;
  }

  .purple .stat-icon {
    background: #eee7fc;
    color: #6336ad;
  }

  .green .stat-icon {
    background: #e3f7eb;
    color: #21824b;
  }

  .blue .stat-icon {
    background: #e7efff;
    color: #3569bd;
  }

  .gold .stat-icon {
    background: #fff1d2;
    color: #a86d00;
  }

  .red .stat-icon {
    background: #fde8e8;
    color: #b93838;
  }

  .stat-card > span {
    display: block;
    color: #737b8e;
    font-size: 11px;
    font-weight: 700;
  }

  .stat-card strong {
    display: block;
    margin: 3px 0;
    color: #1d2437;
    font-size: 28px;
    line-height: 1;
    font-weight: 850;
  }

  .stat-card small {
    color: #9aa1b0;
    font-size: 10px;
  }

  .summary-card,
  .content-card {
    margin-top: 18px;
    background: white;
    border: 1px solid #e5e8ef;
    border-radius: 17px;
    box-shadow: 0 5px 20px rgba(29,36,55,.045);
  }

  .summary-card {
    padding: 25px;
  }

  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
  }

  .summary-score {
    font-size: 30px;
    font-weight: 900;
    color: #4f2995;
  }

  .summary-status {
    margin: 22px 0 10px;
    color: #237247;
    font-size: 13px;
    font-weight: 800;
  }

  .progress-track {
    height: 10px;
    width: 100%;
    overflow: hidden;
    border-radius: 999px;
    background: #eceef4;
  }

  .progress-fill {
    height: 100%;
    border-radius: inherit;
    background:
      linear-gradient(
        90deg,
        #6336b1,
        #8a5bd1
      );
    transition: width .5s ease;
  }

  .progress-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    color: #9299a8;
    font-size: 10px;
    font-weight: 700;
  }

  .content-card {
    padding: 0;
    overflow: hidden;
  }

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding: 23px 25px;
    border-bottom: 1px solid #edf0f5;
  }

  .count-badge {
    flex-shrink: 0;
    padding: 7px 11px;
    border-radius: 999px;
    background: #f0eafb;
    color: #59309f;
    font-size: 10px;
    font-weight: 900;
  }

  .table-wrapper {
    width: 100%;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 700px;
  }

  th {
    padding: 13px 25px;
    text-align: left;
    background: #fafbfc;
    color: #737b8e;
    border-bottom: 1px solid #e9ecf1;
    font-size: 10px;
    font-weight: 850;
    letter-spacing: .5px;
    text-transform: uppercase;
  }

  td {
    padding: 16px 25px;
    border-bottom: 1px solid #f0f2f6;
    color: #5d6576;
    font-size: 12px;
  }

  tbody tr:hover {
    background: #faf9fe;
  }

  td strong {
    color: #252b3d;
    font-size: 12px;
  }

  .subject-badge {
    display: inline-flex;
    padding: 5px 9px;
    border-radius: 6px;
    background: #edf3ff;
    color: #3563a9;
    font-size: 10px;
    font-weight: 800;
  }

  .score-badge,
  .letter-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
  }

  .score-badge {
    min-width: 58px;
    padding: 6px 9px;
    border-radius: 7px;
    font-size: 11px;
  }

  .score-badge.excellent {
    background: #e5f7ec;
    color: #19723f;
  }

  .score-badge.good {
    background: #edf4ff;
    color: #2f63aa;
  }

  .score-badge.warning {
    background: #fff3dc;
    color: #a16b00;
  }

  .score-badge.failed {
    background: #fde9e9;
    color: #b23535;
  }

  .letter-badge {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    font-size: 11px;
  }

  .letter-a {
    background: #e4f7eb;
    color: #187340;
  }

  .letter-b {
    background: #e9f1ff;
    color: #315e9c;
  }

  .letter-c {
    background: #fff2d8;
    color: #9b6800;
  }

  .letter-d,
  .letter-f {
    background: #fde9e9;
    color: #b23535;
  }

  .view-result {
    color: #5a2fa5;
    text-decoration: none;
    font-size: 11px;
    font-weight: 850;
    white-space: nowrap;
  }

  .view-result:hover {
    text-decoration: underline;
  }

  .empty-state {
    padding: 55px 25px;
    text-align: center;
  }

  .empty-icon {
    width: 52px;
    height: 52px;
    margin: 0 auto 14px;
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0eafb;
    color: #6034a7;
    font-size: 17px;
    font-weight: 900;
  }

  .empty-state h3 {
    margin: 0;
    color: #343b4d;
    font-size: 14px;
    font-weight: 850;
  }

  .empty-state p {
    margin: 7px 0 0;
    color: #9299a8;
    font-size: 11px;
  }

  .profile-footer {
    padding: 30px 5px 0;
    text-align: center;
    color: #9299a8;
    font-size: 11px;
  }

  .profile-footer strong {
    color: #56309b;
  }

  .profile-footer span {
    margin-left: 5px;
  }

  .loading-card,
  .error-card {
    width: min(500px, calc(100% - 40px));
    margin: 100px auto;
    padding: 45px 30px;
    text-align: center;
    background: white;
    border: 1px solid #e5e8ef;
    border-radius: 18px;
    box-shadow: 0 10px 30px rgba(30,35,55,.08);
  }

  .loading-spinner {
    width: 42px;
    height: 42px;
    margin: 0 auto 20px;
    border: 4px solid #ece7f8;
    border-top-color: #5a2fa5;
    border-radius: 50%;
    animation: joech-spin .8s linear infinite;
  }

  @keyframes joech-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-card h2,
  .error-card h2 {
    margin: 0;
    color: #272d40;
    font-size: 20px;
  }

  .loading-card p,
  .error-card p {
    margin: 8px 0 22px;
    color: #858d9e;
    font-size: 13px;
  }

  .error-icon {
    width: 50px;
    height: 50px;
    margin: 0 auto 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fde9e9;
    color: #b23535;
    font-size: 20px;
    font-weight: 900;
  }

  .primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0 17px;
    border-radius: 9px;
    color: white;
    background: #5427a5;
    text-decoration: none;
    font-size: 12px;
    font-weight: 800;
  }

  @media (max-width: 1000px) {
    .performance-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .student-hero {
      align-items: flex-start;
      flex-direction: column;
    }

    .pass-rate {
      width: 100%;
      text-align: left;
    }

    .pass-rate strong {
      display: inline;
      margin-right: 8px;
    }
  }

  @media (max-width: 650px) {
    .profile-page {
      padding: 18px 12px 40px;
    }

    .student-hero {
      padding: 22px;
      border-radius: 16px;
    }

    .hero-left {
      align-items: flex-start;
      flex-direction: column;
      gap: 16px;
    }

    .student-avatar {
      width: 70px;
      height: 70px;
      border-radius: 18px;
    }

    .student-meta {
      flex-direction: column;
      gap: 10px;
    }

    .performance-grid {
      grid-template-columns: 1fr 1fr;
      gap: 9px;
    }

    .stat-card {
      min-height: 130px;
      padding: 14px;
    }

    .stat-card strong {
      font-size: 24px;
    }

    .section-heading,
    .content-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .summary-card {
      padding: 19px;
    }

    .top-actions {
      gap: 8px;
    }

    .back-button,
    .dashboard-button {
      flex: 1;
      font-size: 11px;
    }

    .content-header {
      padding: 19px;
    }
  }
`
