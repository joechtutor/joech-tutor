'use client'

import './results.css'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Student = {
  id: string
  full_name: string | null
  email: string | null
}

type Assessment = {
  id: string
  title: string
  subject: string
  grade: number
  duration_minutes: number
}

type Question = {
  id: string
  prompt: string
  options: string[]
  correct_option: number
  topic: string | null
  difficulty: string | null
  explanation: string | null
  selected_option: number | null
  is_correct: boolean
}

type Attempt = {
  id: string
  assessment_id: string
  user_id: string
  score: number
  letter: string
  total_questions: number
  correct_answers: number
  started_at: string | null
  submitted_at: string | null
  teacher_comment: string | null
}

export default function AdminResultPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const resultId = Array.isArray(params?.id)
  ? params.id[0]
  : params?.id || ''

  const [attempt, setAttempt] =
    useState<Attempt | null>(null)

  const [assessment, setAssessment] =
    useState<Assessment | null>(null)

  const [student, setStudent] =
    useState<Student | null>(null)

  const [questions, setQuestions] =
    useState<Question[]>([])

  const [loading, setLoading] =
    useState(true)

  const [message, setMessage] =
    useState('')

  const [teacherComment, setTeacherComment] =
    useState('')

  const [savingComment, setSavingComment] =
    useState(false)

  const [commentMessage, setCommentMessage] =
    useState('')

  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true)
        setMessage('')

        const response = await fetch(
          `/api/admin/results/${resultId}`,
          {
            cache: 'no-store',
          }
        )

        const data = await response.json()

        if (!response.ok) {
          setMessage(
            data.error ||
              'Unable to load result.'
          )
          return
        }

        setAttempt(data.attempt)
        setAssessment(data.assessment)
        setStudent(data.student)
        setQuestions(data.questions || [])

        setTeacherComment(
          data.attempt?.teacher_comment || ''
        )
      } catch {
        setMessage(
          'Unable to connect to the server.'
        )
      } finally {
        setLoading(false)
      }
    }

    if (resultId) {
      loadResult()
    }
  }, [resultId])

  async function saveTeacherComment() {
    if (!attempt) return

    setSavingComment(true)
    setCommentMessage('')

    try {
      const response = await fetch(
        `/api/admin/results/${attempt.id}/comment`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teacher_comment:
              teacherComment,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setCommentMessage(
          data.error ||
            'Unable to save teacher comment.'
        )
        return
      }

      setCommentMessage(
        'Teacher comment saved successfully.'
      )

      setAttempt((current) =>
        current
          ? {
              ...current,
              teacher_comment:
                teacherComment,
            }
          : current
      )
    } catch {
      setCommentMessage(
        'Unable to connect to the server.'
      )
    } finally {
      setSavingComment(false)
    }
  }

  function getStudentName() {
    if (!student) {
      return 'Student'
    }

    return (
      student.full_name ||
      student.email ||
      'Student'
    )
  }

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return 'Not available'
    }

    return new Date(value).toLocaleString()
  }

  function getOptionLabel(
    index: number | null
  ) {
    if (
      index === null ||
      index === undefined
    ) {
      return 'Not answered'
    }

    return String.fromCharCode(
      65 + index
    )
  }

  function getScoreClass(score: number) {
    if (score >= 70) {
      return 'joech-result-good'
    }

    if (score >= 50) {
      return 'joech-result-average'
    }

    return 'joech-result-poor'
  }

  if (loading) {
    return (
      <main className="joech-dashboard joech-result-page">
        <div className="joech-result-loading">
          <div className="joech-loading-card">
            <div className="joech-loading-icon">
              ðŸ“Š
            </div>

            <h2>
              Loading Assessment Result
            </h2>

            <p>
              Please wait while we retrieve
              the student's academic report.
            </p>

            <div className="joech-loading-line">
              <span />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!attempt || !assessment) {
    return (
      <main className="joech-dashboard joech-result-page">
        <div className="joech-main">
          <div className="joech-result-error">
            <div className="joech-error-icon">
              âš 
            </div>

            <span className="joech-error-label">
              RESULT UNAVAILABLE
            </span>

            <h1>
              Unable to Load Result
            </h1>

            <p>
              {message ||
                'The requested assessment result could not be found.'}
            </p>

            <button
              type="button"
              className="joech-professional-button"
              onClick={() =>
                router.push(
                  '/dashboard/results'
                )
              }
            >
              â† Back to Results
            </button>
          </div>
        </div>
      </main>
    )
  }

  const score = Number(attempt.score)

  const failedAnswers =
    Math.max(
      0,
      attempt.total_questions -
        attempt.correct_answers
    )

  const passed = score >= 50

  const scoreLabel =
    score >= 70
      ? 'Excellent Performance'
      : score >= 50
        ? 'Satisfactory Performance'
        : 'Needs Improvement'

  return (
    <main className="joech-dashboard joech-result-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="joech-result-header">
        <div className="joech-result-header-inner">

          <div className="joech-brand">
            <div className="joech-brand-mark">
              JT
            </div>

            <div>
              <div className="joech-brand-name">
                JOECH TUTOR
              </div>

              <div className="joech-brand-motto">
                Excellence Beyond Borders
              </div>
            </div>
          </div>

          <button
            type="button"
            className="joech-result-back"
            onClick={() =>
              router.push(
                '/dashboard/results'
              )
            }
          >
            <span>â†</span>
            Results
          </button>

        </div>
      </header>

      <div className="joech-main">

        {/* =====================================================
            REPORT HERO
        ===================================================== */}

        <section className="joech-report-hero">

          <div className="joech-report-hero-content">

            <div className="joech-report-label">
              <span className="joech-report-label-dot" />
              ASSESSMENT RESULT
            </div>

            <h1>
              {assessment.title}
            </h1>

            <p>
              Detailed academic performance
              report for{' '}
              <strong>
                {getStudentName()}
              </strong>
            </p>

            <div className="joech-report-meta">

              <span>
                {assessment.subject}
              </span>

              <span className="joech-meta-divider">
                â€¢
              </span>

              <span>
                Grade {assessment.grade}
              </span>

              <span className="joech-meta-divider">
                â€¢
              </span>

              <span>
                {assessment.duration_minutes}
                {' '}
                minutes
              </span>

            </div>

          </div>

          <div className="joech-hero-result">

            <div className="joech-hero-result-label">
              FINAL SCORE
            </div>

            <div className="joech-hero-score">
              {score}%
            </div>

            <div
              className={
                passed
                  ? 'joech-hero-status passed'
                  : 'joech-hero-status failed'
              }
            >
              {passed
                ? 'âœ“ PASSED'
                : 'âœ• FAILED'}
            </div>

          </div>

        </section>

        {/* =====================================================
            STUDENT INFORMATION
        ===================================================== */}

        <section className="joech-report-section">

          <div className="joech-section-title-row">

            <div>
              <div className="joech-section-kicker">
                REPORT DETAILS
              </div>

              <h2>
                Student Information
              </h2>

              <p>
                Student and assessment details
                for this submission.
              </p>
            </div>

          </div>

          <div className="joech-info-grid">

            <div className="joech-info-card">

              <div className="joech-info-icon">
                ðŸ‘¤
              </div>

              <div>
                <span>
                  STUDENT
                </span>

                <strong>
                  {getStudentName()}
                </strong>

                {student?.email && (
                  <small>
                    {student.email}
                  </small>
                )}
              </div>

            </div>

            <div className="joech-info-card">

              <div className="joech-info-icon">
                ðŸ“š
              </div>

              <div>
                <span>
                  SUBJECT
                </span>

                <strong>
                  {assessment.subject}
                </strong>
              </div>

            </div>

            <div className="joech-info-card">

              <div className="joech-info-icon">
                ðŸŽ“
              </div>

              <div>
                <span>
                  GRADE
                </span>

                <strong>
                  Grade {assessment.grade}
                </strong>
              </div>

            </div>

            <div className="joech-info-card">

              <div className="joech-info-icon">
                â±
              </div>

              <div>
                <span>
                  DURATION
                </span>

                <strong>
                  {assessment.duration_minutes}
                  {' '}
                  minutes
                </strong>
              </div>

            </div>

            <div className="joech-info-card">

              <div className="joech-info-icon">
                ðŸ—“
              </div>

              <div>
                <span>
                  SUBMITTED
                </span>

                <strong className="joech-date-value">
                  {formatDate(
                    attempt.submitted_at
                  )}
                </strong>
              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            PERFORMANCE SUMMARY
        ===================================================== */}

        <section className="joech-report-section">

          <div className="joech-section-title-row">

            <div>
              <div className="joech-section-kicker">
                ACADEMIC PERFORMANCE
              </div>

              <h2>
                Performance Summary
              </h2>

              <p>
                Overall performance from the
                completed assessment.
              </p>
            </div>

            <div
              className={
                passed
                  ? 'joech-status-badge passed'
                  : 'joech-status-badge failed'
              }
            >
              <span>
                {passed ? 'âœ“' : 'âœ•'}
              </span>

              {passed
                ? 'PASSED'
                : 'FAILED'}
            </div>

          </div>

          <div className="joech-performance-grid">

            <div
              className={`joech-performance-card score ${getScoreClass(
                score
              )}`}
            >
              <span>
                SCORE
              </span>

              <strong>
                {score}%
              </strong>

              <small>
                {scoreLabel}
              </small>
            </div>

            <div className="joech-performance-card">

              <span>
                LETTER GRADE
              </span>

              <strong>
                {attempt.letter}
              </strong>

              <small>
                Final grade
              </small>

            </div>

            <div className="joech-performance-card">

              <span>
                CORRECT
              </span>

              <strong>
                {attempt.correct_answers}
                <em>
                  /{attempt.total_questions}
                </em>
              </strong>

              <small>
                Questions answered correctly
              </small>

            </div>

            <div className="joech-performance-card">

              <span>
                INCORRECT
              </span>

              <strong>
                {failedAnswers}
              </strong>

              <small>
                Questions requiring review
              </small>

            </div>

          </div>

          <div className="joech-score-progress">

            <div className="joech-score-progress-header">

              <span>
                Overall Performance
              </span>

              <strong>
                {score}%
              </strong>

            </div>

            <div className="joech-score-track">

              <div
                className={
                  score >= 70
                    ? 'joech-score-fill excellent'
                    : score >= 50
                      ? 'joech-score-fill average'
                      : 'joech-score-fill poor'
                }
                style={{
                  width: `${Math.min(
                    Math.max(score, 0),
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

        </section>

        {/* =====================================================
            QUESTION REVIEW
        ===================================================== */}

        <section className="joech-question-section">

          <div className="joech-question-heading">

            <div>
              <div className="joech-section-kicker">
                ASSESSMENT REVIEW
              </div>

              <h2>
                Question-by-Question Review
              </h2>

              <p>
                Review each question, the
                student's response and the
                correct answer.
              </p>
            </div>

            <div className="joech-question-count">
              <strong>
                {questions.length}
              </strong>

              <span>
                {questions.length === 1
                  ? 'Question'
                  : 'Questions'}
              </span>
            </div>

          </div>

          {questions.length === 0 ? (

            <div className="joech-empty-result">

              <div>
                ðŸ“‹
              </div>

              <strong>
                No questions found
              </strong>

              <span>
                There are no question details
                available for this result.
              </span>

            </div>

          ) : (

            <div className="joech-question-list">

              {questions.map(
                (
                  question,
                  index
                ) => (

                  <article
                    key={question.id}
                    className="joech-professional-question"
                  >

                    {/* QUESTION TOP */}

                    <div className="joech-question-top">

                      <div className="joech-question-number">
                        {String(
                          index + 1
                        ).padStart(2, '0')}
                      </div>

                      <div className="joech-question-heading-text">

                        <div>
                          Question {index + 1}
                        </div>

                        <small>
                          {question.topic ||
                            'General'}
                          {' â€¢ '}
                          {question.difficulty ||
                            'Standard'}
                        </small>

                      </div>

                      <div
                        className={
                          question.is_correct
                            ? 'joech-question-status correct'
                            : 'joech-question-status incorrect'
                        }
                      >
                        {question.is_correct
                          ? 'âœ“ Correct'
                          : 'âœ• Incorrect'}
                      </div>

                    </div>

                    {/* QUESTION TEXT */}

                    <div className="joech-question-body">

                      <h3>
                        {question.prompt}
                      </h3>

                    </div>

                    {/* OPTIONS */}

                    <div className="joech-options">

                      {question.options.map(
                        (
                          option,
                          optionIndex
                        ) => {

                          const isStudentAnswer =
                            question.selected_option ===
                            optionIndex

                          const isCorrectAnswer =
                            question.correct_option ===
                            optionIndex

                          return (
                            <div
                              key={
                                optionIndex
                              }
                              className={[
                                'joech-professional-option',
                                isCorrectAnswer
                                  ? 'correct'
                                  : '',
                                isStudentAnswer &&
                                !isCorrectAnswer
                                  ? 'wrong'
                                  : '',
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(' ')}
                            >

                              <div className="joech-option-left">

                                <span className="joech-option-letter">
                                  {getOptionLabel(
                                    optionIndex
                                  )}
                                </span>

                                <span className="joech-option-text">
                                  {option}
                                </span>

                              </div>

                              <div className="joech-option-tags">

                                {isStudentAnswer && (
                                  <span className="joech-student-tag">
                                    Student Answer
                                  </span>
                                )}

                                {isCorrectAnswer && (
                                  <span className="joech-correct-tag">
                                    âœ“ Correct Answer
                                  </span>
                                )}

                              </div>

                            </div>
                          )
                        }
                      )}

                    </div>

                    {/* NOT ANSWERED */}

                    {question.selected_option ===
                      null && (

                      <div className="joech-not-answered">

                        <span>
                          âš 
                        </span>

                        <div>
                          <strong>
                            Question not answered
                          </strong>

                          <p>
                            The student did not
                            select an answer for
                            this question.
                          </p>
                        </div>

                      </div>

                    )}

                    {/* EXPLANATION */}

                    {question.explanation && (

                      <div className="joech-professional-explanation">

                        <div className="joech-explanation-icon">
                          ðŸ’¡
                        </div>

                        <div>
                          <strong>
                            Explanation
                          </strong>

                          <p>
                            {
                              question.explanation
                            }
                          </p>
                        </div>

                      </div>

                    )}

                  </article>

                )
              )}

            </div>

          )}

        </section>

        {/* =====================================================
            TEACHER FEEDBACK
        ===================================================== */}

        <section className="joech-teacher-feedback">

          <div className="joech-feedback-header">

            <div className="joech-feedback-icon">
              âœŽ
            </div>

            <div>

              <div className="joech-section-kicker">
                TEACHER / ACADEMIC REVIEW
              </div>

              <h2>
                Teacher Feedback
              </h2>

              <p>
                Provide personalised academic
                feedback to guide the student's
                progress.
              </p>

            </div>

          </div>

          <div className="joech-feedback-editor">

            <div className="joech-feedback-editor-top">

              <div>
                <strong>
                  Academic Comment
                </strong>

                <span>
                  Your feedback will be saved
                  with this assessment result.
                </span>
              </div>

              <div className="joech-feedback-status">
                {teacherComment.trim()
                  ? 'Comment entered'
                  : 'Awaiting feedback'}
              </div>

            </div>

            <textarea
              value={teacherComment}
              onChange={(event) =>
                setTeacherComment(
                  event.target.value
                )
              }
              placeholder="Write a professional comment about the student's performance, strengths, areas for improvement, and recommended next steps..."
              rows={7}
              className="joech-professional-textarea"
            />

            <div className="joech-feedback-bottom">

              <div className="joech-feedback-guidance">

                <span>
                  ðŸ’¬
                </span>

                <div>
                  <strong>
                    Keep feedback constructive
                  </strong>

                  <small>
                    Highlight strengths and give
                    clear guidance for improvement.
                  </small>
                </div>

              </div>

              <button
                type="button"
                className="joech-save-feedback"
                onClick={
                  saveTeacherComment
                }
                disabled={savingComment}
              >

                <span>
                  {savingComment
                    ? 'â³'
                    : 'âœ“'}
                </span>

                {savingComment
                  ? 'Saving Feedback...'
                  : 'Save Teacher Comment'}

              </button>

            </div>

          </div>

          {commentMessage && (

            <div
              className={
                commentMessage.includes(
                  'successfully'
                )
                  ? 'joech-feedback-message success'
                  : 'joech-feedback-message error'
              }
            >

              <span>
                {commentMessage.includes(
                  'successfully'
                )
                  ? 'âœ“'
                  : 'âš '}
              </span>

              {commentMessage}

            </div>

          )}

        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="joech-professional-footer">

          <div className="joech-footer-brand">
            JT
          </div>

          <div>
            <strong>
              JOECH TUTOR
            </strong>

            <span>
              Excellence Beyond Borders
            </span>
          </div>

          <div className="joech-footer-line" />

          <span className="joech-footer-copy">
            Academic Assessment Report
          </span>

        </footer>

      </div>
    </main>
  )
}
