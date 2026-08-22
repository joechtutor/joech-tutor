import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseServer } from '../../../../lib/supabase-server'
import RegistrationActions from './RegistrationActions'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

type Registration = {
  id: string
  parent_full_name: string
  relationship_to_student: string | null
  parent_email: string
  phone_whatsapp: string | null
  country: string | null
  city: string | null
  preferred_communication: string | null

  student_full_name: string
  student_date_of_birth: string | null
  student_gender: string | null
  school_name: string | null
  current_grade_class: string | null
  curriculum: string | null
  other_curriculum: string | null

  subjects: string[] | null
  other_subject: string | null
  priority_subject: string | null
  academic_performance: string | null
  difficult_areas: string | null
  academic_goals: string | null
  learning_needs: string | null

  upcoming_exam_or_assessment: string | null
  examination_name: string | null
  examination_date: string | null
  initial_academic_assessment: boolean | null

  tutoring_type: string | null
  lesson_format: string | null
  lessons_per_week: string | null
  lesson_duration: string | null
  preferred_days: string[] | null
  preferred_time: string | null
  timezone: string | null
  other_timezone: string | null

  previous_tutoring: boolean | null
  previous_tutoring_type: string | null
  previous_tutoring_feedback: string | null

  parent_expectations: string | null
  progress_update_preference: string | null

  additional_student_information: string | null
  how_heard_about_joech_tutor: string | null
  other_referral_source: string | null

  parent_guardian_consent: boolean
  communication_consent: boolean

  additional_discussion: string | null
  preferred_next_step: string | null

  status: string
  admin_notes: string | null
  created_student_id: string | null
  submitted_at: string
  reviewed_at: string | null
}

function displayValue(value: unknown) {
  if (value === null || value === undefined) {
    return 'Not provided'
  }

  if (typeof value === 'string' && value.trim() === '') {
    return 'Not provided'
  }

  return String(value)
}

function displayBoolean(value: boolean | null) {
  return value ? 'Yes' : 'No'
}

function displayArray(value: string[] | null) {
  if (!value || value.length === 0) {
    return 'Not provided'
  }

  return value.join(', ')
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Not provided'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Not provided'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabel(status: string) {
  switch (status) {
    case 'new':
      return 'New'
    case 'under_review':
      return 'Under Review'
    case 'approved':
      return 'Approved'
    case 'student_created':
      return 'Student Created'
    case 'rejected':
      return 'Rejected'
    default:
      return status
  }
}

function statusClass(status: string) {
  switch (status) {
    case 'new':
      return 'statusNew'
    case 'under_review':
      return 'statusReview'
    case 'approved':
      return 'statusApproved'
    case 'student_created':
      return 'statusCreated'
    case 'rejected':
      return 'statusRejected'
    default:
      return 'statusDefault'
  }
}

export default async function ParentRegistrationDetailsPage({
  params,
}: PageProps) {
  const { id } = await params

  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role

  if (role !== 'admin' && role !== 'teacher') {
    notFound()
  }

  const { data: registration, error } = await supabase
    .from('parent_registrations')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !registration) {
    notFound()
  }

  const item = registration as Registration

  return (
    <main className="page">
      <style>{`
        .page {
          min-height: 100vh;
          background: #f5f7fb;
          padding: 28px;
          color: #172033;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .topbar {
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
          font-size: 14px;
          line-height: 1.6;
        }

        .back {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 0 16px;
          border: 1px solid #d9dee8;
          border-radius: 10px;
          background: #ffffff;
          color: #344054;
          text-decoration: none;
          font-weight: 700;
          white-space: nowrap;
        }

        .back:hover {
          background: #f9fafb;
        }

        .summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 20px;
          padding: 18px 20px;
          border: 1px solid #e4e7ec;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 4px 16px rgba(16, 24, 40, 0.04);
        }

        .summaryLeft {
          min-width: 0;
        }

        .studentName {
          margin: 0;
          font-size: 21px;
          font-weight: 800;
          color: #101828;
        }

        .parentSummary {
          margin: 5px 0 0;
          color: #667085;
          font-size: 13px;
        }

        .status {
          display: inline-flex;
          align-items: center;
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          white-space: nowrap;
        }

        .statusNew {
          background: #fff4cc;
          color: #8a5a00;
        }

        .statusReview {
          background: #e8f1ff;
          color: #175cd3;
        }

        .statusApproved {
          background: #e8f7ee;
          color: #087443;
        }

        .statusCreated {
          background: #e9e7ff;
          color: #53389e;
        }

        .statusRejected {
          background: #feeceb;
          color: #b42318;
        }

        .statusDefault {
          background: #f2f4f7;
          color: #475467;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .section {
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(16, 24, 40, 0.04);
        }

        .sectionFull {
          grid-column: 1 / -1;
        }

        .sectionHeader {
          padding: 18px 20px;
          border-bottom: 1px solid #eaecf0;
          background: #f8fafc;
        }

        .sectionTitle {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: #172033;
        }

        .sectionBody {
          padding: 20px;
        }

        .detailsGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px 24px;
        }

        .detail {
          min-width: 0;
        }

        .label {
          display: block;
          margin-bottom: 5px;
          color: #667085;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .value {
          color: #101828;
          font-size: 14px;
          line-height: 1.6;
          word-break: break-word;
        }

        .longValue {
          white-space: pre-wrap;
        }

        .full {
          grid-column: 1 / -1;
        }

        .meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .metaItem {
          padding: 14px;
          border: 1px solid #eaecf0;
          border-radius: 12px;
          background: #fcfcfd;
        }

        .metaLabel {
          display: block;
          margin-bottom: 4px;
          color: #667085;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .metaValue {
          color: #172033;
          font-size: 13px;
          font-weight: 700;
        }

        @media (max-width: 800px) {
          .page {
            padding: 18px;
          }

          .topbar,
          .summary {
            flex-direction: column;
            align-items: stretch;
          }

          .back {
            width: 100%;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .sectionFull {
            grid-column: auto;
          }

          .detailsGrid,
          .meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="container">
        <div className="topbar">
          <div>
            <h1 className="title">
              Parent Registration Details
            </h1>

            <p className="subtitle">
              Review the complete registration submitted for
              this student/ward.
            </p>
          </div>

          <Link
            href="/dashboard/parent-registrations"
            className="back"
          >
            ← Back to Registrations
          </Link>
        </div>

        <div className="summary">
          <div className="summaryLeft">
            <h2 className="studentName">
              {item.student_full_name}
            </h2>

            <p className="parentSummary">
              Registered by {item.parent_full_name}
            </p>
          </div>

          <span
            className={`status ${statusClass(item.status)}`}
          >
            {statusLabel(item.status)}
          </span>
        </div>

        <RegistrationActions
          registrationId={item.id}
          currentStatus={item.status}
          studentName={item.student_full_name}
          currentGradeClass={item.current_grade_class}
        />

        <div className="grid">
          <section className="section">
            <div className="sectionHeader">
              <h2 className="sectionTitle">
                Parent / Guardian Information
              </h2>
            </div>

            <div className="sectionBody">
              <div className="detailsGrid">
                <div className="detail">
                  <span className="label">
                    Full Name
                  </span>
                  <div className="value">
                    {displayValue(item.parent_full_name)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Relationship
                  </span>
                  <div className="value">
                    {displayValue(item.relationship_to_student)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Email
                  </span>
                  <div className="value">
                    {displayValue(item.parent_email)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    WhatsApp / Phone
                  </span>
                  <div className="value">
                    {displayValue(item.phone_whatsapp)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Country
                  </span>
                  <div className="value">
                    {displayValue(item.country)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    City
                  </span>
                  <div className="value">
                    {displayValue(item.city)}
                  </div>
                </div>

                <div className="detail full">
                  <span className="label">
                    Preferred Communication
                  </span>
                  <div className="value">
                    {displayValue(item.preferred_communication)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="sectionHeader">
              <h2 className="sectionTitle">
                Student / Ward Information
              </h2>
            </div>

            <div className="sectionBody">
              <div className="detailsGrid">
                <div className="detail">
                  <span className="label">
                    Full Name
                  </span>
                  <div className="value">
                    {displayValue(item.student_full_name)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Date of Birth
                  </span>
                  <div className="value">
                    {formatDate(item.student_date_of_birth)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Gender
                  </span>
                  <div className="value">
                    {displayValue(item.student_gender)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Grade / Class / Year
                  </span>
                  <div className="value">
                    {displayValue(item.current_grade_class)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    School
                  </span>
                  <div className="value">
                    {displayValue(item.school_name)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Curriculum
                  </span>
                  <div className="value">
                    {displayValue(item.curriculum)}
                  </div>
                </div>

                <div className="detail full">
                  <span className="label">
                    Other Curriculum
                  </span>
                  <div className="value">
                    {displayValue(item.other_curriculum)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section sectionFull">
            <div className="sectionHeader">
              <h2 className="sectionTitle">
                Academic Needs
              </h2>
            </div>

            <div className="sectionBody">
              <div className="detailsGrid">
                <div className="detail">
                  <span className="label">
                    Subjects
                  </span>
                  <div className="value">
                    {displayArray(item.subjects)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Priority Subject
                  </span>
                  <div className="value">
                    {displayValue(item.priority_subject)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Academic Performance
                  </span>
                  <div className="value">
                    {displayValue(item.academic_performance)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Other Subject
                  </span>
                  <div className="value">
                    {displayValue(item.other_subject)}
                  </div>
                </div>

                <div className="detail full">
                  <span className="label">
                    Difficult Areas
                  </span>
                  <div className="value longValue">
                    {displayValue(item.difficult_areas)}
                  </div>
                </div>

                <div className="detail full">
                  <span className="label">
                    Academic Goals
                  </span>
                  <div className="value longValue">
                    {displayValue(item.academic_goals)}
                  </div>
                </div>

                <div className="detail full">
                  <span className="label">
                    Additional Learning Needs
                  </span>
                  <div className="value longValue">
                    {displayValue(item.learning_needs)}
                  </div>
                </div>

                <div className="detail full">
                  <span className="label">
                    Additional Student Information
                  </span>
                  <div className="value longValue">
                    {displayValue(
                      item.additional_student_information
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="sectionHeader">
              <h2 className="sectionTitle">
                Examination & Assessment
              </h2>
            </div>

            <div className="sectionBody">
              <div className="detailsGrid">
                <div className="detail">
                  <span className="label">
                    Upcoming Examination / Assessment
                  </span>
                  <div className="value">
                    {displayValue(
                      item.upcoming_exam_or_assessment
                    )}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Examination Name
                  </span>
                  <div className="value">
                    {displayValue(item.examination_name)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Examination Date
                  </span>
                  <div className="value">
                    {formatDate(item.examination_date)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Initial Academic Assessment
                  </span>
                  <div className="value">
                    {displayBoolean(
                      item.initial_academic_assessment
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="sectionHeader">
              <h2 className="sectionTitle">
                Tutoring Preferences
              </h2>
            </div>

            <div className="sectionBody">
              <div className="detailsGrid">
                <div className="detail">
                  <span className="label">
                    Tutoring Type
                  </span>
                  <div className="value">
                    {displayValue(item.tutoring_type)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Lesson Format
                  </span>
                  <div className="value">
                    {displayValue(item.lesson_format)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Lessons Per Week
                  </span>
                  <div className="value">
                    {displayValue(item.lessons_per_week)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Lesson Duration
                  </span>
                  <div className="value">
                    {displayValue(item.lesson_duration)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Preferred Days
                  </span>
                  <div className="value">
                    {displayArray(item.preferred_days)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Preferred Time
                  </span>
                  <div className="value">
                    {displayValue(item.preferred_time)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Time Zone
                  </span>
                  <div className="value">
                    {displayValue(item.timezone)}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Other Time Zone
                  </span>
                  <div className="value">
                    {displayValue(item.other_timezone)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="sectionHeader">
              <h2 className="sectionTitle">
                Previous Tutoring
              </h2>
            </div>

            <div className="sectionBody">
              <div className="detailsGrid">
                <div className="detail">
                  <span className="label">
                    Previous Tutoring
                  </span>
                  <div className="value">
                    {displayBoolean(
                      item.previous_tutoring
                    )}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Previous Tutoring Type
                  </span>
                  <div className="value">
                    {displayValue(
                      item.previous_tutoring_type
                    )}
                  </div>
                </div>

                <div className="detail full">
                  <span className="label">
                    Previous Tutoring Feedback
                  </span>
                  <div className="value longValue">
                    {displayValue(
                      item.previous_tutoring_feedback
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="sectionHeader">
              <h2 className="sectionTitle">
                Parent Expectations
              </h2>
            </div>

            <div className="sectionBody">
              <div className="detailsGrid">
                <div className="detail full">
                  <span className="label">
                    Expectations
                  </span>
                  <div className="value longValue">
                    {displayValue(
                      item.parent_expectations
                    )}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Progress Updates
                  </span>
                  <div className="value">
                    {displayValue(
                      item.progress_update_preference
                    )}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Preferred Next Step
                  </span>
                  <div className="value">
                    {displayValue(
                      item.preferred_next_step
                    )}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    How They Heard About JOECH TUTOR
                  </span>
                  <div className="value">
                    {displayValue(
                      item.how_heard_about_joech_tutor
                    )}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Other Referral Source
                  </span>
                  <div className="value">
                    {displayValue(
                      item.other_referral_source
                    )}
                  </div>
                </div>

                <div className="detail full">
                  <span className="label">
                    Additional Discussion
                  </span>
                  <div className="value longValue">
                    {displayValue(
                      item.additional_discussion
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section sectionFull">
            <div className="sectionHeader">
              <h2 className="sectionTitle">
                Consent & Registration Information
              </h2>
            </div>

            <div className="sectionBody">
              <div className="detailsGrid">
                <div className="detail">
                  <span className="label">
                    Parent / Guardian Consent
                  </span>
                  <div className="value">
                    {displayBoolean(
                      item.parent_guardian_consent
                    )}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Communication Consent
                  </span>
                  <div className="value">
                    {displayBoolean(
                      item.communication_consent
                    )}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Submitted
                  </span>
                  <div className="value">
                    {formatDateTime(
                      item.submitted_at
                    )}
                  </div>
                </div>

                <div className="detail">
                  <span className="label">
                    Reviewed
                  </span>
                  <div className="value">
                    {formatDateTime(
                      item.reviewed_at
                    )}
                  </div>
                </div>

                <div className="detail full">
                  <span className="label">
                    Admin Notes
                  </span>
                  <div className="value longValue">
                    {displayValue(
                      item.admin_notes
                    )}
                  </div>
                </div>

                <div className="detail full">
                  <span className="label">
                    Created Student ID
                  </span>
                  <div className="value">
                    {displayValue(
                      item.created_student_id
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section sectionFull">
            <div className="sectionBody">
              <div className="meta">
                <div className="metaItem">
                  <span className="metaLabel">
                    Registration ID
                  </span>
                  <div className="metaValue">
                    {item.id}
                  </div>
                </div>

                <div className="metaItem">
                  <span className="metaLabel">
                    Status
                  </span>
                  <div className="metaValue">
                    {statusLabel(item.status)}
                  </div>
                </div>

                <div className="metaItem">
                  <span className="metaLabel">
                    Submitted
                  </span>
                  <div className="metaValue">
                    {formatDate(
                      item.submitted_at
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}