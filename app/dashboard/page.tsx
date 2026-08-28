import Image from 'next/image'
import Link from 'next/link'
import LogoutButton from './LogoutButton'
import { supabaseServer } from '../../lib/supabase-server'

export default async function Dashboard() {
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const role = profile?.role || 'student'
  const displayName = profile?.full_name || user.email || 'Student'

  /* =========================================================
     STUDENT DASHBOARD
     ========================================================= */

  if (role === 'student') {
    const { count: completedAssessments } = await supabase
      .from('attempts')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('user_id', user.id)

    const { count: assignedAssessments } = await supabase
      .from('assessment_assignments')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('student_id', user.id)

    const { data: recentAttempts } = await supabase
      .from('attempts')
      .select('id, score, letter, submitted_at, assessment_id')
      .eq('user_id', user.id)
      .order('submitted_at', {
        ascending: false,
      })
      .limit(5)

    const scores =
      recentAttempts
        ?.map((attempt) => Number(attempt.score))
        .filter((score) => !Number.isNaN(score)) || []

    const averageScore =
      scores.length > 0
        ? Math.round(
            scores.reduce(
              (total, score) => total + score,
              0
            ) / scores.length
          )
        : 0

    const firstLetter = displayName
      .toString()
      .charAt(0)
      .toUpperCase()

    return (
      <main className="student-dashboard-page">
        <header className="student-header">
          <div className="student-header-inner">
            <Link href="/dashboard" className="student-brand">
              <Image
                src="/joech-logo.jpg"
                alt="JOECH TUTOR"
                width={64}
                height={64}
                priority
                className="student-brand-logo"
              />

              <div className="student-brand-text">
                <div className="student-brand-name">
                  JOECH TUTOR
                </div>

                <div className="student-brand-motto">
                  Excellence Beyond Borders
                </div>
              </div>
            </Link>

            <div className="student-user-area">
              <div className="student-user-avatar">
                {firstLetter}
              </div>

              <div className="student-user-details">
                <strong>{displayName}</strong>
                <span>Student Portal</span>
              </div>
            </div>
          </div>
        </header>

        <div className="student-container">
          {/* =====================================================
              HERO
              ===================================================== */}

          <section className="student-hero">
            <div className="student-hero-content">
              <div className="student-hero-label">
                STUDENT LEARNING PORTAL
              </div>

              <h1>
                Welcome back,
                <br />
                <span>{displayName}</span>
              </h1>

              <p>
                Continue your learning journey, attend live
                classes, complete your assessments and monitor
                your academic progress.
              </p>

              <div className="student-hero-actions">
                <Link
                  href="/dashboard/student/assessments"
                  className="student-primary-button"
                >
                  <span>▶</span>
                  Start an Assessment
                </Link>

                <Link
                  href="/dashboard/student/live-class"
                  className="student-live-button"
                >
                  <span>🎥</span>
                  Join Live Class
                </Link>

                <Link
                  href="/dashboard/student/results"
                  className="student-secondary-button"
                >
                  View My Results
                  <span>→</span>
                </Link>
              </div>
            </div>

            <div className="student-hero-visual">
              <div className="hero-circle hero-circle-one" />
              <div className="hero-circle hero-circle-two" />

              <div className="hero-book">
                <div className="hero-book-top">
                  LEARN
                </div>

                <div className="hero-book-title">
                  JOECH
                </div>

                <div className="hero-book-subtitle">
                  TUTOR
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              STATISTICS
              ===================================================== */}

          <section className="student-statistics">
            <div className="student-stat-card">
              <div className="stat-icon stat-blue">
                ◫
              </div>

              <div className="stat-content">
                <span className="stat-label">
                  ASSIGNED
                </span>

                <strong>
                  {assignedAssessments ?? 0}
                </strong>

                <small>
                  Assessments waiting
                </small>
              </div>
            </div>

            <div className="student-stat-card">
              <div className="stat-icon stat-green">
                ✓
              </div>

              <div className="stat-content">
                <span className="stat-label">
                  COMPLETED
                </span>

                <strong>
                  {completedAssessments ?? 0}
                </strong>

                <small>
                  Assessments completed
                </small>
              </div>
            </div>

            <div className="student-stat-card">
              <div className="stat-icon stat-gold">
                ★
              </div>

              <div className="stat-content">
                <span className="stat-label">
                  AVERAGE SCORE
                </span>

                <strong>
                  {averageScore}%
                </strong>

                <small>
                  Recent performance
                </small>
              </div>
            </div>

            <div className="student-stat-card">
              <div className="stat-icon stat-purple">
                ◆
              </div>

              <div className="stat-content">
                <span className="stat-label">
                  TARGET
                </span>

                <strong>
                  70%+
                </strong>

                <small>
                  Keep aiming higher
                </small>
              </div>
            </div>
          </section>

          {/* =====================================================
              LIVE CLASS FEATURE
              ===================================================== */}

          <section className="student-live-class-feature">
            <div className="student-live-main">
              <div className="student-live-badge">
                <span className="student-live-dot" />
                LIVE LEARNING
              </div>

              <h2>
                Join Your Live Classroom
              </h2>

              <p>
                Attend interactive lessons with your teacher,
                enter your class code and learn in real time
                through the JOECH TUTOR virtual classroom.
              </p>

              <div className="student-live-actions">
                <Link
                  href="/dashboard/student/live-class"
                  className="student-live-primary"
                >
                  🎥 Join Live Class
                  <span>→</span>
                </Link>

                <Link
                  href="/dashboard/student/live-class"
                  className="student-live-secondary"
                >
                  Enter Class Code
                </Link>
              </div>
            </div>

            <div className="student-live-visual">
              <div className="student-live-circle student-live-circle-one" />
              <div className="student-live-circle student-live-circle-two" />

              <div className="student-camera">
                <div className="camera-screen">
                  <div className="camera-person">
                    👨‍🏫
                  </div>

                  <div className="camera-live-label">
                    <span />
                    LIVE
                  </div>
                </div>

                <div className="camera-base" />
              </div>
            </div>
          </section>

          {/* =====================================================
              MAIN GRID
              ===================================================== */}

          <div className="student-main-grid">
            <div className="student-left-column">

              {/* =================================================
                  MY LEARNING
                  ================================================= */}

              <section className="student-panel">
                <div className="panel-heading">
                  <span className="panel-kicker">
                    LEARNING
                  </span>

                  <h2>My Learning</h2>

                  <p>
                    Access your live classes, assessments and
                    academic progress.
                  </p>
                </div>

                <div className="learning-options">

                  <Link
                    href="/dashboard/student/live-class"
                    className="learning-option learning-live-option"
                  >
                    <div className="learning-option-icon learning-live">
                      🎥
                    </div>

                    <div className="learning-option-content">
                      <div className="learning-live-status">
                        <span />
                        LIVE CLASSROOM
                      </div>

                      <h3>
                        Live Classes
                      </h3>

                      <p>
                        Join your teacher for interactive
                        online lessons.
                      </p>
                    </div>

                    <span className="learning-arrow">
                      →
                    </span>
                  </Link>

                  <Link
                    href="/dashboard/student/assessments"
                    className="learning-option"
                  >
                    <div className="learning-option-icon learning-blue">
                      📝
                    </div>

                    <div className="learning-option-content">
                      <h3>
                        My Assessments
                      </h3>

                      <p>
                        View and complete your assigned
                        assessments.
                      </p>
                    </div>

                    <span className="learning-arrow">
                      →
                    </span>
                  </Link>

                  <Link
                    href="/dashboard/student/results"
                    className="learning-option"
                  >
                    <div className="learning-option-icon learning-green">
                      📊
                    </div>

                    <div className="learning-option-content">
                      <h3>
                        My Results
                      </h3>

                      <p>
                        Review your scores and assessment
                        performance.
                      </p>
                    </div>

                    <span className="learning-arrow">
                      →
                    </span>
                  </Link>
                </div>
              </section>

              {/* =================================================
                  RECENT PERFORMANCE
                  ================================================= */}

              <section className="student-panel">
                <div className="panel-heading panel-heading-row">
                  <div>
                    <span className="panel-kicker">
                      PERFORMANCE
                    </span>

                    <h2>
                      Recent Performance
                    </h2>

                    <p>
                      Your latest assessment activity.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/student/results"
                    className="view-all-link"
                  >
                    View All →
                  </Link>
                </div>

                {recentAttempts &&
                recentAttempts.length > 0 ? (
                  <div className="recent-results">
                    {recentAttempts.map(
                      (attempt, index) => {
                        const score = Number(
                          attempt.score
                        )

                        const scoreClass =
                          score >= 70
                            ? 'score-excellent'
                            : score >= 50
                              ? 'score-average'
                              : 'score-low'

                        return (
                          <div
                            key={attempt.id}
                            className="recent-result-row"
                          >
                            <div className="result-number">
                              {String(index + 1).padStart(
                                2,
                                '0'
                              )}
                            </div>

                            <div className="result-details">
                              <strong>
                                Assessment
                              </strong>

                              <span>
                                {attempt.submitted_at
                                  ? new Date(
                                      attempt.submitted_at
                                    ).toLocaleDateString(
                                      'en-GB',
                                      {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      }
                                    )
                                  : 'Recently completed'}
                              </span>
                            </div>

                            <div
                              className={`result-score ${scoreClass}`}
                            >
                              {score}%
                            </div>

                            <div className="result-grade">
                              {attempt.letter || '-'}
                            </div>
                          </div>
                        )
                      }
                    )}
                  </div>
                ) : (
                  <div className="student-empty-state">
                    <div className="empty-icon">
                      📚
                    </div>

                    <h3>
                      No completed assessments yet
                    </h3>

                    <p>
                      Complete your first assessment to
                      start building your performance history.
                    </p>

                    <Link
                      href="/dashboard/student/assessments"
                      className="student-primary-button"
                    >
                      View Assessments
                    </Link>
                  </div>
                )}
              </section>
            </div>

            {/* =====================================================
                RIGHT COLUMN
                ===================================================== */}

            <aside className="student-right-column">

              {/* PROGRESS */}

              <section className="progress-card">
                <div className="progress-card-header">
                  <div>
                    <span>
                      YOUR PROGRESS
                    </span>

                    <h2>
                      Keep Growing
                    </h2>
                  </div>

                  <div className="progress-star">
                    ★
                  </div>
                </div>

                <div
                  className="progress-ring"
                  style={{
                    background: `conic-gradient(#ffffff ${averageScore}%, rgba(255,255,255,.18) ${averageScore}% 100%)`,
                  }}
                >
                  <div className="progress-ring-inner">
                    <strong>
                      {averageScore}%
                    </strong>

                    <span>
                      Average
                    </span>
                  </div>
                </div>

                <p className="progress-message">
                  {averageScore >= 70
                    ? 'Excellent work! Keep maintaining your strong performance.'
                    : averageScore >= 50
                      ? 'Good progress! Keep practising to reach the next level.'
                      : 'Every assessment is an opportunity to improve. Keep going!'}
                </p>

                <Link
                  href="/dashboard/student/results"
                  className="progress-button"
                >
                  View Performance
                  <span>→</span>
                </Link>
              </section>

              {/* QUICK ACCESS */}

              <section className="quick-access-card">
                <div className="quick-access-heading">
                  <div>
                    <span>
                      SHORTCUTS
                    </span>

                    <h2>
                      Quick Access
                    </h2>
                  </div>

                  <div className="quick-access-icon">
                    ⚡
                  </div>
                </div>

                <Link
                  href="/dashboard/student/live-class"
                  className="quick-access-link quick-live-link"
                >
                  <div className="quick-link-icon quick-live">
                    🎥
                  </div>

                  <div className="quick-link-text">
                    <strong>
                      Live Classes
                    </strong>

                    <small>
                      Join your virtual classroom
                    </small>
                  </div>

                  <span>
                    →
                  </span>
                </Link>

                <Link
                  href="/dashboard/student/assessments"
                  className="quick-access-link"
                >
                  <div className="quick-link-icon quick-blue">
                    📝
                  </div>

                  <div className="quick-link-text">
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
                  href="/dashboard/student/results"
                  className="quick-access-link"
                >
                  <div className="quick-link-icon quick-green">
                    📊
                  </div>

                  <div className="quick-link-text">
                    <strong>
                      Results
                    </strong>

                    <small>
                      Check your scores
                    </small>
                  </div>

                  <span>
                    →
                  </span>
                </Link>
              </section>
            </aside>
          </div>

          {/* =====================================================
              MOTIVATION
              ===================================================== */}

          <section className="student-motivation">
            <div className="motivation-mark">
              ✦
            </div>

            <div>
              <strong>
                Excellence Beyond Borders
              </strong>

              <p>
                Every live lesson, question you answer and
                assessment you complete is another step toward
                becoming a better learner. Stay focused, keep
                practising and believe in your ability to succeed.
              </p>
            </div>
          </section>

          <div className="student-logout">
            <LogoutButton />
          </div>
        </div>

        <footer className="student-footer">
          <div>
            <strong>
              JOECH TUTOR
            </strong>

            <span>
              Excellence Beyond Borders
            </span>
          </div>

          <p>
            Mathematics &amp; English Assessment Platform
          </p>
        </footer>

        <style>{`
          * {
            box-sizing: border-box;
          }

          .student-dashboard-page {
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

          /* =====================================================
             HEADER
             ===================================================== */

          .student-header {
            position: sticky;
            top: 0;
            z-index: 20;
            background: #fff;
            border-bottom: 1px solid #e5e9f0;
          }

          .student-header-inner {
            max-width: 1380px;
            min-height: 84px;
            margin: 0 auto;
            padding: 12px 32px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
          }

          .student-brand {
            display: flex;
            align-items: center;
            gap: 14px;
            text-decoration: none;
            color: inherit;
          }

          .student-brand-logo {
            width: 58px;
            height: 58px;
            object-fit: cover;
            border-radius: 10px;
          }

          .student-brand-name {
            font-size: 21px;
            font-weight: 800;
            color: #0d2340;
          }

          .student-brand-motto {
            margin-top: 2px;
            font-size: 11px;
            font-weight: 600;
            color: #0b5ed7;
          }

          .student-user-area {
            display: flex;
            align-items: center;
            gap: 11px;
          }

          .student-user-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: #0b5ed7;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
          }

          .student-user-details {
            display: flex;
            flex-direction: column;
            gap: 2px;
            text-align: right;
          }

          .student-user-details strong {
            font-size: 14px;
          }

          .student-user-details span {
            font-size: 11px;
            color: #718096;
          }

          .student-container {
            max-width: 1380px;
            margin: 0 auto;
            padding: 32px;
          }

          /* =====================================================
             HERO
             ===================================================== */

          .student-hero {
            position: relative;
            min-height: 310px;
            overflow: hidden;
            display: flex;
            justify-content: space-between;
            padding: 42px 48px;
            border-radius: 20px;
            background:
              linear-gradient(
                120deg,
                #082b59 0%,
                #0b5ed7 62%,
                #1677e8 100%
              );
            color: white;
            box-shadow: 0 18px 45px rgba(8,43,89,.16);
          }

          .student-hero-content {
            position: relative;
            z-index: 3;
            max-width: 760px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .student-hero-label {
            width: fit-content;
            margin-bottom: 14px;
            padding: 7px 12px;
            border: 1px solid rgba(255,255,255,.28);
            border-radius: 999px;
            background: rgba(255,255,255,.1);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.2px;
          }

          .student-hero h1 {
            margin: 0;
            font-size: clamp(34px,4vw,52px);
            line-height: 1.08;
          }

          .student-hero h1 span {
            color: #d9ecff;
          }

          .student-hero p {
            max-width: 700px;
            margin: 18px 0 0;
            color: rgba(255,255,255,.86);
            font-size: 16px;
            line-height: 1.7;
          }

          .student-hero-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 28px;
          }

          .student-primary-button,
          .student-secondary-button,
          .student-live-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            min-height: 46px;
            padding: 0 18px;
            border-radius: 10px;
            text-decoration: none;
            font-size: 13px;
            font-weight: 800;
          }

          .student-primary-button {
            background: white;
            color: #0b5ed7;
          }

          .student-secondary-button {
            border: 1px solid rgba(255,255,255,.32);
            background: rgba(255,255,255,.1);
            color: white;
          }

          .student-live-button {
            background: #0bbf73;
            color: white;
            box-shadow: 0 8px 20px rgba(0,0,0,.15);
          }

          .student-hero-visual {
            position: relative;
            width: 300px;
            min-width: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .hero-circle {
            position: absolute;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,.16);
            background: rgba(255,255,255,.06);
          }

          .hero-circle-one {
            width: 270px;
            height: 270px;
          }

          .hero-circle-two {
            width: 190px;
            height: 190px;
          }

          .hero-book {
            position: relative;
            z-index: 2;
            width: 150px;
            min-height: 190px;
            padding: 24px 18px;
            border-radius: 8px 14px 14px 8px;
            background: white;
            color: #0d2340;
            box-shadow: 18px 20px 35px rgba(0,0,0,.22);
            transform: rotate(4deg);
          }

          .hero-book-top {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 2px;
            color: #0b5ed7;
          }

          .hero-book-title {
            margin-top: 35px;
            font-size: 30px;
            font-weight: 900;
          }

          .hero-book-subtitle {
            margin-top: 7px;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 3px;
          }

          /* =====================================================
             STATISTICS
             ===================================================== */

          .student-statistics {
            display: grid;
            grid-template-columns: repeat(4,1fr);
            gap: 18px;
            margin-top: 22px;
          }

          .student-stat-card {
            display: flex;
            align-items: center;
            gap: 15px;
            min-height: 118px;
            padding: 20px;
            background: white;
            border: 1px solid #e6eaf0;
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(23,32,51,.05);
          }

          .stat-icon {
            width: 48px;
            height: 48px;
            flex: 0 0 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 13px;
            font-size: 20px;
            font-weight: 800;
          }

          .stat-blue {
            background: #e8f1ff;
            color: #0b5ed7;
          }

          .stat-green {
            background: #e8f8ef;
            color: #159957;
          }

          .stat-gold {
            background: #fff5d9;
            color: #c88a00;
          }

          .stat-purple {
            background: #f0eaff;
            color: #7048c8;
          }

          .stat-label {
            display: block;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .8px;
            color: #718096;
          }

          .stat-content strong {
            display: block;
            margin-top: 3px;
            font-size: 25px;
          }

          .stat-content small {
            display: block;
            margin-top: 4px;
            color: #8993a5;
            font-size: 11px;
          }

          /* =====================================================
             STUDENT LIVE CLASS FEATURE
             ===================================================== */

          .student-live-class-feature {
            position: relative;
            overflow: hidden;
            display: grid;
            grid-template-columns: minmax(0,1fr) 330px;
            min-height: 245px;
            margin-top: 22px;
            border-radius: 18px;
            border: 1px solid #d5eee2;
            background: white;
            box-shadow: 0 10px 30px rgba(23,32,51,.06);
          }

          .student-live-main {
            position: relative;
            z-index: 2;
            padding: 30px 34px;
            background:
              linear-gradient(
                135deg,
                #effff7 0%,
                #f7fffb 60%,
                #ffffff 100%
              );
          }

          .student-live-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 7px 11px;
            border-radius: 999px;
            background: #dff8eb;
            color: #07844d;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 1px;
          }

          .student-live-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #16b86a;
            box-shadow:
              0 0 0 4px rgba(22,184,106,.13);
          }

          .student-live-main h2 {
            margin: 14px 0 7px;
            color: #0b3b2a;
            font-size: 28px;
            line-height: 1.15;
          }

          .student-live-main p {
            max-width: 690px;
            margin: 0;
            color: #60756c;
            font-size: 13px;
            line-height: 1.7;
          }

          .student-live-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 20px;
          }

          .student-live-primary,
          .student-live-secondary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 41px;
            padding: 0 16px;
            border-radius: 9px;
            text-decoration: none;
            font-size: 11px;
            font-weight: 900;
          }

          .student-live-primary {
            background: #0b9b62;
            color: white;
            box-shadow: 0 8px 20px rgba(11,155,98,.18);
          }

          .student-live-secondary {
            border: 1px solid #cfe6db;
            background: white;
            color: #087c50;
          }

          .student-live-visual {
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              linear-gradient(
                145deg,
                #062b59 0%,
                #0b5ed7 100%
              );
          }

          .student-live-circle {
            position: absolute;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,.13);
          }

          .student-live-circle-one {
            width: 240px;
            height: 240px;
          }

          .student-live-circle-two {
            width: 170px;
            height: 170px;
          }

          .student-camera {
            position: relative;
            z-index: 2;
            width: 175px;
          }

          .camera-screen {
            position: relative;
            width: 175px;
            height: 120px;
            overflow: hidden;
            border: 5px solid rgba(255,255,255,.9);
            border-radius: 12px;
            background:
              linear-gradient(
                135deg,
                rgba(255,255,255,.18),
                rgba(255,255,255,.06)
              );
            box-shadow:
              0 18px 35px rgba(0,0,0,.22);
          }

          .camera-person {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
          }

          .camera-live-label {
            position: absolute;
            top: 8px;
            right: 8px;
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 4px 7px;
            border-radius: 5px;
            background: rgba(0,0,0,.48);
            color: white;
            font-size: 7px;
            font-weight: 900;
          }

          .camera-live-label span {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #39e58c;
          }

          .camera-base {
            width: 75px;
            height: 7px;
            margin: 8px auto 0;
            border-radius: 999px;
            background: rgba(255,255,255,.8);
          }

          /* =====================================================
             MAIN GRID
             ===================================================== */

          .student-main-grid {
            display: grid;
            grid-template-columns: minmax(0,1fr) 350px;
            gap: 22px;
            margin-top: 22px;
          }

          .student-left-column,
          .student-right-column {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 22px;
          }

          .student-panel,
          .progress-card,
          .quick-access-card {
            background: white;
            border: 1px solid #e6eaf0;
            border-radius: 17px;
            box-shadow: 0 8px 24px rgba(23,32,51,.05);
          }

          .student-panel {
            padding: 27px;
          }

          .panel-heading {
            margin-bottom: 22px;
          }

          .panel-heading-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
          }

          .panel-kicker {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1px;
            color: #0b5ed7;
          }

          .panel-heading h2 {
            margin: 5px 0 4px;
            font-size: 24px;
          }

          .panel-heading p {
            margin: 0;
            color: #718096;
            font-size: 13px;
            line-height: 1.6;
          }

          .view-all-link {
            color: #0b5ed7;
            text-decoration: none;
            font-size: 12px;
            font-weight: 800;
          }

          /* =====================================================
             LEARNING OPTIONS
             ===================================================== */

          .learning-options {
            display: grid;
            grid-template-columns: repeat(3,1fr);
            gap: 14px;
          }

          .learning-option {
            position: relative;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
            padding: 16px;
            border: 1px solid #e7ebf1;
            border-radius: 13px;
            text-decoration: none;
            color: inherit;
            transition:
              transform .18s ease,
              border-color .18s ease,
              box-shadow .18s ease;
          }

          .learning-option:hover {
            transform: translateY(-2px);
            border-color: #cdd9e8;
            box-shadow: 0 10px 22px rgba(23,32,51,.07);
          }

          .learning-live-option {
            border-color: #cfe8dc;
            background: #f7fffb;
          }

          .learning-option-icon {
            width: 46px;
            height: 46px;
            flex: 0 0 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            font-size: 20px;
          }

          .learning-blue {
            background: #e8f1ff;
          }

          .learning-green {
            background: #e8f8ef;
          }

          .learning-live {
            background: #dcf8e9;
          }

          .learning-option-content {
            min-width: 0;
            flex: 1;
          }

          .learning-option-content h3 {
            margin: 0 0 4px;
            font-size: 14px;
          }

          .learning-option-content p {
            margin: 0;
            color: #718096;
            font-size: 11px;
            line-height: 1.5;
          }

          .learning-live-status {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-bottom: 4px;
            color: #07844d;
            font-size: 7px;
            font-weight: 900;
            letter-spacing: .7px;
          }

          .learning-live-status span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #16b86a;
          }

          .learning-arrow {
            color: #0b5ed7;
            font-size: 18px;
          }

          /* =====================================================
             RECENT RESULTS
             ===================================================== */

          .recent-results {
            display: flex;
            flex-direction: column;
          }

          .recent-result-row {
            display: grid;
            grid-template-columns: 42px minmax(0,1fr) 70px 45px;
            align-items: center;
            gap: 12px;
            padding: 15px 0;
            border-bottom: 1px solid #edf0f4;
          }

          .result-number {
            font-size: 11px;
            font-weight: 800;
            color: #9aa4b5;
          }

          .result-details {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .result-details strong {
            font-size: 13px;
          }

          .result-details span {
            font-size: 11px;
            color: #8993a5;
          }

          .result-score {
            justify-self: end;
            font-size: 14px;
            font-weight: 900;
          }

          .score-excellent {
            color: #159957;
          }

          .score-average {
            color: #c88a00;
          }

          .score-low {
            color: #d64545;
          }

          .result-grade {
            justify-self: end;
            padding: 5px 7px;
            border-radius: 7px;
            background: #f1f4f8;
            font-size: 11px;
            font-weight: 800;
          }

          .student-empty-state {
            padding: 35px 20px;
            text-align: center;
            border: 1px dashed #d8dee8;
            border-radius: 13px;
            background: #fafbfd;
          }

          .empty-icon {
            font-size: 35px;
          }

          .student-empty-state h3 {
            margin: 12px 0 6px;
            font-size: 16px;
          }

          .student-empty-state p {
            max-width: 430px;
            margin: 0 auto 18px;
            color: #718096;
            font-size: 12px;
          }

          /* =====================================================
             PROGRESS CARD
             ===================================================== */

          .progress-card {
            padding: 25px;
            background:
              linear-gradient(
                145deg,
                #082b59 0%,
                #0b5ed7 100%
              );
            color: white;
            border: 0;
          }

          .progress-card-header {
            display: flex;
            justify-content: space-between;
          }

          .progress-card-header span {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1px;
            opacity: .75;
          }

          .progress-card-header h2 {
            margin: 5px 0 0;
            font-size: 22px;
          }

          .progress-star {
            font-size: 25px;
          }

          .progress-ring {
            width: 170px;
            height: 170px;
            margin: 25px auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
          }

          .progress-ring-inner {
            width: 132px;
            height: 132px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: white;
            color: #172033;
          }

          .progress-ring-inner strong {
            font-size: 30px;
          }

          .progress-ring-inner span {
            font-size: 11px;
            color: #718096;
          }

          .progress-message {
            margin: 0;
            color: rgba(255,255,255,.82);
            font-size: 12px;
            line-height: 1.65;
            text-align: center;
          }

          .progress-button {
            width: 100%;
            margin-top: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            min-height: 46px;
            padding: 0 18px;
            border-radius: 10px;
            background: white;
            color: #0b5ed7;
            text-decoration: none;
            font-size: 13px;
            font-weight: 800;
          }

          /* =====================================================
             QUICK ACCESS
             ===================================================== */

          .quick-access-card {
            padding: 23px;
          }

          .quick-access-heading {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
          }

          .quick-access-heading span {
            font-size: 10px;
            font-weight: 800;
            color: #0b5ed7;
          }

          .quick-access-heading h2 {
            margin: 5px 0 0;
            font-size: 21px;
          }

          .quick-access-icon {
            font-size: 22px;
          }

          .quick-access-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 13px 0;
            border-top: 1px solid #edf0f4;
            color: inherit;
            text-decoration: none;
          }

          .quick-live-link {
            margin-left: -4px;
            margin-right: -4px;
            padding-left: 4px;
            padding-right: 4px;
            border-radius: 8px;
            background: #f5fffa;
          }

          .quick-link-icon {
            width: 39px;
            height: 39px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
          }

          .quick-blue {
            background: #e8f1ff;
          }

          .quick-green {
            background: #e8f8ef;
          }

          .quick-live {
            background: #dcf8e9;
          }

          .quick-link-text {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 3px;
          }

          .quick-link-text strong {
            font-size: 13px;
          }

          .quick-link-text small {
            color: #8993a5;
            font-size: 10px;
          }

          /* =====================================================
             MOTIVATION
             ===================================================== */

          .student-motivation {
            display: flex;
            align-items: center;
            gap: 18px;
            margin-top: 22px;
            padding: 23px 27px;
            border: 1px solid #dbe8f8;
            border-radius: 17px;
            background: #eef6ff;
          }

          .motivation-mark {
            width: 46px;
            height: 46px;
            flex: 0 0 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            background: #0b5ed7;
            color: white;
          }

          .student-motivation p {
            margin: 5px 0 0;
            color: #5e7189;
            font-size: 12px;
            line-height: 1.6;
          }

          .student-logout {
            display: flex;
            justify-content: flex-end;
            margin-top: 22px;
          }

          /* =====================================================
             FOOTER
             ===================================================== */

          .student-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 25px 32px;
            border-top: 1px solid #e2e7ee;
            background: white;
            color: #718096;
          }

          .student-footer > div {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .student-footer strong {
            color: #172033;
            font-size: 13px;
          }

          .student-footer span {
            color: #0b5ed7;
            font-size: 11px;
            font-weight: 700;
          }

          .student-footer p {
            margin: 0;
          }

          /* =====================================================
             TABLET
             ===================================================== */

          @media (max-width: 1100px) {
            .student-statistics {
              grid-template-columns: repeat(2,1fr);
            }

            .student-main-grid {
              grid-template-columns: 1fr;
            }

            .student-right-column {
              display: grid;
              grid-template-columns: repeat(2,1fr);
            }

            .learning-options {
              grid-template-columns: 1fr;
            }
          }

          /* =====================================================
             MOBILE
             ===================================================== */

          @media (max-width: 760px) {
            .student-container {
              padding: 20px 16px;
            }

            .student-header-inner {
              min-height: 72px;
              padding: 10px 16px;
            }

            .student-brand-logo {
              width: 48px;
              height: 48px;
            }

            .student-user-details {
              display: none;
            }

            .student-hero {
              padding: 32px 25px;
            }

            .student-hero-visual {
              display: none;
            }

            .student-hero h1 {
              font-size: 34px;
            }

            .student-hero-actions {
              flex-direction: column;
            }

            .student-primary-button,
            .student-secondary-button,
            .student-live-button {
              width: 100%;
            }

            .student-statistics {
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }

            .student-live-class-feature {
              grid-template-columns: 1fr;
            }

            .student-live-visual {
              min-height: 190px;
            }

            .student-live-main {
              padding: 25px;
            }

            .student-live-main h2 {
              font-size: 24px;
            }

            .student-live-actions {
              flex-direction: column;
            }

            .student-live-primary,
            .student-live-secondary {
              width: 100%;
            }

            .student-panel {
              padding: 20px;
            }

            .student-right-column {
              display: flex;
            }

            .student-footer {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;
              padding: 22px 16px;
            }
          }

          /* =====================================================
             SMALL MOBILE
             ===================================================== */

          @media (max-width: 480px) {
            .student-statistics {
              grid-template-columns: 1fr;
            }

            .student-hero h1 {
              font-size: 30px;
            }

            .student-live-main h2 {
              font-size: 22px;
            }

            .panel-heading-row {
              flex-direction: column;
              gap: 10px;
            }

            .recent-result-row {
              grid-template-columns: 30px minmax(0,1fr) 60px;
            }

            .result-grade {
              display: none;
            }

            .student-motivation {
              align-items: flex-start;
              padding: 20px;
            }

            .student-motivation p {
              line-height: 1.6;
            }
          }
        `}</style>
      </main>
    )
  }

  /* =========================================================
     ADMIN / TEACHER DASHBOARD
     ========================================================= */

  const adminCards = [
    {
      title: 'Students',
      description:
        'Manage student accounts, profiles and learning information.',
      href: '/dashboard/students',
      icon: '👨‍🎓',
      label: 'STUDENT MANAGEMENT',
      className: 'admin-card-blue',
    },
    {
      title: 'Question Bank',
      description:
        'Create, edit and manage assessment questions.',
      href: '/dashboard/questions',
      icon: '📝',
      label: 'ACADEMIC CONTENT',
      className: 'admin-card-purple',
    },
    {
      title: 'Assessments',
      description:
        'Create, assign and manage student assessments.',
      href: '/dashboard/assessments',
      icon: '📚',
      label: 'ASSESSMENT MANAGEMENT',
      className: 'admin-card-green',
    },
    {
      title: 'Results',
      description:
        'Review student assessment results and performance.',
      href: '/dashboard/results',
      icon: '📊',
      label: 'PERFORMANCE',
      className: 'admin-card-gold',
    },
    {
      title: 'Parent Registrations',
      description:
        'Review and manage parent enquiries and registrations.',
      href: '/dashboard/parent-registrations',
      icon: '👨‍👩‍👧‍👦',
      label: 'PARENT SERVICES',
      className: 'admin-card-pink',
    },
  ]

  return (
    <main className="admin-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .admin-page {
          min-height: 100vh;
          background: #f4f7fb;
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

        .admin-shell {
          min-height: 100vh;
          display: flex;
        }

        .admin-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 50;
          width: 260px;
          display: flex;
          flex-direction: column;
          background:
            linear-gradient(
              180deg,
              #061f40 0%,
              #082b59 55%,
              #06356f 100%
            );
          color: white;
          box-shadow: 8px 0 30px rgba(8,43,89,.12);
        }

        .sidebar-brand {
          min-height: 96px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255,255,255,.09);
          text-decoration: none;
          color: white;
        }

        .sidebar-logo {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 9px;
          background: white;
        }

        .sidebar-brand-name {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: .3px;
        }

        .sidebar-brand-motto {
          margin-top: 3px;
          font-size: 9px;
          color: #8ec5ff;
          font-weight: 700;
          letter-spacing: .5px;
        }

        .sidebar-section-label {
          padding: 25px 22px 10px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,.42);
        }

        .sidebar-nav {
          padding: 0 12px;
        }

        .sidebar-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 48px;
          margin-bottom: 4px;
          padding: 0 13px;
          border-radius: 10px;
          color: rgba(255,255,255,.72);
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          transition:
            background .18s ease,
            color .18s ease,
            transform .18s ease;
        }

        .sidebar-link:hover {
          background: rgba(255,255,255,.09);
          color: white;
          transform: translateX(2px);
        }

        .sidebar-link-active {
          background: rgba(44,137,255,.22);
          color: white;
        }

        .sidebar-link-active::before {
          content: "";
          position: absolute;
          left: 0;
          top: 10px;
          bottom: 10px;
          width: 3px;
          border-radius: 999px;
          background: #54a6ff;
        }

        .sidebar-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(255,255,255,.07);
          font-size: 16px;
        }

        .sidebar-live {
          margin-top: 8px;
          background:
            linear-gradient(
              135deg,
              rgba(16,185,129,.22),
              rgba(14,165,233,.12)
            );
          border: 1px solid rgba(52,211,153,.18);
        }

        .sidebar-live .sidebar-icon {
          background: rgba(16,185,129,.18);
        }

        .sidebar-bottom {
          margin-top: auto;
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,.08);
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px;
          border-radius: 11px;
          background: rgba(255,255,255,.06);
        }

        .sidebar-avatar {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #0b5ed7;
          color: white;
          font-size: 12px;
          font-weight: 900;
        }

        .sidebar-user-text {
          min-width: 0;
        }

        .sidebar-user-text strong {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 10px;
          color: white;
        }

        .sidebar-user-text span {
          display: block;
          margin-top: 2px;
          font-size: 9px;
          color: rgba(255,255,255,.5);
        }

        .admin-main {
          width: calc(100% - 260px);
          margin-left: 260px;
          min-width: 0;
        }

        .admin-topbar {
          position: sticky;
          top: 0;
          z-index: 30;
          min-height: 82px;
          padding: 0 34px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          background: rgba(255,255,255,.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid #e5e9f0;
        }

        .topbar-title small {
          display: block;
          margin-bottom: 3px;
          color: #0b5ed7;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.4px;
        }

        .topbar-title h1 {
          margin: 0;
          font-size: 22px;
          line-height: 1.1;
          font-weight: 850;
          color: #0a2547;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .topbar-user {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 11px;
          border: 1px solid #e5e9f0;
          border-radius: 10px;
          background: white;
        }

        .topbar-avatar {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e8f1ff;
          color: #0b5ed7;
          font-size: 11px;
          font-weight: 900;
        }

        .topbar-user-details strong {
          display: block;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px;
        }

        .topbar-user-details span {
          display: block;
          margin-top: 2px;
          color: #8993a5;
          font-size: 9px;
        }

        .admin-content {
          max-width: 1500px;
          margin: 0 auto;
          padding: 30px 34px 45px;
        }

        .admin-hero {
          position: relative;
          min-height: 210px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          padding: 32px 38px;
          border-radius: 18px;
          background:
            linear-gradient(
              120deg,
              #06244a 0%,
              #0b5ed7 68%,
              #1677e8 100%
            );
          color: white;
          box-shadow: 0 18px 45px rgba(8,43,89,.15);
        }

        .admin-hero::before {
          content: "";
          position: absolute;
          width: 300px;
          height: 300px;
          right: -80px;
          top: -150px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,.14);
          box-shadow:
            0 0 0 35px rgba(255,255,255,.025),
            0 0 0 70px rgba(255,255,255,.018);
        }

        .admin-hero-content {
          position: relative;
          z-index: 2;
          max-width: 760px;
        }

        .admin-hero-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 13px;
          padding: 6px 10px;
          border: 1px solid rgba(255,255,255,.2);
          border-radius: 999px;
          background: rgba(255,255,255,.09);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #39e58c;
          box-shadow: 0 0 0 4px rgba(57,229,140,.12);
        }

        .admin-hero h2 {
          margin: 0;
          font-size: clamp(27px,3vw,40px);
          line-height: 1.08;
          letter-spacing: -.8px;
        }

        .admin-hero h2 span {
          color: #a9d4ff;
        }

        .admin-hero p {
          max-width: 650px;
          margin: 12px 0 0;
          color: rgba(255,255,255,.78);
          font-size: 13px;
          line-height: 1.65;
        }

        .hero-actions {
          position: relative;
          z-index: 2;
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 20px;
        }

        .hero-action {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 38px;
          padding: 0 13px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
        }

        .hero-action-primary {
          background: white;
          color: #0b5ed7;
        }

        .hero-action-secondary {
          border: 1px solid rgba(255,255,255,.25);
          background: rgba(255,255,255,.08);
          color: white;
        }

        .hero-visual {
          position: relative;
          z-index: 2;
          width: 220px;
          height: 150px;
          flex: 0 0 220px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-visual-circle {
          position: absolute;
          width: 145px;
          height: 145px;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 50%;
        }

        .hero-monitor {
          position: relative;
          width: 125px;
          height: 86px;
          border: 5px solid rgba(255,255,255,.88);
          border-radius: 9px;
          background: rgba(255,255,255,.1);
          box-shadow: 0 15px 30px rgba(0,0,0,.15);
        }

        .hero-monitor::after {
          content: "";
          position: absolute;
          left: 42px;
          right: 42px;
          bottom: -15px;
          height: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,.8);
        }

        .hero-monitor-screen {
          position: absolute;
          inset: 9px;
          border-radius: 4px;
          background:
            linear-gradient(
              135deg,
              rgba(255,255,255,.22),
              rgba(255,255,255,.06)
            );
        }

        .hero-monitor-dot {
          position: absolute;
          top: 13px;
          left: 13px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #39e58c;
          box-shadow: 0 0 0 5px rgba(57,229,140,.12);
        }

        .section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin: 30px 0 14px;
        }

        .section-header-kicker {
          color: #0b5ed7;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .section-header h2 {
          margin: 4px 0 0;
          color: #172033;
          font-size: 20px;
        }

        .section-header p {
          margin: 4px 0 0;
          color: #8993a5;
          font-size: 11px;
        }

        .section-link {
          color: #0b5ed7;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
        }

        .live-class-feature {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(0,1fr) 300px;
          min-height: 210px;
          border-radius: 17px;
          background: white;
          border: 1px solid #dcebe5;
          box-shadow: 0 10px 30px rgba(23,32,51,.06);
        }

        .live-class-main {
          position: relative;
          padding: 27px 30px;
          background:
            linear-gradient(
              135deg,
              #f0fff8 0%,
              #f8fffc 58%,
              #ffffff 100%
            );
        }

        .live-class-main::after {
          content: "";
          position: absolute;
          right: -100px;
          bottom: -120px;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(16,185,129,.05);
        }

        .live-class-badge {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 9px;
          border-radius: 999px;
          background: #dff8eb;
          color: #07844d;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .live-class-main h3 {
          position: relative;
          z-index: 2;
          margin: 13px 0 7px;
          font-size: 25px;
          color: #0d3b2a;
        }

        .live-class-main p {
          position: relative;
          z-index: 2;
          max-width: 650px;
          margin: 0;
          color: #60756c;
          font-size: 12px;
          line-height: 1.65;
        }

        .live-class-actions {
          position: relative;
          z-index: 2;
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 20px;
        }

        .live-class-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 39px;
          padding: 0 14px;
          border-radius: 9px;
          background: #0b9b62;
          color: white;
          text-decoration: none;
          font-size: 10px;
          font-weight: 900;
          box-shadow: 0 8px 18px rgba(11,155,98,.18);
        }

        .live-class-secondary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 39px;
          padding: 0 14px;
          border: 1px solid #cfe6db;
          border-radius: 9px;
          background: white;
          color: #087c50;
          text-decoration: none;
          font-size: 10px;
          font-weight: 800;
        }

        .live-class-side {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 25px;
          background:
            linear-gradient(
              145deg,
              #062b59,
              #0b5ed7
            );
          color: white;
        }

        .live-class-side::before {
          content: "";
          position: absolute;
          right: -55px;
          top: -65px;
          width: 170px;
          height: 170px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 50%;
        }

        .live-class-side-label {
          color: rgba(255,255,255,.58);
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .live-class-side-title {
          margin-top: 7px;
          font-size: 17px;
          font-weight: 800;
        }

        .live-stat-list {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          gap: 8px;
          margin-top: 17px;
        }

        .live-stat {
          padding: 10px;
          border: 1px solid rgba(255,255,255,.11);
          border-radius: 8px;
          background: rgba(255,255,255,.07);
        }

        .live-stat strong {
          display: block;
          font-size: 16px;
        }

        .live-stat span {
          display: block;
          margin-top: 2px;
          color: rgba(255,255,255,.52);
          font-size: 8px;
        }

        .management-grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 15px;
        }

        .management-card {
          position: relative;
          min-height: 185px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 21px;
          border: 1px solid #e5e9f0;
          border-radius: 15px;
          background: white;
          color: inherit;
          text-decoration: none;
          box-shadow: 0 7px 22px rgba(23,32,51,.045);
          transition:
            transform .18s ease,
            box-shadow .18s ease,
            border-color .18s ease;
        }

        .management-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(23,32,51,.09);
          border-color: #cdd9e8;
        }

        .management-card::after {
          content: "";
          position: absolute;
          width: 110px;
          height: 110px;
          right: -50px;
          bottom: -50px;
          border-radius: 50%;
          background: currentColor;
          opacity: .035;
        }

        .card-icon {
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          font-size: 20px;
        }

        .card-label {
          margin-top: 16px;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .management-card h3 {
          margin: 5px 0 5px;
          font-size: 16px;
        }

        .management-card p {
          margin: 0;
          max-width: 290px;
          color: #7a8799;
          font-size: 10px;
          line-height: 1.6;
        }

        .card-arrow {
          position: absolute;
          right: 20px;
          top: 22px;
          font-size: 17px;
          font-weight: 900;
        }

        .admin-card-blue {
          color: #0b5ed7;
        }

        .admin-card-blue .card-icon {
          background: #e8f1ff;
        }

        .admin-card-purple {
          color: #7048c8;
        }

        .admin-card-purple .card-icon {
          background: #f0eaff;
        }

        .admin-card-green {
          color: #0b9b62;
        }

        .admin-card-green .card-icon {
          background: #e6f8ef;
        }

        .admin-card-gold {
          color: #bd8300;
        }

        .admin-card-gold .card-icon {
          background: #fff5d9;
        }

        .admin-card-pink {
          color: #c0477b;
        }

        .admin-card-pink .card-icon {
          background: #fdeaf2;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 12px;
        }

        .quick-action {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 65px;
          padding: 11px 13px;
          border: 1px solid #e5e9f0;
          border-radius: 11px;
          background: white;
          color: inherit;
          text-decoration: none;
          box-shadow: 0 5px 16px rgba(23,32,51,.035);
        }

        .quick-action-icon {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #edf4ff;
          font-size: 16px;
        }

        .quick-action-text strong {
          display: block;
          font-size: 10px;
        }

        .quick-action-text span {
          display: block;
          margin-top: 3px;
          color: #8993a5;
          font-size: 8px;
        }

        .admin-footer {
          margin-top: 35px;
          padding-top: 20px;
          border-top: 1px solid #e2e7ee;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          color: #8993a5;
          font-size: 9px;
        }

        .admin-footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .admin-footer-brand strong {
          color: #172033;
          font-size: 10px;
        }

        .admin-footer-brand span {
          color: #0b5ed7;
          font-weight: 700;
        }

        @media (max-width: 1150px) {
          .admin-sidebar {
            width: 220px;
          }

          .admin-main {
            width: calc(100% - 220px);
            margin-left: 220px;
          }

          .management-grid {
            grid-template-columns: repeat(2,1fr);
          }

          .quick-actions {
            grid-template-columns: repeat(2,1fr);
          }
        }

        @media (max-width: 820px) {
          .admin-sidebar {
            position: relative;
            width: 100%;
            height: auto;
          }

          .admin-shell {
            display: block;
          }

          .admin-main {
            width: 100%;
            margin-left: 0;
          }

          .sidebar-brand {
            min-height: 76px;
          }

          .sidebar-section-label {
            display: none;
          }

          .sidebar-nav {
            display: grid;
            grid-template-columns: repeat(3,1fr);
            gap: 5px;
            padding: 10px;
          }

          .sidebar-link {
            margin: 0;
            min-height: 42px;
            justify-content: center;
            padding: 5px;
          }

          .sidebar-link span:last-child {
            display: none;
          }

          .sidebar-icon {
            width: 30px;
            height: 30px;
          }

          .sidebar-bottom {
            display: none;
          }

          .admin-topbar {
            position: relative;
            min-height: 70px;
            padding: 0 18px;
          }

          .admin-content {
            padding: 20px 16px 35px;
          }

          .admin-hero {
            padding: 25px;
          }

          .hero-visual {
            display: none;
          }

          .live-class-feature {
            grid-template-columns: 1fr;
          }

          .live-class-side {
            min-height: 145px;
          }

          .management-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 560px) {
          .topbar-user {
            padding: 5px;
            border: 0;
          }

          .topbar-user-details {
            display: none;
          }

          .admin-hero h2 {
            font-size: 27px;
          }

          .management-grid {
            grid-template-columns: 1fr;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }

          .section-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
          }

          .sidebar-nav {
            grid-template-columns: repeat(2,1fr);
          }

          .admin-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="admin-shell">

        {/* =====================================================
            SIDEBAR
            ===================================================== */}

        <aside className="admin-sidebar">
          <Link
            href="/dashboard"
            className="sidebar-brand"
          >
            <Image
              src="/joech-logo.jpg"
              alt="JOECH TUTOR"
              width={50}
              height={50}
              priority
              className="sidebar-logo"
            />

            <div>
              <div className="sidebar-brand-name">
                JOECH TUTOR
              </div>

              <div className="sidebar-brand-motto">
                Excellence Beyond Borders
              </div>
            </div>
          </Link>

          <div className="sidebar-section-label">
            MAIN MENU
          </div>

          <nav className="sidebar-nav">
            <Link
              href="/dashboard"
              className="sidebar-link sidebar-link-active"
            >
              <span className="sidebar-icon">
                🏠
              </span>

              <span>
                Dashboard
              </span>
            </Link>

            <Link
              href="/dashboard/students"
              className="sidebar-link"
            >
              <span className="sidebar-icon">
                👨‍🎓
              </span>

              <span>
                Students
              </span>
            </Link>

            <Link
              href="/dashboard/questions"
              className="sidebar-link"
            >
              <span className="sidebar-icon">
                📝
              </span>

              <span>
                Question Bank
              </span>
            </Link>

            <Link
              href="/dashboard/assessments"
              className="sidebar-link"
            >
              <span className="sidebar-icon">
                📚
              </span>

              <span>
                Assessments
              </span>
            </Link>

            <Link
              href="/dashboard/results"
              className="sidebar-link"
            >
              <span className="sidebar-icon">
                📊
              </span>

              <span>
                Results
              </span>
            </Link>

            <Link
              href="/dashboard/parent-registrations"
              className="sidebar-link"
            >
              <span className="sidebar-icon">
                👨‍👩‍👧‍👦
              </span>

              <span>
                Parent Registrations
              </span>
            </Link>

            <Link
              href="/dashboard/live-classes"
              className="sidebar-link sidebar-live"
            >
              <span className="sidebar-icon">
                🎥
              </span>

              <span>
                Live Classes
              </span>
            </Link>
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <div className="sidebar-avatar">
                {displayName
                  .toString()
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="sidebar-user-text">
                <strong>
                  {displayName}
                </strong>

                <span>
                  {role === 'admin'
                    ? 'Administrator'
                    : 'Teacher'}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* =====================================================
            ADMIN MAIN
            ===================================================== */}

        <div className="admin-main">
          <header className="admin-topbar">
            <div className="topbar-title">
              <small>
                JOECH TUTOR • ADMINISTRATION
              </small>

              <h1>
                Admin Dashboard
              </h1>
            </div>

            <div className="topbar-right">
              <div className="topbar-user">
                <div className="topbar-avatar">
                  {displayName
                    .toString()
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="topbar-user-details">
                  <strong>
                    {displayName}
                  </strong>

                  <span>
                    {role === 'admin'
                      ? 'Administrator'
                      : 'Teaching Platform'}
                  </span>
                </div>
              </div>

              <LogoutButton />
            </div>
          </header>

          <div className="admin-content">

            {/* HERO */}

            <section className="admin-hero">
              <div className="admin-hero-content">
                <div className="admin-hero-label">
                  <span className="live-dot" />
                  ADMINISTRATION PORTAL
                </div>

                <h2>
                  Welcome back,
                  <br />
                  <span>
                    {displayName}
                  </span>
                </h2>

                <p>
                  Manage your students, assessments,
                  live classes and academic activities
                  from one professional workspace.
                </p>

                <div className="hero-actions">
                  <Link
                    href="/dashboard/live-classes"
                    className="hero-action hero-action-primary"
                  >
                    🎥
                    Open Live Classroom
                  </Link>

                  <Link
                    href="/dashboard/assessments"
                    className="hero-action hero-action-secondary"
                  >
                    📚
                    Manage Assessments
                  </Link>
                </div>
              </div>

              <div className="hero-visual">
                <div className="hero-visual-circle" />

                <div className="hero-monitor">
                  <div className="hero-monitor-screen" />
                  <div className="hero-monitor-dot" />
                </div>
              </div>
            </section>

            {/* LIVE CLASSROOM */}

            <div className="section-header">
              <div>
                <div className="section-header-kicker">
                  VIRTUAL TEACHING
                </div>

                <h2>
                  Live Classroom
                </h2>

                <p>
                  Manage your online teaching sessions
                  and connect with your learners.
                </p>
              </div>

              <Link
                href="/dashboard/live-classes"
                className="section-link"
              >
                Manage Live Classes →
              </Link>
            </div>

            <section className="live-class-feature">
              <div className="live-class-main">
                <div className="live-class-badge">
                  <span className="live-dot" />
                  LIVE CLASSROOM
                </div>

                <h3>
                  Teach. Connect. Inspire.
                </h3>

                <p>
                  Schedule live lessons, organise
                  students, manage your teaching
                  sessions and launch your virtual
                  classroom from one central location.
                </p>

                <div className="live-class-actions">
                  <Link
                    href="/dashboard/live-classes"
                    className="live-class-primary"
                  >
                    🎥 Open Live Classes
                    <span>→</span>
                  </Link>

                  <Link
                    href="/dashboard/live-classes"
                    className="live-class-secondary"
                  >
                    ＋ Schedule a Class
                  </Link>
                </div>
              </div>

              <div className="live-class-side">
                <div className="live-class-side-label">
                  TEACHING OVERVIEW
                </div>

                <div className="live-class-side-title">
                  Virtual Classroom
                </div>

                <div className="live-stat-list">
                  <div className="live-stat">
                    <strong>
                      Live
                    </strong>

                    <span>
                      Classroom
                    </span>
                  </div>

                  <div className="live-stat">
                    <strong>
                      24/7
                    </strong>

                    <span>
                      Access
                    </span>
                  </div>

                  <div className="live-stat">
                    <strong>
                      1:1
                    </strong>

                    <span>
                      Teaching
                    </span>
                  </div>

                  <div className="live-stat">
                    <strong>
                      HD
                    </strong>

                    <span>
                      Learning
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* MANAGEMENT */}

            <div className="section-header">
              <div>
                <div className="section-header-kicker">
                  PLATFORM MANAGEMENT
                </div>

                <h2>
                  Academic Management
                </h2>

                <p>
                  Everything you need to manage the
                  JOECH TUTOR learning platform.
                </p>
              </div>
            </div>

            <section className="management-grid">
              {adminCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className={`management-card ${card.className}`}
                >
                  <div className="card-icon">
                    {card.icon}
                  </div>

                  <div className="card-label">
                    {card.label}
                  </div>

                  <h3>
                    {card.title}
                  </h3>

                  <p>
                    {card.description}
                  </p>

                  <span className="card-arrow">
                    →
                  </span>
                </Link>
              ))}
            </section>

            {/* QUICK ACTIONS */}

            <div className="section-header">
              <div>
                <div className="section-header-kicker">
                  QUICK ACTIONS
                </div>

                <h2>
                  Get Things Done
                </h2>
              </div>
            </div>

            <section className="quick-actions">
              <Link
                href="/dashboard/students"
                className="quick-action"
              >
                <div className="quick-action-icon">
                  👨‍🎓
                </div>

                <div className="quick-action-text">
                  <strong>
                    Manage Students
                  </strong>

                  <span>
                    Student accounts
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/questions"
                className="quick-action"
              >
                <div className="quick-action-icon">
                  📝
                </div>

                <div className="quick-action-text">
                  <strong>
                    Add Questions
                  </strong>

                  <span>
                    Question bank
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/assessments"
                className="quick-action"
              >
                <div className="quick-action-icon">
                  📚
                </div>

                <div className="quick-action-text">
                  <strong>
                    Create Assessment
                  </strong>

                  <span>
                    New assessment
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/live-classes"
                className="quick-action"
              >
                <div className="quick-action-icon">
                  🎥
                </div>

                <div className="quick-action-text">
                  <strong>
                    Schedule Live Class
                  </strong>

                  <span>
                    Virtual classroom
                  </span>
                </div>
              </Link>
            </section>

            {/* FOOTER */}

            <footer className="admin-footer">
              <div className="admin-footer-brand">
                <strong>
                  JOECH TUTOR
                </strong>

                <span>
                  Excellence Beyond Borders
                </span>
              </div>

              <div>
                Mathematics &amp; English Assessment
                Platform
              </div>
            </footer>
          </div>
        </div>
      </div>
    </main>
  )
}