'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'

type Student = {
  id: string
  grade: number
  created_at: string
  profiles?: {
    full_name?: string
    email?: string
  } | null
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [grade, setGrade] = useState('')

  async function loadStudents() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/students')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error || 'Unable to load students'
        )
      }

      setStudents(result.students || [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load students'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  async function addStudent(e: FormEvent) {
    e.preventDefault()

    setMessage('')
    setError('')

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !grade
    ) {
      setError('Please complete all fields.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    try {
      setSaving(true)

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          grade: Number(grade),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error || 'Unable to create student'
        )
      }

      setMessage('Student created successfully.')

      setFullName('')
      setEmail('')
      setPassword('')
      setGrade('')

      await loadStudents()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create student'
      )
    } finally {
      setSaving(false)
    }
  }

  const grade8Students = students.filter(
    (student) => student.grade === 8
  ).length

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
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
        }

        a {
          color: inherit;
        }

        .students-page {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at top right,
              rgba(92, 62, 170, 0.08),
              transparent 30%
            ),
            #f4f6fb;
        }

        .topbar {
          min-height: 82px;
          background: #ffffff;
          border-bottom: 1px solid #e7eaf1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 34px;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
        }

        .brand-logo {
          width: 54px;
          height: 54px;
          object-fit: cover;
          border-radius: 12px;
          box-shadow: 0 5px 15px rgba(32, 20, 75, 0.18);
        }

        .brand-name {
          margin: 0;
          color: #3f238c;
          font-family: Georgia, serif;
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .brand-motto {
          margin: 3px 0 0;
          color: #7c6a9e;
          font-size: 12px;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 14px;
          border: 1px solid #e4def3;
          background: #faf8ff;
          border-radius: 12px;
        }

        .admin-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #4d2a9a;
          color: white;
          font-size: 14px;
          font-weight: 800;
        }

        .admin-text strong {
          display: block;
          color: #28213b;
          font-size: 13px;
        }

        .admin-text span {
          color: #817991;
          font-size: 11px;
        }

        .layout {
          display: grid;
          grid-template-columns: 235px minmax(0, 1fr);
          min-height: calc(100vh - 82px);
        }

        .sidebar {
          background:
            linear-gradient(
              180deg,
              #24134d 0%,
              #321c68 48%,
              #25144d 100%
            );
          color: white;
          padding: 25px 15px;
        }

        .sidebar-title {
          color: #bca8e8;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          font-size: 10px;
          font-weight: 800;
          padding: 0 12px;
          margin-bottom: 12px;
        }

        .nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 13px;
          color: #ddd4f0;
          text-decoration: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          transition: 0.2s ease;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.09);
          color: white;
        }

        .nav-link.active {
          background: linear-gradient(
            90deg,
            #6942bb,
            #55309d
          );
          color: white;
          box-shadow:
            0 8px 20px rgba(16, 8, 39, 0.22);
        }

        .nav-icon {
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          font-size: 13px;
        }

        .content {
          width: 100%;
          max-width: 1400px;
          padding: 34px;
          margin: 0 auto;
        }

        .page-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-bottom: 25px;
        }

        .eyebrow {
          color: #7251b4;
          text-transform: uppercase;
          letter-spacing: 1.3px;
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 7px;
        }

        .page-heading h1 {
          margin: 0;
          color: #1d1730;
          font-size: 31px;
          letter-spacing: -0.8px;
        }

        .page-heading p {
          margin: 8px 0 0;
          color: #747185;
          font-size: 14px;
        }

        .header-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #4d2a9a;
          color: white;
          border-radius: 10px;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          box-shadow: 0 8px 18px rgba(77, 42, 154, 0.2);
        }

        .stats {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 25px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e9e8ef;
          border-radius: 16px;
          padding: 20px;
          box-shadow:
            0 5px 20px rgba(35, 27, 58, 0.045);
          position: relative;
          overflow: hidden;
        }

        .stat-card::after {
          content: "";
          position: absolute;
          width: 70px;
          height: 70px;
          right: -20px;
          bottom: -20px;
          border-radius: 50%;
          background: rgba(88, 54, 159, 0.07);
        }

        .stat-label {
          color: #78738a;
          font-size: 12px;
          font-weight: 700;
        }

        .stat-number {
          margin-top: 7px;
          color: #27164d;
          font-size: 30px;
          font-weight: 800;
        }

        .stat-subtitle {
          margin-top: 3px;
          color: #9a96a7;
          font-size: 11px;
        }

        .section {
          background: white;
          border: 1px solid #e8e7ee;
          border-radius: 17px;
          padding: 25px;
          margin-bottom: 25px;
          box-shadow:
            0 5px 22px rgba(35, 27, 58, 0.045);
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 22px;
        }

        .section-heading h2 {
          margin: 0;
          color: #241b35;
          font-size: 19px;
        }

        .section-heading p {
          margin: 6px 0 0;
          color: #858091;
          font-size: 12px;
        }

        .count-badge {
          background: #f2edfc;
          color: #57339a;
          padding: 7px 11px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
        }

        .form-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .field label {
          display: block;
          margin-bottom: 7px;
          color: #373044;
          font-size: 12px;
          font-weight: 800;
        }

        .input {
          width: 100%;
          min-height: 44px;
          border: 1px solid #dddbe5;
          border-radius: 9px;
          padding: 10px 12px;
          outline: none;
          background: #fbfbfd;
          color: #272331;
          font-size: 13px;
          transition: 0.2s ease;
        }

        .input:focus {
          background: white;
          border-color: #7048b7;
          box-shadow:
            0 0 0 3px rgba(112, 72, 183, 0.1);
        }

        .form-footer {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding-top: 18px;
          border-top: 1px solid #efedf3;
        }

        .security-note {
          color: #817d8c;
          font-size: 11px;
        }

        .button {
          border: 0;
          border-radius: 9px;
          padding: 11px 17px;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s ease;
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-primary {
          background: #4d2a9a;
          color: white;
          box-shadow:
            0 7px 16px rgba(77, 42, 154, 0.2);
        }

        .button-primary:hover:not(:disabled) {
          background: #402183;
          transform: translateY(-1px);
        }

        .button-secondary {
          background: #f2edfc;
          color: #533098;
        }

        .button-secondary:hover {
          background: #e7def8;
        }

        .message {
          margin-top: 18px;
          padding: 12px 14px;
          border-radius: 9px;
          background: #edf9f1;
          border: 1px solid #ccebd5;
          color: #24733d;
          font-size: 12px;
          font-weight: 700;
        }

        .error {
          background: #fff1f1;
          border-color: #f4cccc;
          color: #b42323;
        }

        .table-wrap {
          overflow-x: auto;
          border: 1px solid #e8e6ed;
          border-radius: 12px;
        }

        .students-table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
        }

        .students-table th {
          padding: 14px 16px;
          text-align: left;
          background: #faf9fc;
          border-bottom: 1px solid #e5e3eb;
          color: #777184;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.7px;
        }

        .students-table td {
          padding: 15px 16px;
          border-bottom: 1px solid #eeeef2;
          font-size: 13px;
        }

        .students-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .students-table tbody tr:hover {
          background: #fcfbff;
        }

        .student-cell {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .avatar {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #ede5fa;
          color: #533098;
          font-weight: 800;
          font-size: 12px;
        }

        .student-name {
          color: #25202f;
          font-weight: 800;
        }

        .student-email {
          color: #8a8694;
          font-size: 11px;
          margin-top: 3px;
        }

        .grade-tag {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          background: #f1edfa;
          color: #55319a;
          font-size: 10px;
          font-weight: 800;
        }

        .date-text {
          color: #777381;
        }

        .loading,
        .empty {
          padding: 40px 20px;
          text-align: center;
          color: #888393;
          font-size: 13px;
        }

        .footer {
          padding: 25px 34px;
          text-align: center;
          color: #8a8495;
          font-size: 11px;
        }

        @media (max-width: 900px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .sidebar {
            display: none;
          }

          .stats {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }

          .content {
            padding: 25px 20px;
          }
        }

        @media (max-width: 680px) {
          .topbar {
            padding: 12px 16px;
          }

          .brand-name {
            font-size: 19px;
          }

          .brand-logo {
            width: 45px;
            height: 45px;
          }

          .topbar-right {
            display: none;
          }

          .page-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .page-heading h1 {
            font-size: 26px;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .section {
            padding: 18px;
          }

          .form-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .button-primary {
            width: 100%;
          }
        }
      `}</style>

      <div className="students-page">
        <header className="topbar">
          <Link
            href="/dashboard"
            className="brand"
          >
            <img
              src="/joech-logo.jpg"
              alt="JOECH TUTOR"
              className="brand-logo"
            />

            <div>
              <h1 className="brand-name">
                JOECH TUTOR
              </h1>

              <p className="brand-motto">
                Excellence Beyond Borders
              </p>
            </div>
          </Link>

          <div className="topbar-right">
            <div className="admin-badge">
              <div className="admin-icon">
                A
              </div>

              <div className="admin-text">
                <strong>
                  Administrator
                </strong>

                <span>
                  Student Management
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-title">
              Main Menu
            </div>

            <nav className="nav">
              <Link
                href="/dashboard"
                className="nav-link"
              >
                <span className="nav-icon">
                  ▦
                </span>
                Dashboard
              </Link>

              <Link
                href="/dashboard/students"
                className="nav-link active"
              >
                <span className="nav-icon">
                  👥
                </span>
                Students
              </Link>

              <Link
                href="/dashboard/questions"
                className="nav-link"
              >
                <span className="nav-icon">
                  ?
                </span>
                Question Bank
              </Link>

              <Link
                href="/dashboard/assessments"
                className="nav-link"
              >
                <span className="nav-icon">
                  ✓
                </span>
                Assessments
              </Link>

              <Link
                href="/dashboard/results"
                className="nav-link"
              >
                <span className="nav-icon">
                  ◫
                </span>
                Results
              </Link>
            </nav>
          </aside>

          <main className="content">
            <section className="page-heading">
              <div>
                <div className="eyebrow">
                  Administration
                </div>

                <h1>
                  Student Management
                </h1>

                <p>
                  Create and manage JOECH TUTOR
                  student accounts.
                </p>
              </div>

              <a
                href="#add-student"
                className="header-action"
              >
                + Add Student
              </a>
            </section>

            <section className="stats">
              <div className="stat-card">
                <div className="stat-label">
                  Total Students
                </div>

                <div className="stat-number">
                  {students.length}
                </div>

                <div className="stat-subtitle">
                  Registered on platform
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">
                  Grade 8 Students
                </div>

                <div className="stat-number">
                  {grade8Students}
                </div>

                <div className="stat-subtitle">
                  Current Grade 8 learners
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">
                  Registered Students
                </div>

                <div className="stat-number">
                  {students.length}
                </div>

                <div className="stat-subtitle">
                  Active student accounts
                </div>
              </div>
            </section>

            <section
              className="section"
              id="add-student"
            >
              <div className="section-heading">
                <div>
                  <h2>
                    Add Student
                  </h2>

                  <p>
                    Create a secure student
                    account for the JOECH TUTOR
                    platform.
                  </p>
                </div>
              </div>

              <form
                onSubmit={addStudent}
              >
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="fullName">
                      Full Name
                    </label>

                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) =>
                        setFullName(
                          e.target.value
                        )
                      }
                      placeholder="Student full name"
                      className="input"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="email">
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      placeholder="student@example.com"
                      className="input"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="password">
                      Password
                    </label>

                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      placeholder="Minimum 8 characters"
                      className="input"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="grade">
                      Grade
                    </label>

                    <select
                      id="grade"
                      value={grade}
                      onChange={(e) =>
                        setGrade(
                          e.target.value
                        )
                      }
                      className="input"
                    >
                      <option value="">
                        Select grade
                      </option>

                      <option value="5">
                        Grade 5
                      </option>

                      <option value="6">
                        Grade 6
                      </option>

                      <option value="7">
                        Grade 7
                      </option>

                      <option value="8">
                        Grade 8
                      </option>

                      <option value="9">
                        Grade 9
                      </option>
                    </select>
                  </div>
                </div>

                <div className="form-footer">
                  <span className="security-note">
                    🔒 Student accounts are
                    created securely.
                  </span>

                  <button
                    type="submit"
                    disabled={saving}
                    className="button button-primary"
                  >
                    {saving
                      ? 'Creating Student...'
                      : 'Add Student'}
                  </button>
                </div>
              </form>

              {message && (
                <div className="message">
                  ✓ {message}
                </div>
              )}

              {error && (
                <div className="message error">
                  {error}
                </div>
              )}
            </section>

            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>
                    Registered Students
                  </h2>

                  <p>
                    View students currently
                    registered on the platform.
                  </p>
                </div>

                <span className="count-badge">
                  {students.length}{' '}
                  {students.length === 1
                    ? 'Student'
                    : 'Students'}
                </span>
              </div>

              {loading ? (
                <div className="loading">
                  Loading students...
                </div>
              ) : students.length === 0 ? (
                <div className="empty">
                  <strong>
                    No students registered yet.
                  </strong>
                  <br />
                  Use the form above to add
                  your first student.
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>
                          Student
                        </th>

                        <th>
                          Email
                        </th>

                        <th>
                          Grade
                        </th>

                        <th>
                          Date Added
                        </th>

                        <th>
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {students.map(
                        (student) => {
                          const name =
                            student
                              .profiles
                              ?.full_name ||
                            'Student'

                          const email =
                            student
                              .profiles
                              ?.email ||
                            '—'

                          const initials =
                            name
                              .split(' ')
                              .map(
                                (part) =>
                                  part[0]
                              )
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()

                          return (
                            <tr
                              key={
                                student.id
                              }
                            >
                              <td>
                                <div className="student-cell">
                                  <div className="avatar">
                                    {initials ||
                                      'S'}
                                  </div>

                                  <div>
                                    <div className="student-name">
                                      {name}
                                    </div>

                                    <div className="student-email">
                                      Student
                                      Account
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <span className="date-text">
                                  {email}
                                </span>
                              </td>

                              <td>
                                <span className="grade-tag">
                                  Grade{' '}
                                  {
                                    student.grade
                                  }
                                </span>
                              </td>

                              <td>
                                <span className="date-text">
                                  {new Date(
                                    student.created_at
                                  ).toLocaleDateString()}
                                </span>
                              </td>

                              <td>
                                <Link
                                  href={`/dashboard/students/${student.id}`}
                                  className="button button-secondary"
                                >
                                  View Profile
                                </Link>
                              </td>
                            </tr>
                          )
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </main>
        </div>

        <footer className="footer">
          JOECH TUTOR • Excellence Beyond Borders
        </footer>
      </div>
    </>
  )
}