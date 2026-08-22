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

  /*
   * =========================================================
   * STUDENT DASHBOARD
   * =========================================================
   */

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
        {/* =====================================================
            STUDENT HEADER
            ===================================================== */}

        <header className="student-header">
          <div className="student-header-inner">
            <Link
              href="/dashboard"
              className="student-brand"
            >
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

        {/* =====================================================
            MAIN CONTENT
            ===================================================== */}

        <div className="student-container">
          {/* ===================================================
              WELCOME HERO
              =================================================== */}

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
                Continue your learning journey, complete
                your assessments and monitor your academic
                progress.
              </p>

              <div className="student-hero-actions">
                <Link
                  href="/dashboard/student/assessments"
                  className="student-primary-button"
                >
                  <span className="button-symbol">▶</span>
                  Start an Assessment
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

          {/* ===================================================
              STATISTICS
              =================================================== */}

          <section className="student-statistics">
            <div className="student-stat-card">
              <div className="stat-icon stat-blue">
                <span>◫</span>
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
                <span>✓</span>
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
                <span>★</span>
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
                <span>◆</span>
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

          {/* ===================================================
              TWO COLUMN CONTENT
              =================================================== */}

          <div className="student-main-grid">
            {/* =================================================
                LEFT COLUMN
                ================================================= */}

            <div className="student-left-column">
              {/* =================================================
                  MY LEARNING
                  ================================================= */}

              <section className="student-panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-kicker">
                      LEARNING
                    </span>

                    <h2>
                      My Learning
                    </h2>

                    <p>
                      Access your assessments and review
                      your academic progress.
                    </p>
                  </div>
                </div>

                <div className="learning-options">
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

            {/* =================================================
                RIGHT COLUMN
                ================================================= */}

            <aside className="student-right-column">
              {/* =================================================
                  PROGRESS CARD
                  ================================================= */}

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

              {/* =================================================
                  QUICK ACCESS
                  ================================================= */}

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

          {/* ===================================================
              MOTIVATIONAL MESSAGE
              =================================================== */}

          <section className="student-motivation">
            <div className="motivation-mark">
              ✦
            </div>

            <div>
              <strong>
                Excellence Beyond Borders
              </strong>

              <p>
                Every question you answer is another step
                toward becoming a better learner. Stay
                focused, keep practising and believe in
                your ability to succeed.
              </p>
            </div>
          </section>

          {/* ===================================================
              LOGOUT
              =================================================== */}

          <div className="student-logout">
            <LogoutButton />
          </div>
        </div>

        {/* =====================================================
            FOOTER
            ===================================================== */}

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

        {/* =====================================================
            STUDENT DASHBOARD STYLES
            ===================================================== */}

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

          .student-header {
            position: sticky;
            top: 0;
            z-index: 20;
            background: #ffffff;
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
            display: block;
          }

          .student-brand-name {
            font-size: 21px;
            font-weight: 800;
            letter-spacing: 0.4px;
            color: #0d2340;
          }

          .student-brand-motto {
            margin-top: 2px;
            font-size: 11px;
            font-weight: 600;
            color: #0b5ed7;
            letter-spacing: 0.5px;
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
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
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
            color: #172033;
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

          .student-hero {
            position: relative;
            min-height: 310px;
            overflow: hidden;
            display: flex;
            align-items: stretch;
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
            color: #ffffff;
            box-shadow: 0 18px 45px rgba(8, 43, 89, 0.16);
          }

          .student-hero-content {
            position: relative;
            z-index: 3;
            max-width: 720px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .student-hero-label {
            width: fit-content;
            margin-bottom: 14px;
            padding: 7px 12px;
            border: 1px solid rgba(255, 255, 255, 0.28);
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.1);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.2px;
          }

          .student-hero h1 {
            margin: 0;
            font-size: clamp(34px, 4vw, 52px);
            line-height: 1.08;
            letter-spacing: -1.5px;
            font-weight: 800;
          }

          .student-hero h1 span {
            color: #d9ecff;
          }

          .student-hero p {
            max-width: 650px;
            margin: 18px 0 0;
            color: rgba(255, 255, 255, 0.86);
            font-size: 16px;
            line-height: 1.7;
          }

          .student-hero-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 28px;
          }

          .student-primary-button,
          .student-secondary-button,
          .progress-button {
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
            transition:
              transform 0.18s ease,
              box-shadow 0.18s ease;
          }

          .student-primary-button {
            background: #ffffff;
            color: #0b5ed7;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.14);
          }

          .student-primary-button:hover,
          .student-secondary-button:hover,
          .progress-button:hover {
            transform: translateY(-2px);
          }

          .student-secondary-button {
            border: 1px solid rgba(255, 255, 255, 0.32);
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
          }

          .button-symbol {
            font-size: 11px;
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
            border: 1px solid rgba(255, 255, 255, 0.16);
            background: rgba(255, 255, 255, 0.06);
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
            background: #ffffff;
            color: #0d2340;
            box-shadow: 18px 20px 35px rgba(0, 0, 0, 0.22);
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
            line-height: 1;
            font-weight: 900;
            letter-spacing: 1px;
          }

          .hero-book-subtitle {
            margin-top: 7px;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 3px;
          }

          .student-statistics {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 18px;
            margin-top: 22px;
          }

          .student-stat-card {
            display: flex;
            align-items: center;
            gap: 15px;
            min-height: 118px;
            padding: 20px;
            background: #ffffff;
            border: 1px solid #e6eaf0;
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(23, 32, 51, 0.05);
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

          .stat-content {
            min-width: 0;
          }

          .stat-label {
            display: block;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.8px;
            color: #718096;
          }

          .stat-content strong {
            display: block;
            margin-top: 3px;
            font-size: 25px;
            line-height: 1.1;
            color: #172033;
          }

          .stat-content small {
            display: block;
            margin-top: 4px;
            color: #8993a5;
            font-size: 11px;
          }

          .student-main-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 350px;
            gap: 22px;
            margin-top: 22px;
          }

          .student-left-column,
          .student-right-column {
            min-width: 0;
          }

          .student-left-column,
          .student-right-column {
            display: flex;
            flex-direction: column;
            gap: 22px;
          }

          .student-panel,
          .progress-card,
          .quick-access-card {
            background: #ffffff;
            border: 1px solid #e6eaf0;
            border-radius: 17px;
            box-shadow: 0 8px 24px rgba(23, 32, 51, 0.05);
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
            gap: 20px;
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
            color: #172033;
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
            white-space: nowrap;
          }

          .learning-options {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }

          .learning-option {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 17px;
            border: 1px solid #e7ebf1;
            border-radius: 13px;
            text-decoration: none;
            color: inherit;
            transition:
              transform 0.18s ease,
              border-color 0.18s ease,
              box-shadow 0.18s ease;
          }

          .learning-option:hover {
            transform: translateY(-2px);
            border-color: #cbdcf5;
            box-shadow: 0 8px 20px rgba(23, 32, 51, 0.07);
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

          .learning-option-content {
            flex: 1;
            min-width: 0;
          }

          .learning-option-content h3 {
            margin: 0 0 4px;
            font-size: 14px;
            color: #172033;
          }

          .learning-option-content p {
            margin: 0;
            color: #718096;
            font-size: 11px;
            line-height: 1.5;
          }

          .learning-arrow {
            color: #0b5ed7;
            font-size: 18px;
            font-weight: 800;
          }

          .recent-results {
            display: flex;
            flex-direction: column;
          }

          .recent-result-row {
            display: grid;
            grid-template-columns: 42px minmax(0, 1fr) 70px 45px;
            align-items: center;
            gap: 12px;
            padding: 15px 0;
            border-bottom: 1px solid #edf0f4;
          }

          .recent-result-row:last-child {
            border-bottom: 0;
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
            color: #172033;
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
            min-width: 30px;
            padding: 5px 7px;
            border-radius: 7px;
            background: #f1f4f8;
            color: #172033;
            text-align: center;
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
            color: #172033;
          }

          .student-empty-state p {
            max-width: 430px;
            margin: 0 auto 18px;
            color: #718096;
            font-size: 12px;
            line-height: 1.6;
          }

          .progress-card {
            padding: 25px;
            background:
              linear-gradient(
                145deg,
                #082b59 0%,
                #0b5ed7 100%
              );
            color: #ffffff;
            border: 0;
          }

          .progress-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
          }

          .progress-card-header span {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1px;
            opacity: 0.75;
          }

          .progress-card-header h2 {
            margin: 5px 0 0;
            font-size: 22px;
          }

          .progress-star {
            font-size: 25px;
            opacity: 0.9;
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
            background: #ffffff;
            color: #172033;
          }

          .progress-ring-inner strong {
            font-size: 30px;
            line-height: 1;
          }

          .progress-ring-inner span {
            margin-top: 5px;
            font-size: 11px;
            color: #718096;
          }

          .progress-message {
            margin: 0;
            color: rgba(255, 255, 255, 0.82);
            font-size: 12px;
            line-height: 1.65;
            text-align: center;
          }

          .progress-button {
            width: 100%;
            margin-top: 20px;
            background: #ffffff;
            color: #0b5ed7;
          }

          .quick-access-card {
            padding: 23px;
          }

          .quick-access-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 15px;
          }

          .quick-access-heading span {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1px;
            color: #0b5ed7;
          }

          .quick-access-heading h2 {
            margin: 5px 0 0;
            font-size: 21px;
            color: #172033;
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

          .quick-link-icon {
            width: 39px;
            height: 39px;
            flex: 0 0 39px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            font-size: 17px;
          }

          .quick-blue {
            background: #e8f1ff;
          }

          .quick-green {
            background: #e8f8ef;
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

          .quick-access-link > span {
            color: #0b5ed7;
            font-size: 17px;
            font-weight: 800;
          }

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
            color: #ffffff;
            font-size: 22px;
          }

          .student-motivation strong {
            color: #0d3b70;
            font-size: 14px;
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

          .student-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-top: 20px;
            padding: 25px 32px;
            border-top: 1px solid #e2e7ee;
            background: #ffffff;
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
            letter-spacing: 0.5px;
          }

          .student-footer span {
            color: #0b5ed7;
            font-size: 11px;
            font-weight: 700;
          }

          .student-footer p {
            margin: 0;
            font-size: 11px;
          }

          /*
           * =====================================================
           * ADMIN / TEACHER DASHBOARD
           * =====================================================
           */

          .admin-dashboard-page {
            min-height: 100vh;
            background: #f5f7fb;
          }

          @media (max-width: 1100px) {
            .student-statistics {
              grid-template-columns: repeat(2, 1fr);
            }

            .student-main-grid {
              grid-template-columns: 1fr;
            }

            .student-right-column {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
            }
          }

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

            .student-brand-name {
              font-size: 17px;
            }

            .student-brand-motto {
              font-size: 9px;
            }

            .student-user-details {
              display: none;
            }

            .student-hero {
              min-height: auto;
              padding: 32px 25px;
            }

            .student-hero-visual {
              display: none;
            }

            .student-hero h1 {
              font-size: 34px;
            }

            .student-hero p {
              font-size: 14px;
            }

            .student-hero-actions {
              flex-direction: column;
              align-items: stretch;
            }

            .student-primary-button,
            .student-secondary-button {
              width: 100%;
            }

            .student-statistics {
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }

            .student-stat-card {
              min-height: 105px;
              padding: 14px;
              gap: 10px;
            }

            .stat-icon {
              width: 40px;
              height: 40px;
              flex-basis: 40px;
              font-size: 17px;
            }

            .stat-content strong {
              font-size: 21px;
            }

            .stat-content small {
              font-size: 9px;
            }

            .student-panel {
              padding: 20px;
            }

            .learning-options {
              grid-template-columns: 1fr;
            }

            .student-right-column {
              display: flex;
            }

            .recent-result-row {
              grid-template-columns: 30px minmax(0, 1fr) 55px 35px;
              gap: 8px;
            }

            .student-motivation {
              align-items: flex-start;
              padding: 20px;
            }

            .student-footer {
              flex-direction: column;
              align-items: flex-start;
              padding: 22px 16px;
            }
          }

          @media (max-width: 480px) {
            .student-statistics {
              grid-template-columns: 1fr;
            }

            .student-hero h1 {
              font-size: 30px;
            }

            .panel-heading-row {
              flex-direction: column;
              gap: 10px;
            }

            .recent-result-row {
              grid-template-columns: 25px minmax(0, 1fr) 48px;
            }

            .result-grade {
              display: none;
            }
          }
        `}</style>
      </main>
    )
  }

  /*
   * =========================================================
   * ADMIN / TEACHER DASHBOARD
   * =========================================================
   */

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        padding: '40px',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            marginBottom: '35px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: '#082b59',
                fontSize: '32px',
                fontWeight: 800,
              }}
            >
              JOECH TUTOR
            </h1>

            <p
              style={{
                margin: '7px 0 0',
                color: '#718096',
              }}
            >
              Welcome, {displayName}
            </p>
          </div>

          <LogoutButton />
        </div>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          <Link
            href="/dashboard/students"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              background: '#ffffff',
              border: '1px solid #e5e9f0',
              borderRadius: '16px',
              padding: '25px',
              boxShadow:
                '0 8px 24px rgba(23,32,51,.05)',
            }}
          >
            <div
              style={{
                fontSize: '30px',
                marginBottom: '12px',
              }}
            >
              👨‍🎓
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                color: '#172033',
              }}
            >
              Students
            </h2>

            <p
              style={{
                margin: '7px 0 0',
                color: '#718096',
                fontSize: '13px',
              }}
            >
              Manage student accounts and profiles.
            </p>
          </Link>

          <Link
            href="/dashboard/questions"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              background: '#ffffff',
              border: '1px solid #e5e9f0',
              borderRadius: '16px',
              padding: '25px',
              boxShadow:
                '0 8px 24px rgba(23,32,51,.05)',
            }}
          >
            <div
              style={{
                fontSize: '30px',
                marginBottom: '12px',
              }}
            >
              📝
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                color: '#172033',
              }}
            >
              Question Bank
            </h2>

            <p
              style={{
                margin: '7px 0 0',
                color: '#718096',
                fontSize: '13px',
              }}
            >
              Create and manage assessment questions.
            </p>
          </Link>

          <Link
            href="/dashboard/assessments"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              background: '#ffffff',
              border: '1px solid #e5e9f0',
              borderRadius: '16px',
              padding: '25px',
              boxShadow:
                '0 8px 24px rgba(23,32,51,.05)',
            }}
          >
            <div
              style={{
                fontSize: '30px',
                marginBottom: '12px',
              }}
            >
              📚
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                color: '#172033',
              }}
            >
              Assessments
            </h2>

            <p
              style={{
                margin: '7px 0 0',
                color: '#718096',
                fontSize: '13px',
              }}
            >
              Create, assign and manage assessments.
            </p>
          </Link>

          <Link
            href="/dashboard/results"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              background: '#ffffff',
              border: '1px solid #e5e9f0',
              borderRadius: '16px',
              padding: '25px',
              boxShadow:
                '0 8px 24px rgba(23,32,51,.05)',
            }}
          >
            <div
              style={{
                fontSize: '30px',
                marginBottom: '12px',
              }}
            >
              📊
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                color: '#172033',
              }}
            >
              Results
            </h2>

            <p
              style={{
                margin: '7px 0 0',
                color: '#718096',
                fontSize: '13px',
              }}
            >
              Review student assessment results.
            </p>
          </Link>
          <Link
            href="/dashboard/parent-registrations"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              background: '#ffffff',
              border: '1px solid #e5e9f0',
              borderRadius: '16px',
              padding: '25px',
              boxShadow:
                '0 8px 24px rgba(23,32,51,.05)',
            }}
          >
            <div
              style={{
                fontSize: '30px',
                marginBottom: '12px',
              }}
            >
              👨‍👩‍👧‍👦
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                color: '#172033',
              }}
            >
              Parent Registrations
            </h2>

            <p
              style={{
                margin: '7px 0 0',
                color: '#718096',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              Review and manage parent enquiries and registrations.
            </p>
          </Link>
        </section>
      </div>
    </main>
  )
}