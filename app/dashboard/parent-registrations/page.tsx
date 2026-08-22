'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Registration = {
  id: string
  parent_full_name: string
  relationship_to_student: string | null
  parent_email: string
  phone_whatsapp: string | null
  country: string | null
  city: string | null
  student_full_name: string
  student_date_of_birth: string | null
  student_gender: string | null
  school_name: string | null
  current_grade_class: string | null
  curriculum: string | null
  subjects: string[] | null
  priority_subject: string | null
  academic_performance: string | null
  academic_goals: string | null
  status: string
  submitted_at: string
  admin_notes: string | null
}

const statusLabels: Record<string, string> = {
  new: 'New',
  under_review: 'Under Review',
  approved: 'Approved',
  student_created: 'Student Created',
  rejected: 'Rejected',
}

function formatDate(value: string) {
  if (!value) return '—'

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function statusClass(status: string) {
  switch (status) {
    case 'new':
      return 'status-new'
    case 'under_review':
      return 'status-review'
    case 'approved':
      return 'status-approved'
    case 'student_created':
      return 'status-created'
    case 'rejected':
      return 'status-rejected'
    default:
      return 'status-default'
  }
}

export default function ParentRegistrationsPage() {
  const [registrations, setRegistrations] = useState<
    Registration[]
  >([])

  const [loading, setLoading] = useState(true)

  const [deletingId, setDeletingId] = useState<
    string | null
  >(null)

  const [error, setError] = useState('')

  const [search, setSearch] = useState('')

  const [statusFilter, setStatusFilter] =
    useState('all')

  const [message, setMessage] = useState('')

  async function loadRegistrations() {
    try {
      setLoading(true)
      setError('')
      setMessage('')

      const response = await fetch(
        '/api/parent-registrations',
        {
          method: 'GET',
          cache: 'no-store',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Unable to load registrations.'
        )
      }

      setRegistrations(
        data.registrations || []
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load registrations.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRegistrations()
  }, [])

  async function deleteRegistration(
    registration: Registration
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the registration for ${registration.student_full_name} submitted by ${registration.parent_full_name}?\n\nThis action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(registration.id)
      setError('')
      setMessage('')

      const response = await fetch(
        `/api/parent-registrations?id=${encodeURIComponent(
          registration.id
        )}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Unable to delete registration.'
        )
      }

      setRegistrations(
        (currentRegistrations) =>
          currentRegistrations.filter(
            (item) =>
              item.id !== registration.id
          )
      )

      setMessage(
        data?.message ||
          'Registration deleted successfully.'
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete registration.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const filteredRegistrations = useMemo(() => {
    const query = search.trim().toLowerCase()

    return registrations.filter(
      (registration) => {
        const matchesStatus =
          statusFilter === 'all' ||
          registration.status ===
            statusFilter

        if (!matchesStatus) return false

        if (!query) return true

        return [
          registration.parent_full_name,
          registration.parent_email,
          registration.phone_whatsapp,
          registration.student_full_name,
          registration.school_name,
          registration.current_grade_class,
          registration.priority_subject,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          )
      }
    )
  }, [
    registrations,
    search,
    statusFilter,
  ])

  return (
    <main className="page">
      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f5f7fb;
          padding: 28px;
          color: #172033;
        }

        .container {
          max-width: 1500px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .title {
          margin: 0;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .subtitle {
          margin: 8px 0 0;
          color: #667085;
          font-size: 15px;
        }

        .back {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid #d9dee8;
          color: #344054;
          text-decoration: none;
          font-weight: 700;
        }

        .back:hover {
          background: #f9fafb;
        }

        .toolbar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .search {
          flex: 1;
          min-width: 280px;
          height: 44px;
          padding: 0 14px;
          border: 1px solid #d9dee8;
          border-radius: 10px;
          background: #ffffff;
          font-size: 14px;
          outline: none;
        }

        .search:focus {
          border-color: #2563eb;
          box-shadow:
            0 0 0 3px
              rgba(37, 99, 235, 0.1);
        }

        .select {
          height: 44px;
          min-width: 180px;
          padding: 0 12px;
          border: 1px solid #d9dee8;
          border-radius: 10px;
          background: #ffffff;
          font-size: 14px;
          outline: none;
        }

        .refresh {
          height: 44px;
          padding: 0 16px;
          border: 0;
          border-radius: 10px;
          background: #0b5ed7;
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
        }

        .refresh:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .card {
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 16px;
          box-shadow:
            0 4px 16px
              rgba(16, 24, 40, 0.05);
        }

        .tableWrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 1250px;
          border-collapse: collapse;
        }

        th {
          padding: 15px 16px;
          background: #f8fafc;
          color: #475467;
          text-align: left;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
          border-bottom: 1px solid #eaecf0;
        }

        td {
          padding: 16px;
          border-bottom: 1px solid #f0f2f5;
          vertical-align: top;
          font-size: 14px;
        }

        tr:last-child td {
          border-bottom: 0;
        }

        .parentName,
        .studentName {
          font-weight: 750;
          color: #101828;
        }

        .secondary {
          margin-top: 4px;
          color: #667085;
          font-size: 12px;
        }

        .status {
          display: inline-flex;
          align-items: center;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .status-new {
          background: #fff4cc;
          color: #8a5a00;
        }

        .status-review {
          background: #e8f1ff;
          color: #175cd3;
        }

        .status-approved {
          background: #e8f7ee;
          color: #087443;
        }

        .status-created {
          background: #e9e7ff;
          color: #53389e;
        }

        .status-rejected {
          background: #feeceb;
          color: #b42318;
        }

        .status-default {
          background: #f2f4f7;
          color: #475467;
        }

        .actions {
          white-space: nowrap;
        }

        .actionGroup {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .viewButton,
        .deleteButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 36px;
          padding: 0 13px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 800;
          transition:
            transform 0.18s ease,
            background 0.18s ease,
            opacity 0.18s ease;
        }

        .viewButton {
          background: #0b5ed7;
          color: #ffffff;
          text-decoration: none;
        }

        .viewButton:hover {
          background: #084da8;
          transform: translateY(-1px);
        }

        .deleteButton {
          border: 1px solid #efcaca;
          background: #fff1f1;
          color: #b42318;
          cursor: pointer;
        }

        .deleteButton:hover:not(:disabled) {
          background: #ffe1e1;
          border-color: #e4aaaa;
          transform: translateY(-1px);
        }

        .deleteButton:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .successMessage {
          margin-bottom: 16px;
          padding: 12px 14px;
          border: 1px solid #ccebd5;
          border-radius: 10px;
          background: #edf9f1;
          color: #24733d;
          font-size: 13px;
          font-weight: 700;
        }

        .empty,
        .loading,
        .error {
          padding: 50px 24px;
          text-align: center;
        }

        .emptyTitle {
          font-size: 17px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .emptyText {
          color: #667085;
          font-size: 14px;
        }

        .error {
          color: #b42318;
          background: #fff6f5;
        }

        .count {
          padding: 14px 16px;
          color: #667085;
          font-size: 13px;
          border-bottom: 1px solid #eaecf0;
        }

        @media (max-width: 700px) {
          .page {
            padding: 18px;
          }

          .header {
            flex-direction: column;
          }

          .title {
            font-size: 25px;
          }

          .back {
            width: 100%;
          }

          .actionGroup {
            flex-direction: column;
            align-items: stretch;
          }

          .viewButton,
          .deleteButton {
            width: 100%;
          }
        }
      `}</style>

      <div className="container">
        <div className="header">
          <div>
            <h1 className="title">
              Parent Registrations
            </h1>

            <p className="subtitle">
              Review and manage parent and ward
              registration submissions.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="back"
          >
            ← Dashboard
          </Link>
        </div>

        <div className="toolbar">
          <input
            className="search"
            type="search"
            placeholder="Search parent, student, email, school..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          <select
            className="select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="all">
              All statuses
            </option>

            <option value="new">
              New
            </option>

            <option value="under_review">
              Under Review
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="student_created">
              Student Created
            </option>

            <option value="rejected">
              Rejected
            </option>
          </select>

          <button
            type="button"
            className="refresh"
            onClick={
              loadRegistrations
            }
            disabled={loading}
          >
            {loading
              ? 'Loading...'
              : 'Refresh'}
          </button>
        </div>

        {message && (
          <div className="successMessage">
            ✓ {message}
          </div>
        )}

        <section className="card">
          <div className="count">
            Showing{' '}
            {filteredRegistrations.length}{' '}
            of{' '}
            {registrations.length}{' '}
            registration
            {registrations.length === 1
              ? ''
              : 's'}
          </div>

          {loading ? (
            <div className="loading">
              Loading parent registrations...
            </div>
          ) : error ? (
            <div className="error">
              {error}
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="empty">
              <div className="emptyTitle">
                No registrations found
              </div>

              <div className="emptyText">
                There are no registrations
                matching your current search or
                filter.
              </div>
            </div>
          ) : (
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      Parent / Guardian
                    </th>

                    <th>
                      Student / Ward
                    </th>

                    <th>
                      Academic Information
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Submitted
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRegistrations.map(
                    (registration) => {
                      const isDeleting =
                        deletingId ===
                        registration.id

                      return (
                        <tr
                          key={
                            registration.id
                          }
                        >
                          <td>
                            <div className="parentName">
                              {
                                registration.parent_full_name
                              }
                            </div>

                            <div className="secondary">
                              {registration.relationship_to_student ||
                                'Relationship not specified'}
                            </div>
                          </td>

                          <td>
                            <div className="studentName">
                              {
                                registration.student_full_name
                              }
                            </div>

                            <div className="secondary">
                              {registration.current_grade_class ||
                                'Grade not specified'}
                            </div>

                            <div className="secondary">
                              {registration.school_name ||
                                'School not specified'}
                            </div>
                          </td>

                          <td>
                            <div>
                              {registration.priority_subject ||
                                'No priority subject specified'}
                            </div>

                            <div className="secondary">
                              {registration.curriculum ||
                                'Curriculum not specified'}
                            </div>
                          </td>

                          <td>
                            <div>
                              {
                                registration.parent_email
                              }
                            </div>

                            <div className="secondary">
                              {registration.phone_whatsapp ||
                                'Phone not provided'}
                            </div>

                            <div className="secondary">
                              {[
                                registration.city,
                                registration.country,
                              ]
                                .filter(Boolean)
                                .join(', ') ||
                                'Location not specified'}
                            </div>
                          </td>

                          <td>
                            <span
                              className={`status ${statusClass(
                                registration.status
                              )}`}
                            >
                              {statusLabels[
                                registration.status
                              ] ||
                                registration.status}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              registration.submitted_at
                            )}
                          </td>

                          <td className="actions">
                            <div className="actionGroup">
                              <Link
                                href={`/dashboard/parent-registrations/${registration.id}`}
                                className="viewButton"
                              >
                                View
                              </Link>

                              <button
                                type="button"
                                className="deleteButton"
                                onClick={() =>
                                  deleteRegistration(
                                    registration
                                  )
                                }
                                disabled={
                                  isDeleting ||
                                  deletingId !==
                                    null
                                }
                              >
                                {isDeleting
                                  ? 'Deleting...'
                                  : 'Delete'}
                              </button>
                            </div>
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
      </div>
    </main>
  )
}