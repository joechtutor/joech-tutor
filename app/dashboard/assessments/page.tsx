'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Question = {
  id: string
  subject: string
  grade: number
  topic: string
  difficulty: string
  prompt: string
  options: string[]
}

type Assessment = {
  id: string
  title: string
  subject: string
  grade: number
  duration_minutes: number
  created_at: string
  assessment_questions?: {
    question_id: string
    position: number
  }[]
}

type Student = {
  id: string
  full_name: string
  grade: number
}

type Assignment = {
  assessment_id: string
  student_id: string
  assigned_at: string
  assessment_title?: string
  student_name?: string
}

export default function AssessmentsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('Mathematics')
  const [grade, setGrade] = useState('')
  const [duration, setDuration] = useState('30')

  const [selectedAssessment, setSelectedAssessment] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')

  const [loading, setLoading] = useState(true)
  const [assignmentsLoading, setAssignmentsLoading] = useState(true)

  const [message, setMessage] = useState('')
  const [assignmentMessage, setAssignmentMessage] = useState('')

  async function loadData() {
    try {
      const questionsResponse = await fetch('/api/questions')
      const questionsData = await questionsResponse.json()

      const assessmentsResponse = await fetch('/api/assessments')
      const assessmentsData = await assessmentsResponse.json()

      if (!questionsResponse.ok) {
        setMessage(questionsData.error || 'Unable to load questions')
        return
      }

      if (!assessmentsResponse.ok) {
        setMessage(assessmentsData.error || 'Unable to load assessments')
        return
      }

      setQuestions(questionsData.questions || [])
      setAssessments(assessmentsData.assessments || [])
    } catch {
      setMessage('Unable to connect to the server')
    } finally {
      setLoading(false)
    }
  }

  async function loadStudents() {
    try {
      const response = await fetch('/api/students/list')
      const data = await response.json()

      if (!response.ok) {
        setAssignmentMessage(data.error || 'Unable to load students')
        return
      }

      setStudents(data.students || [])
    } catch {
      setAssignmentMessage('Unable to connect to the student server')
    }
  }

  async function loadAssignments() {
    try {
      const response = await fetch('/api/assignments')
      const data = await response.json()

      if (!response.ok) {
        setAssignmentMessage(data.error || 'Unable to load assignments')
        return
      }

      setAssignments(data.assignments || [])
    } catch {
      setAssignmentMessage('Unable to connect to the assignment server')
    } finally {
      setAssignmentsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    loadStudents()
    loadAssignments()
  }, [])

  function toggleQuestion(id: string) {
    setSelectedQuestions((current) =>
      current.includes(id)
        ? current.filter((questionId) => questionId !== id)
        : [...current, id]
    )
  }

  const filteredQuestions = questions.filter((question) => {
    return (
      question.subject === subject &&
      (!grade || question.grade === Number(grade))
    )
  })

  async function createAssessment(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    if (!title.trim()) {
      setMessage('Please enter an assessment title.')
      return
    }

    if (!grade) {
      setMessage('Please select a grade.')
      return
    }

    if (selectedQuestions.length === 0) {
      setMessage('Please select at least one question.')
      return
    }

    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          subject,
          grade: Number(grade),
          duration_minutes: Number(duration),
          question_ids: selectedQuestions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'Unable to create assessment')
        return
      }

      setMessage('Assessment created successfully.')
      setTitle('')
      setSelectedQuestions([])
      setGrade('')

      await loadData()
    } catch {
      setMessage('Unable to connect to the server')
    }
  }

  async function assignAssessment(e: React.FormEvent) {
    e.preventDefault()
    setAssignmentMessage('')

    if (!selectedAssessment) {
      setAssignmentMessage('Please select an assessment.')
      return
    }

    if (!selectedStudent) {
      setAssignmentMessage('Please select a student.')
      return
    }

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessment_id: selectedAssessment,
          student_id: selectedStudent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setAssignmentMessage(
          data.error || 'Unable to assign assessment'
        )
        return
      }

      setAssignmentMessage('Assessment assigned successfully.')
      setSelectedAssessment('')
      setSelectedStudent('')

      await loadAssignments()
    } catch {
      setAssignmentMessage(
        'Unable to connect to the assignment server'
      )
    }
  }

  const totalQuestions = questions.length
  const totalAssessments = assessments.length
  const totalStudents = students.length
  const totalAssignments = assignments.length

  return (
    <main className="page">
      <header className="header">
        <div className="headerInner">
          <Link href="/dashboard" className="brand">
            <Image
              src="/joech-logo.jpg"
              alt="JOECH TUTOR"
              width={58}
              height={58}
              priority
              className="logo"
            />

            <div>
              <div className="brandName">JOECH TUTOR</div>
              <div className="brandMotto">
                Excellence Beyond Borders
              </div>
            </div>
          </Link>

          <div className="headerRight">
            <div className="portalBadge">
              <span className="onlineDot" />
              Admin Portal
            </div>

            <Link href="/dashboard" className="dashboardLink">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="content">
        <section className="hero">
          <div>
            <div className="eyebrow">ACADEMIC MANAGEMENT</div>

            <h1>Assessment Management</h1>

            <p>
              Create professional assessments, select questions,
              and assign them to your students.
            </p>
          </div>

          <div className="heroAction">
            <a href="#create-assessment" className="heroButton">
              <span>＋</span>
              Create Assessment
            </a>
          </div>
        </section>

        <section className="stats">
          <div className="statCard">
            <div className="statIcon blue">▣</div>
            <div>
              <span>Total Assessments</span>
              <strong>{totalAssessments}</strong>
            </div>
          </div>

          <div className="statCard">
            <div className="statIcon purple">?</div>
            <div>
              <span>Question Bank</span>
              <strong>{totalQuestions}</strong>
            </div>
          </div>

          <div className="statCard">
            <div className="statIcon green">♙</div>
            <div>
              <span>Students</span>
              <strong>{totalStudents}</strong>
            </div>
          </div>

          <div className="statCard">
            <div className="statIcon orange">↗</div>
            <div>
              <span>Assignments</span>
              <strong>{totalAssignments}</strong>
            </div>
          </div>
        </section>

        <section
          id="create-assessment"
          className="card createCard"
        >
          <div className="cardHeader">
            <div>
              <div className="sectionNumber">01</div>
              <h2>Create Assessment</h2>
              <p>
                Build an assessment using questions from your
                JOECH TUTOR Question Bank.
              </p>
            </div>

            <div className="selectedBadge">
              <strong>{selectedQuestions.length}</strong>
              <span>Questions selected</span>
            </div>
          </div>

          <form onSubmit={createAssessment}>
            <div className="formGrid">
              <div className="field wide">
                <label htmlFor="title">
                  Assessment Title
                </label>

                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Grade 8 Mathematics — Standard Form"
                  className="input"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="subject">Subject</label>

                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value)
                    setSelectedQuestions([])
                  }}
                  className="input"
                >
                  <option value="Mathematics">
                    Mathematics
                  </option>
                  <option value="English">English</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="grade">Grade</label>

                <select
                  id="grade"
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value)
                    setSelectedQuestions([])
                  }}
                  className="input"
                  required
                >
                  <option value="">Select grade</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="duration">
                  Duration
                </label>

                <div className="inputWithSuffix">
                  <input
                    id="duration"
                    type="number"
                    min="1"
                    max="180"
                    value={duration}
                    onChange={(e) =>
                      setDuration(e.target.value)
                    }
                    className="input"
                    required
                  />
                  <span>minutes</span>
                </div>
              </div>
            </div>

            <div className="questionHeader">
              <div>
                <h3>Select Questions</h3>
                <p>
                  Choose the questions students will answer.
                </p>
              </div>

              <div className="questionCount">
                {selectedQuestions.length} selected
              </div>
            </div>

            {!grade ? (
              <div className="emptyBox">
                <div className="emptyIcon">?</div>
                <strong>Select a grade</strong>
                <span>
                  Select a grade above to view available
                  questions.
                </span>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="emptyBox">
                <div className="emptyIcon">!</div>
                <strong>No questions available</strong>
                <span>
                  No questions are currently available for
                  this subject and grade.
                </span>
              </div>
            ) : (
              <div className="questionList">
                {filteredQuestions.map((question, index) => {
                  const selected =
                    selectedQuestions.includes(question.id)

                  return (
                    <label
                      key={question.id}
                      className={
                        selected
                          ? 'questionCard selected'
                          : 'questionCard'
                      }
                    >
                      <div className="questionTop">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleQuestion(question.id)
                          }
                        />

                        <span className="questionNo">
                          Q{String(index + 1).padStart(2, '0')}
                        </span>

                        <span className="tag topic">
                          {question.topic}
                        </span>

                        <span className="tag difficulty">
                          {question.difficulty}
                        </span>

                        {selected && (
                          <span className="selectedCheck">
                            ✓ Selected
                          </span>
                        )}
                      </div>

                      <p>{question.prompt}</p>
                    </label>
                  )
                })}
              </div>
            )}

            <div className="formBottom">
              <div className="selectionSummary">
                <span className="summaryIcon">✓</span>
                <div>
                  <strong>
                    {selectedQuestions.length} question
                    {selectedQuestions.length === 1
                      ? ''
                      : 's'} selected
                  </strong>
                  <span>
                    Your assessment is ready when you are.
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="primaryButton"
              >
                Create Assessment
                <span>→</span>
              </button>
            </div>
          </form>

          {message && (
            <div className="message successMessage">
              <span>✓</span>
              {message}
            </div>
          )}
        </section>

        <section className="sectionBlock">
          <div className="sectionTitle">
            <div>
              <div className="sectionNumber">02</div>
              <h2>Existing Assessments</h2>
              <p>
                View and manage assessments already created.
              </p>
            </div>

            <div className="countLabel">
              {assessments.length} assessment
              {assessments.length === 1 ? '' : 's'}
            </div>
          </div>

          {loading ? (
            <div className="loadingBox">
              Loading assessments...
            </div>
          ) : assessments.length === 0 ? (
            <div className="emptyBox">
              <div className="emptyIcon">▣</div>
              <strong>No assessments created yet.</strong>
              <span>
                Create your first assessment above.
              </span>
            </div>
          ) : (
            <div className="assessmentGrid">
              {assessments.map((assessment) => (
                <article
                  key={assessment.id}
                  className="assessmentCard"
                >
                  <div className="assessmentTop">
                    <div className="subjectIcon">
                      {assessment.subject === 'Mathematics'
                        ? '∑'
                        : 'Aa'}
                    </div>

                    <span className="statusBadge">
                      Active
                    </span>
                  </div>

                  <div className="assessmentSubject">
                    {assessment.subject}
                  </div>

                                  <h3 className="assessmentTitle">
                    {assessment.title}
                  </h3>

                  <div className="assessmentMeta">
                    <div className="metaItem">
                      <span className="metaLabel">
                        Grade
                      </span>
                      <strong>
                        Grade {assessment.grade}
                      </strong>
                    </div>

                    <div className="metaItem">
                      <span className="metaLabel">
                        Duration
                      </span>
                      <strong>
                        {assessment.duration_minutes} min
                      </strong>
                    </div>

                    <div className="metaItem">
                      <span className="metaLabel">
                        Questions
                      </span>
                      <strong>
                        {assessment.assessment_questions?.length || 0}
                      </strong>
                    </div>
                  </div>

                  <div className="assessmentCardFooter">
                    <Link
                      href={`/dashboard/assessments/${assessment.id}`}
                      className="viewAssessmentButton"
                    >
                      View Assessment
                      <span>→</span>
                    </Link>
                  </div>

                </article>
              ))}

            </div>
          )}

        </section>

        <footer className="pageFooter">
          <div className="footerBrand">
            <strong>JOECH TUTOR</strong>
            <span>Excellence Beyond Borders</span>
          </div>

          <span>
            Mathematics & English Assessment Platform
          </span>
        </footer>

      </div>

     <style jsx>{`
  * {
    box-sizing: border-box;
  }

  .page {
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

  /* =========================
     HEADER
  ========================= */

  .header {
    background: #ffffff;
    border-bottom: 1px solid #e6eaf0;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .headerInner {
    max-width: 1380px;
    margin: 0 auto;
    min-height: 82px;
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 13px;
    text-decoration: none;
    color: inherit;
  }

  .logo {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: 10px;
    display: block;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  }

  .brandName {
    font-size: 20px;
    line-height: 1.1;
    font-weight: 800;
    letter-spacing: -0.4px;
    color: #14213d;
  }

  .brandMotto {
    margin-top: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #0b5ed7;
    letter-spacing: 0.2px;
  }

  .headerRight {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .portalBadge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 13px;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    background: #f8fafc;
    color: #475569;
    font-size: 12px;
    font-weight: 700;
  }

  .onlineDot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #16a34a;
    box-shadow: 0 0 0 3px #dcfce7;
  }

  .dashboardLink {
    text-decoration: none;
    color: #475569;
    font-size: 13px;
    font-weight: 700;
    transition: color 0.2s ease;
  }

  .dashboardLink:hover {
    color: #0b5ed7;
  }

  /* =========================
     MAIN CONTENT
  ========================= */

  .content {
    max-width: 1380px;
    margin: 0 auto;
    padding: 42px 32px 0;
  }

  /* =========================
     HERO
  ========================= */

  .hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 30px;
    margin-bottom: 30px;
  }

  .eyebrow {
    margin-bottom: 10px;
    color: #0b5ed7;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.5px;
  }

  .hero h1 {
    margin: 0;
    color: #14213d;
    font-size: clamp(30px, 4vw, 42px);
    line-height: 1.1;
    letter-spacing: -1.2px;
    font-weight: 800;
  }

  .hero p {
    max-width: 700px;
    margin: 13px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.7;
  }

  .heroButton {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 13px 19px;
    border-radius: 10px;
    background: #0b5ed7;
    color: #ffffff;
    text-decoration: none;
    font-size: 13px;
    font-weight: 800;
    box-shadow: 0 8px 20px rgba(11, 94, 215, 0.18);
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .heroButton:hover {
    background: #084aa9;
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(11, 94, 215, 0.25);
  }

  .heroButton span {
    font-size: 17px;
    line-height: 1;
  }

  /* =========================
     STATISTICS
  ========================= */

  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    margin-bottom: 30px;
  }

  .statCard {
    min-height: 104px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    background: #ffffff;
    border: 1px solid #e6eaf0;
    border-radius: 14px;
    box-shadow: 0 3px 12px rgba(15, 23, 42, 0.035);
  }

  .statIcon {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-size: 21px;
    font-weight: 800;
  }

  .statIcon.blue {
    background: #eaf2ff;
    color: #0b5ed7;
  }

  .statIcon.purple {
    background: #f1eaff;
    color: #7c3aed;
  }

  .statIcon.green {
    background: #e9f9ef;
    color: #16a34a;
  }

  .statIcon.orange {
    background: #fff3e6;
    color: #ea580c;
  }

  .statCard span {
    display: block;
    margin-bottom: 5px;
    color: #7b8798;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.55px;
  }

  .statCard strong {
    display: block;
    color: #14213d;
    font-size: 27px;
    line-height: 1;
    font-weight: 800;
  }

  /* =========================
     CARDS
  ========================= */

  .card,
  .sectionBlock {
    background: #ffffff;
    border: 1px solid #e3e8ef;
    border-radius: 16px;
    box-shadow: 0 5px 20px rgba(15, 23, 42, 0.045);
  }

  .createCard {
    padding: 30px;
  }

  .sectionBlock {
    margin-top: 30px;
    padding: 30px;
  }

  .cardHeader,
  .sectionTitle {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 25px;
    margin-bottom: 28px;
  }

  .sectionNumber {
    margin-bottom: 6px;
    color: #0b5ed7;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1.5px;
  }

  .cardHeader h2,
  .sectionTitle h2 {
    margin: 0;
    color: #14213d;
    font-size: 23px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -0.4px;
  }

  .cardHeader p,
  .sectionTitle p {
    margin: 7px 0 0;
    color: #718096;
    font-size: 13px;
    line-height: 1.6;
  }

  .selectedBadge {
    min-width: 135px;
    padding: 11px 15px;
    border: 1px solid #dbeafe;
    border-radius: 11px;
    background: #f5f9ff;
    text-align: center;
  }

  .selectedBadge strong {
    display: block;
    color: #0b5ed7;
    font-size: 20px;
    line-height: 1.1;
    font-weight: 800;
  }

  .selectedBadge span {
    display: block;
    margin-top: 4px;
    color: #64748b;
    font-size: 10px;
    font-weight: 700;
  }

  /* =========================
     FORM
  ========================= */

  .formGrid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 18px;
  }

  .field {
    min-width: 0;
  }

  .field.wide {
    grid-column: span 1;
  }

  .field label {
    display: block;
    margin-bottom: 7px;
    color: #344054;
    font-size: 12px;
    font-weight: 800;
  }

  .input {
    width: 100%;
    min-height: 45px;
    padding: 0 13px;
    border: 1px solid #d8dee8;
    border-radius: 9px;
    outline: none;
    background: #ffffff;
    color: #172033;
    font-family: inherit;
    font-size: 13px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .input::placeholder {
    color: #a0a9b8;
  }

  .input:hover {
    border-color: #b8c2d1;
  }

  .input:focus {
    border-color: #0b5ed7;
    box-shadow: 0 0 0 3px rgba(11, 94, 215, 0.1);
  }

  select.input {
    cursor: pointer;
  }

  .inputWithSuffix {
    position: relative;
  }

  .inputWithSuffix .input {
    padding-right: 68px;
  }

  .inputWithSuffix span {
    position: absolute;
    top: 50%;
    right: 13px;
    transform: translateY(-50%);
    color: #7b8798;
    font-size: 11px;
    font-weight: 700;
    pointer-events: none;
  }

  /* =========================
     QUESTIONS
  ========================= */

  .questionHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin: 30px 0 15px;
    padding-top: 27px;
    border-top: 1px solid #edf0f4;
  }

  .questionHeader h3 {
    margin: 0;
    color: #14213d;
    font-size: 16px;
    font-weight: 800;
  }

  .questionHeader p {
    margin: 5px 0 0;
    color: #7b8798;
    font-size: 12px;
  }

  .questionCount,
  .countLabel {
    padding: 7px 11px;
    border-radius: 7px;
    background: #f1f5f9;
    color: #475569;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
  }

  .questionList {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 430px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .questionCard {
    display: block;
    padding: 16px 17px;
    border: 1px solid #e2e7ee;
    border-radius: 11px;
    background: #ffffff;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      background 0.2s ease,
      box-shadow 0.2s ease;
  }

  .questionCard:hover {
    border-color: #b9c8dc;
    box-shadow: 0 3px 10px rgba(15, 23, 42, 0.04);
  }

  .questionCard.selected {
    border-color: #76a8ef;
    background: #f7fbff;
    box-shadow: 0 0 0 2px rgba(11, 94, 215, 0.06);
  }

  .questionTop {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 9px;
  }

  .questionTop input {
    width: 17px;
    height: 17px;
    accent-color: #0b5ed7;
    cursor: pointer;
  }

  .questionNo {
    color: #334155;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.4px;
  }

  .tag {
    padding: 4px 8px;
    border-radius: 5px;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.45px;
  }

  .tag.topic {
    background: #eef4ff;
    color: #3568b8;
  }

  .tag.difficulty {
    background: #f3f4f6;
    color: #64748b;
  }

  .selectedCheck {
    margin-left: auto;
    color: #0b5ed7;
    font-size: 10px;
    font-weight: 800;
  }

  .questionCard p {
    margin: 13px 0 0 26px;
    color: #26364d;
    font-size: 13px;
    line-height: 1.65;
  }

  /* =========================
     EMPTY / LOADING
  ========================= */

  .emptyBox,
  .loadingBox {
    min-height: 170px;
    padding: 35px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    border: 1px dashed #ccd5e1;
    border-radius: 11px;
    background: #fafbfd;
    text-align: center;
  }

  .emptyIcon {
    width: 38px;
    height: 38px;
    margin-bottom: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #edf2f7;
    color: #64748b;
    font-size: 16px;
    font-weight: 800;
  }

  .emptyBox strong {
    color: #334155;
    font-size: 13px;
  }

  .emptyBox span {
    max-width: 430px;
    margin-top: 5px;
    color: #8a96a8;
    font-size: 11px;
    line-height: 1.5;
  }

  .loadingBox {
    color: #64748b;
    font-size: 13px;
    min-height: 130px;
  }

  /* =========================
     FORM FOOTER
  ========================= */

  .formBottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-top: 22px;
    padding-top: 20px;
    border-top: 1px solid #edf0f4;
  }

  .selectionSummary {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .summaryIcon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: #eaf7ef;
    color: #16a34a;
    font-size: 14px;
    font-weight: 900;
  }

  .selectionSummary strong {
    display: block;
    color: #344054;
    font-size: 12px;
  }

  .selectionSummary span:not(.summaryIcon) {
    display: block;
    margin-top: 2px;
    color: #8a96a8;
    font-size: 10px;
  }

  .primaryButton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    min-height: 44px;
    padding: 0 20px;
    border: none;
    border-radius: 9px;
    background: #0b5ed7;
    color: #ffffff;
    font-family: inherit;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 7px 16px rgba(11, 94, 215, 0.17);
    transition: all 0.2s ease;
  }

  .primaryButton:hover {
    background: #084aa9;
    transform: translateY(-1px);
  }

  .primaryButton span {
    font-size: 17px;
  }

  .message {
    margin-top: 18px;
    padding: 12px 14px;
    border-radius: 9px;
    font-size: 12px;
    font-weight: 700;
  }

  .successMessage {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #ecfdf3;
    border: 1px solid #bbf7d0;
    color: #15803d;
  }

  /* =========================
     ASSESSMENTS
  ========================= */

  .assessmentGrid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }

  .assessmentCard {
    padding: 20px;
    border: 1px solid #e2e7ee;
    border-radius: 13px;
    background: #ffffff;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }

  .assessmentCard:hover {
    transform: translateY(-2px);
    border-color: #cbd5e1;
    box-shadow: 0 9px 24px rgba(15, 23, 42, 0.07);
  }

  .assessmentTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
  }

  .subjectIcon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #edf4ff;
    color: #0b5ed7;
    font-size: 19px;
    font-weight: 900;
  }

  .statusBadge {
    padding: 5px 9px;
    border-radius: 999px;
    background: #ecfdf3;
    color: #15803d;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .assessmentSubject {
    margin-bottom: 6px;
    color: #0b5ed7;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.9px;
  }

  .assessmentTitle {
    margin: 0 0 18px;
    color: #14213d;
    font-size: 17px;
    line-height: 1.4;
    font-weight: 800;
  }

  .assessmentMeta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 20px;
  }

  .metaItem {
    padding: 10px;
    border: 1px solid #e8ecf2;
    border-radius: 8px;
    background: #f8fafc;
  }

  .metaLabel {
    display: block;
    margin-bottom: 4px;
    color: #8a96a8;
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .metaItem strong {
    color: #344054;
    font-size: 10px;
    font-weight: 800;
  }

  .assessmentCardFooter {
    padding-top: 15px;
    border-top: 1px solid #edf0f4;
  }

  .viewAssessmentButton {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 40px;
    padding: 0 13px;
    border-radius: 8px;
    background: #f1f6ff;
    color: #0b5ed7;
    text-decoration: none;
    font-size: 11px;
    font-weight: 800;
    transition: all 0.2s ease;
  }

  .viewAssessmentButton:hover {
    background: #0b5ed7;
    color: #ffffff;
  }

  .viewAssessmentButton span {
    font-size: 16px;
  }

  /* =========================
     FOOTER
  ========================= */

  .pageFooter {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-top: 42px;
    padding: 25px 0 30px;
    border-top: 1px solid #dfe5ed;
    color: #8a96a8;
    font-size: 11px;
  }

  .footerBrand {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .footerBrand strong {
    color: #14213d;
    font-size: 13px;
    font-weight: 800;
  }

  .footerBrand span {
    color: #0b5ed7;
    font-size: 10px;
    font-weight: 700;
  }

  /* =========================
     RESPONSIVE
  ========================= */

  @media (max-width: 1100px) {
    .stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .formGrid {
      grid-template-columns: repeat(2, 1fr);
    }

    .assessmentGrid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .headerInner {
      min-height: 70px;
      padding: 0 18px;
    }

    .logo {
      width: 46px;
      height: 46px;
    }

    .brandName {
      font-size: 17px;
    }

    .brandMotto {
      font-size: 9px;
    }

    .headerRight {
      gap: 10px;
    }

    .portalBadge {
      display: none;
    }

    .content {
      padding: 28px 18px 0;
    }

    .hero {
      align-items: flex-start;
      flex-direction: column;
    }

    .hero h1 {
      font-size: 31px;
    }

    .heroAction {
      width: 100%;
    }

    .heroButton {
      width: 100%;
      justify-content: center;
    }

    .stats {
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .statCard {
      padding: 15px;
    }

    .statIcon {
      width: 40px;
      height: 40px;
    }

    .statCard strong {
      font-size: 22px;
    }

    .createCard,
    .sectionBlock {
      padding: 20px;
    }

    .cardHeader,
    .sectionTitle {
      flex-direction: column;
    }

    .selectedBadge {
      width: 100%;
    }

    .formGrid {
      grid-template-columns: 1fr;
    }

    .questionHeader {
      align-items: flex-start;
      flex-direction: column;
    }

    .questionCount {
      align-self: flex-start;
    }

    .formBottom {
      align-items: stretch;
      flex-direction: column;
    }

    .primaryButton {
      width: 100%;
    }

    .assessmentGrid {
      grid-template-columns: 1fr;
    }

    .assessmentMeta {
      grid-template-columns: repeat(3, 1fr);
    }

    .pageFooter {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media (max-width: 480px) {
    .stats {
      grid-template-columns: 1fr;
    }

    .assessmentMeta {
      grid-template-columns: 1fr;
    }

    .questionCard p {
      margin-left: 0;
    }

    .selectedCheck {
      width: 100%;
      margin-left: 26px;
    }

    .hero h1 {
      font-size: 28px;
    }
  }
`}</style>
    </main>
  )
}