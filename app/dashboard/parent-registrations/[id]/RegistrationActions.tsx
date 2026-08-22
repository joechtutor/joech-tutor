'use client'

import Link from 'next/link'
import { useState } from 'react'

type RegistrationActionsProps = {
  registrationId: string
  currentStatus: string
  studentName: string
  currentGradeClass: string | null
}

const statusOptions = [
  {
    value: 'under_review',
    label: 'Mark Under Review',
  },
  {
    value: 'approved',
    label: 'Approve Registration',
  },
  {
    value: 'rejected',
    label: 'Reject Registration',
  },
]

function extractGrade(
  value: string | null
): string | null {
  if (!value) {
    return null
  }

  const match = value.match(
    /\b(?:grade|year|class)\s*([5-9])\b/i
  )

  if (match?.[1]) {
    return match[1]
  }

  const standaloneMatch =
    value.match(/\b([5-9])\b/)

  if (standaloneMatch?.[1]) {
    return standaloneMatch[1]
  }

  return null
}

export default function RegistrationActions({
  registrationId,
  currentStatus,
  studentName,
  currentGradeClass,
}: RegistrationActionsProps) {
  const [status, setStatus] =
    useState(currentStatus)

  const [adminNotes, setAdminNotes] =
    useState('')

  const [saving, setSaving] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [error, setError] =
    useState('')

  async function updateStatus(
    nextStatus: string
  ) {
    const actionLabel =
      nextStatus === 'approved'
        ? 'approve this registration'
        : nextStatus === 'rejected'
          ? 'reject this registration'
          : 'mark this registration as under review'

    const confirmed =
      window.confirm(
        `Are you sure you want to ${actionLabel}?`
      )

    if (!confirmed) {
      return
    }

    try {
      setSaving(true)
      setMessage('')
      setError('')

      const response =
        await fetch(
          '/api/parent-registrations',
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              id: registrationId,
              status: nextStatus,
              admin_notes:
                adminNotes.trim(),
            }),
          }
        )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result?.error ||
            'Unable to update registration.'
        )
      }

      setStatus(
        result.registration?.status ||
          nextStatus
      )

      setMessage(
        nextStatus === 'approved'
          ? 'Registration approved successfully.'
          : nextStatus === 'rejected'
            ? 'Registration rejected.'
            : 'Registration marked as under review.'
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update registration.'
      )
    } finally {
      setSaving(false)
    }
  }

  const isUnderReview =
    status === 'under_review'

  const isApproved =
    status === 'approved'

  const isRejected =
    status === 'rejected'

  const isStudentCreated =
    status === 'student_created'

  const grade =
    extractGrade(
      currentGradeClass
    )

  const canCreateStudent =
    isApproved &&
    !isStudentCreated &&
    Boolean(
      studentName.trim()
    ) &&
    Boolean(grade)

  const createStudentUrl =
    canCreateStudent
      ? `/dashboard/students?parent_registration_id=${encodeURIComponent(
          registrationId
        )}&student_name=${encodeURIComponent(
          studentName
        )}&grade=${encodeURIComponent(
          grade as string
        )}`
      : '#'

  return (
    <section className="actionsSection">
      <style jsx>{`
        .actionsSection {
          margin-bottom: 20px;
          padding: 22px;
          border: 1px solid #e4e7ec;
          border-radius: 16px;
          background: #ffffff;
          box-shadow:
            0 4px 16px
              rgba(16, 24, 40, 0.04);
        }

        .heading {
          margin-bottom: 18px;
        }

        .title {
          margin: 0;
          color: #172033;
          font-size: 18px;
          font-weight: 800;
        }

        .subtitle {
          margin: 6px 0 0;
          color: #667085;
          font-size: 13px;
          line-height: 1.6;
        }

        .notesLabel {
          display: block;
          margin-bottom: 7px;
          color: #344054;
          font-size: 12px;
          font-weight: 800;
        }

        .notes {
          width: 100%;
          min-height: 95px;
          padding: 11px 12px;
          border: 1px solid #d9dee8;
          border-radius: 10px;
          background: #ffffff;
          color: #101828;
          font-size: 13px;
          line-height: 1.5;
          outline: none;
          resize: vertical;
        }

        .notes:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 3px
              rgba(37, 99, 235, 0.1);
        }

        .buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .button {
          min-height: 42px;
          padding: 0 15px;
          border: 0;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform 0.18s ease,
            opacity 0.18s ease;
        }

        .button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .review {
          background: #e8f1ff;
          color: #175cd3;
        }

        .approve {
          background: #087443;
          color: #ffffff;
        }

        .reject {
          background: #b42318;
          color: #ffffff;
        }

        .create {
          background:
            linear-gradient(
              135deg,
              #4d2a9a 0%,
              #7048b7 100%
            );
          color: #ffffff;
          box-shadow:
            0 8px 18px
              rgba(77, 42, 154, 0.2);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .create:hover {
          color: #ffffff;
        }

        .current {
          margin-top: 14px;
          color: #667085;
          font-size: 12px;
        }

        .success {
          margin-top: 14px;
          padding: 11px 13px;
          border: 1px solid #ccebd5;
          border-radius: 9px;
          background: #edf9f1;
          color: #24733d;
          font-size: 12px;
          font-weight: 700;
        }

        .error {
          margin-top: 14px;
          padding: 11px 13px;
          border: 1px solid #f4cccc;
          border-radius: 9px;
          background: #fff1f1;
          color: #b42323;
          font-size: 12px;
          font-weight: 700;
        }

        .nextStep {
          margin-top: 18px;
          padding: 14px;
          border: 1px solid #dbe8f8;
          border-radius: 10px;
          background: #eef6ff;
          color: #24527d;
          font-size: 12px;
          line-height: 1.6;
        }

        .warning {
          margin-top: 12px;
          padding: 12px 14px;
          border: 1px solid #f2dfad;
          border-radius: 9px;
          background: #fffaf0;
          color: #7a5700;
          font-size: 12px;
          line-height: 1.6;
        }

        .successLabel {
          display: block;
          margin-bottom: 8px;
          color: #087443;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      `}</style>

      <div className="heading">
        <h2 className="title">
          Registration Actions
        </h2>

        <p className="subtitle">
          Review this registration and update
          its status.
        </p>
      </div>

      <label
        htmlFor="admin-notes"
        className="notesLabel"
      >
        Admin Notes
      </label>

      <textarea
        id="admin-notes"
        className="notes"
        value={adminNotes}
        onChange={(event) =>
          setAdminNotes(
            event.target.value
          )
        }
        placeholder="Add an internal note about this registration..."
        disabled={saving}
      />

      <div className="buttons">
        <button
          type="button"
          className="button review"
          onClick={() =>
            updateStatus(
              'under_review'
            )
          }
          disabled={
            saving ||
            isUnderReview ||
            isStudentCreated
          }
        >
          {saving
            ? 'Saving...'
            : 'Mark Under Review'}
        </button>

        <button
          type="button"
          className="button approve"
          onClick={() =>
            updateStatus(
              'approved'
            )
          }
          disabled={
            saving ||
            isApproved ||
            isStudentCreated
          }
        >
          {saving
            ? 'Saving...'
            : 'Approve Registration'}
        </button>

        <button
          type="button"
          className="button reject"
          onClick={() =>
            updateStatus(
              'rejected'
            )
          }
          disabled={
            saving ||
            isRejected ||
            isStudentCreated
          }
        >
          {saving
            ? 'Saving...'
            : 'Reject Registration'}
        </button>

        {canCreateStudent && (
          <Link
            href={createStudentUrl}
            className="button create"
          >
            Create Student Account →
          </Link>
        )}
      </div>

      <div className="current">
        Current status:{' '}
        <strong>
          {status === 'new'
            ? 'New'
            : status ===
                'under_review'
              ? 'Under Review'
              : status === 'approved'
                ? 'Approved'
                : status ===
                    'rejected'
                  ? 'Rejected'
                  : status ===
                      'student_created'
                    ? 'Student Created'
                    : status}
        </strong>
      </div>

      {message && (
        <div className="success">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {isApproved &&
        !isStudentCreated && (
          <>
            {canCreateStudent ? (
              <div className="nextStep">
                <strong>
                  Next step:
                </strong>{' '}
                The registration is approved.
                Click{' '}
                <strong>
                  Create Student Account
                </strong>{' '}
                to open the existing Student
                Management form with the student's
                name and grade already filled in.
              </div>
            ) : (
              <div className="warning">
                <strong>
                  Student account creation needs attention:
                </strong>{' '}
                the registration grade could not be
                safely mapped to Grade 5–9. Review the
                submitted grade/class before creating
                the student account.
              </div>
            )}
          </>
        )}

      {isStudentCreated && (
        <div className="nextStep">
          <span className="successLabel">
            Student Account Created
          </span>

          This registration has already been linked to
          a JOECH TUTOR student account.
        </div>
      )}
    </section>
  )
}