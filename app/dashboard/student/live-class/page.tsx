'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'

export default function StudentLiveClassJoinPage() {
  const [classCode, setClassCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError('')

    const cleanCode = classCode.trim().toUpperCase()

    if (!cleanCode) {
      setError('Please enter a class code.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `/api/live-classes/join?code=${encodeURIComponent(
          cleanCode
        )}`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Unable to find this live class.'
        )
      }

      if (!data.liveClass?.id) {
        throw new Error(
          'The live class could not be identified.'
        )
      }

      window.location.href =
        `/dashboard/student/live-class/${data.liveClass.id}`
    } catch (err) {
      console.error(
        'Live class join error:',
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to join live class.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          background: #f4f7fb;
          color: #172033;
        }

        .join-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(
              circle at 10% 10%,
              rgba(11, 94, 215, 0.09),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 90%,
              rgba(8, 43, 89, 0.08),
              transparent 30%
            ),
            #f4f7fb;
        }

        .join-header {
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 38px;
          background: #ffffff;
          border-bottom: 1px solid #e5eaf1;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .brand-logo {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 10px;
          box-shadow:
            0 5px 15px rgba(8, 43, 89, 0.15);
        }

        .brand-name {
          margin: 0;
          color: #082b59;
          font-family: Georgia, serif;
          font-size: 21px;
          font-weight: 800;
        }

        .brand-motto {
          margin: 2px 0 0;
          color: #718096;
          font-size: 10px;
        }

        .header-label {
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
        }

        .join-content {
          flex: 1;
          display: grid;
          place-items: center;
          padding: 50px 20px;
        }

        .join-card {
          width: 100%;
          max-width: 560px;
          background: #ffffff;
          border: 1px solid #e5eaf1;
          border-radius: 24px;
          padding: 42px;
          box-shadow:
            0 18px 50px rgba(15, 23, 42, 0.08);
        }

        .live-icon {
          width: 76px;
          height: 76px;
          margin: 0 auto 20px;
          display: grid;
          place-items: center;
          border-radius: 22px;
          background:
            linear-gradient(
              135deg,
              #082b59,
              #0b5ed7
            );
          color: #ffffff;
          font-size: 35px;
          box-shadow:
            0 12px 25px rgba(11, 94, 215, 0.22);
        }

        .join-heading {
          text-align: center;
        }

        .join-heading h1 {
          margin: 0;
          color: #082b59;
          font-size: 30px;
          letter-spacing: -0.7px;
        }

        .join-heading p {
          margin: 10px auto 0;
          max-width: 410px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .live-status {
          width: fit-content;
          margin: 20px auto 30px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 12px;
          border-radius: 30px;
          background: #ecfdf3;
          color: #15803d;
          font-size: 11px;
          font-weight: 800;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow:
            0 0 0 4px rgba(34, 197, 94, 0.12);
        }

        .field-label {
          display: block;
          margin-bottom: 8px;
          color: #263449;
          font-size: 12px;
          font-weight: 800;
        }

        .code-input {
          width: 100%;
          min-height: 58px;
          border: 2px solid #d7dee8;
          border-radius: 13px;
          outline: none;
          padding: 12px 16px;
          background: #f9fafc;
          color: #082b59;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: 3px;
          text-align: center;
          transition: 0.2s ease;
        }

        .code-input::placeholder {
          color: #a0a9b7;
          font-size: 15px;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .code-input:focus {
          background: #ffffff;
          border-color: #0b5ed7;
          box-shadow:
            0 0 0 4px rgba(11, 94, 215, 0.1);
        }

        .error-box {
          margin-top: 14px;
          padding: 13px 15px;
          border: 1px solid #fecaca;
          border-radius: 11px;
          background: #fff1f2;
          color: #b91c1c;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 600;
        }

        .join-button {
          width: 100%;
          min-height: 52px;
          margin-top: 18px;
          border: 0;
          border-radius: 12px;
          background:
            linear-gradient(
              135deg,
              #082b59,
              #0b5ed7
            );
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow:
            0 10px 22px rgba(11, 94, 215, 0.2);
          transition: 0.2s ease;
        }

        .join-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow:
            0 13px 27px rgba(11, 94, 215, 0.26);
        }

        .join-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .help-box {
          margin-top: 25px;
          padding: 16px;
          border-radius: 13px;
          background: #f5f8fc;
          border: 1px solid #e6ebf2;
          text-align: center;
        }

        .help-box strong {
          display: block;
          color: #334155;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .help-box span {
          color: #7b8797;
          font-size: 11px;
          line-height: 1.5;
        }

        .back-link {
          display: block;
          margin-top: 22px;
          color: #0b5ed7;
          text-align: center;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .join-footer {
          padding: 20px;
          text-align: center;
          color: #8994a5;
          font-size: 10px;
        }

        @media (max-width: 650px) {
          .join-header {
            padding: 0 18px;
          }

          .header-label {
            display: none;
          }

          .join-content {
            padding: 30px 15px;
          }

          .join-card {
            padding: 30px 22px;
            border-radius: 20px;
          }

          .join-heading h1 {
            font-size: 26px;
          }

          .code-input {
            font-size: 18px;
          }
        }
      `}</style>

      <div className="join-page">
        <header className="join-header">
          <Link
            href="/dashboard/student"
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

          <span className="header-label">
            STUDENT PORTAL
          </span>
        </header>

        <main className="join-content">
          <section className="join-card">
            <div className="live-icon">
              🎥
            </div>

            <div className="join-heading">
              <h1>
                Join Live Class
              </h1>

              <p>
                Enter the live class code provided
                by your teacher to join your virtual
                classroom.
              </p>
            </div>

            <div className="live-status">
              <span className="status-dot" />
              LIVE CLASSROOM
            </div>

            <form onSubmit={handleSubmit}>
              <label
                htmlFor="classCode"
                className="field-label"
              >
                Class Code
              </label>

              <input
                id="classCode"
                type="text"
                value={classCode}
                onChange={(event) =>
                  setClassCode(
                    event.target.value
                      .toUpperCase()
                      .replace(/\s/g, '')
                  )
                }
                placeholder="e.g. JOECH-BPWX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={20}
                className="code-input"
                disabled={loading}
              />

              {error && (
                <div className="error-box">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="join-button"
              >
                {loading
                  ? 'Finding Live Class...'
                  : 'Join Live Class →'}
              </button>
            </form>

            <div className="help-box">
              <strong>
                Don't have a class code?
              </strong>

              <span>
                Ask your teacher for the live class
                code before attempting to join.
              </span>
            </div>

            <Link
              href="/dashboard/student"
              className="back-link"
            >
              ← Back to Student Dashboard
            </Link>
          </section>
        </main>

        <footer className="join-footer">
          JOECH TUTOR • Excellence Beyond Borders
        </footer>
      </div>
    </>
  )
}