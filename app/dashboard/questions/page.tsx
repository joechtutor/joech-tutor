'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

type Question = {
  id: string
  subject: string
  grade: number
  topic: string
  difficulty: string
  prompt: string
  options: string[]
  correct_option: number
  explanation?: string | null
  created_at: string
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [subject, setSubject] = useState('Mathematics')
  const [grade, setGrade] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('Foundation')
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctOption, setCorrectOption] = useState('0')
  const [explanation, setExplanation] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [filterSubject, setFilterSubject] = useState('All')
  const [filterGrade, setFilterGrade] = useState('All')
  const [filterDifficulty, setFilterDifficulty] = useState('All')
  const [showAddQuestion, setShowAddQuestion] = useState(true)

  async function loadQuestions() {
    try {
      setLoading(true)

      const res = await fetch('/api/questions', {
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Unable to load questions')
        return
      }

      setQuestions(data.questions || [])
    } catch {
      setMessage('Unable to connect to the server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  function updateOption(index: number, value: string) {
    setOptions((current) =>
      current.map((option, i) =>
        i === index ? value : option
      )
    )
  }

  async function createQuestion(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    if (!grade) {
      setMessage('Please select a grade.')
      return
    }

    if (!topic.trim()) {
      setMessage('Please enter a topic.')
      return
    }

    if (!prompt.trim()) {
      setMessage('Please enter the question.')
      return
    }

    if (options.some((option) => !option.trim())) {
      setMessage('Please complete all answer options.')
      return
    }

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          grade: Number(grade),
          topic,
          difficulty,
          prompt,
          options,
          correct_option: Number(correctOption),
          explanation,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(
          data.error || 'Unable to create question'
        )
        return
      }

      setMessage('Question created successfully.')

      setPrompt('')
      setTopic('')
      setOptions(['', '', '', ''])
      setCorrectOption('0')
      setExplanation('')

      await loadQuestions()
    } catch {
      setMessage('Unable to connect to the server')
    }
  }

  /*
   * Upload Excel file.
   *
   * IMPORTANT:
   * The API requires the following information
   * in addition to the Excel file:
   *
   * subject
   * grade
   * topic
   * difficulty
   */
  async function uploadExcel(file: File) {
    setMessage('')

    const fileName = file.name.toLowerCase()

    if (
      !fileName.endsWith('.xlsx') &&
      !fileName.endsWith('.xls')
    ) {
      setMessage(
        'Please select an Excel file (.xlsx or .xls).'
      )
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        'The Excel file is too large. Maximum size is 5 MB.'
      )
      return
    }

    /*
     * Excel import uses the same metadata
     * selected in the Question Information section.
     */
    if (!grade) {
      setMessage(
        'Please select a Grade before uploading the Excel file.'
      )

      document
        .getElementById('add-question')
        ?.scrollIntoView({
          behavior: 'smooth',
        })

      return
    }

    if (!topic.trim()) {
      setMessage(
        'Please enter a Topic before uploading the Excel file.'
      )

      document
        .getElementById('add-question')
        ?.scrollIntoView({
          behavior: 'smooth',
        })

      return
    }

    if (
      difficulty !== 'Foundation' &&
      difficulty !== 'Intermediate' &&
      difficulty !== 'Advanced'
    ) {
      setMessage(
        'Please select a valid difficulty before uploading.'
      )
      return
    }

    try {
      setUploading(true)
      setMessage(
        'Uploading and importing questions...'
      )

      const formData = new FormData()

      /*
       * Add the Excel file.
       */
      formData.append('file', file)

      /*
       * Add question metadata required by the API.
       */
      formData.append('subject', subject)
      formData.append('grade', grade)
      formData.append('topic', topic.trim())
      formData.append('difficulty', difficulty)

      const res = await fetch('/api/questions', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.errors?.length) {
          const firstErrors = data.errors
            .slice(0, 5)
            .map(
              (item: {
                row: number
                error: string
              }) =>
                `Row ${item.row}: ${item.error}`
            )
            .join(' | ')

          setMessage(
            `${data.error} ${firstErrors}`
          )
        } else {
          setMessage(
            data.error ||
              'Unable to import Excel questions.'
          )
        }

        return
      }

      setMessage(
        `Success! ${
          data.imported || 0
        } question(s) imported successfully.`
      )

      await loadQuestions()
    } catch {
      setMessage(
        'Unable to upload the Excel file. Please try again.'
      )
    } finally {
      setUploading(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0]

    if (file) {
      uploadExcel(file)
    }
  }

  function handleDrop(
    e: React.DragEvent<HTMLDivElement>
  ) {
    e.preventDefault()
    setDragging(false)

    const file = e.dataTransfer.files?.[0]

    if (file) {
      uploadExcel(file)
    }
  }

  /*
   * Download a proper Excel (.xlsx) template.
   *
   * IMPORTANT:
   * These headers exactly match the API.
   */
  function downloadTemplate() {
  import('xlsx')
    .then((XLSX) => {
      const headers = [
        'Question',
        'Option A',
        'Option B',
        'Option C',
        'Option D',
        'Correct Answer',
      ]

      const example = [
        'Write 450000 in standard form.',
        '4.5 × 10^5',
        '45 × 10^4',
        '4.5 × 10^6',
        '45 × 10^5',
        'A',
      ]

      const worksheet =
        XLSX.utils.aoa_to_sheet([
          headers,
          example,
        ])

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [
            'What is 8 × 7?',
            '54',
            '56',
            '64',
            '48',
            'B',
          ],
        ],
        {
          origin: -1,
        }
      )

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [
            'What is 15 ÷ 3?',
            '3',
            '4',
            '5',
            '6',
            'C',
          ],
        ],
        {
          origin: -1,
        }
      )

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [
            'Which is the capital of Nigeria?',
            'Lagos',
            'Abuja',
            'Kano',
            'Ibadan',
            'B',
          ],
        ],
        {
          origin: -1,
        }
      )

      worksheet['!cols'] = [
        { wch: 55 },
        { wch: 25 },
        { wch: 25 },
        { wch: 25 },
        { wch: 25 },
        { wch: 22 },
      ]

      const workbook =
        XLSX.utils.book_new()

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Questions'
      )

      XLSX.writeFile(
        workbook,
        'JOECH_TUTOR_Question_Bank_Template.xlsx'
      )
    })
    .catch(() => {
      setMessage(
        'Unable to create the Excel template.'
      )
    })
}

  const filteredQuestions = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase()

    return questions.filter((question) => {
      const matchesSearch =
        !search ||
        question.prompt
          .toLowerCase()
          .includes(search) ||
        question.topic
          .toLowerCase()
          .includes(search) ||
        question.subject
          .toLowerCase()
          .includes(search)

      const matchesSubject =
        filterSubject === 'All' ||
        question.subject === filterSubject

      const matchesGrade =
        filterGrade === 'All' ||
        question.grade ===
          Number(filterGrade)

      const matchesDifficulty =
        filterDifficulty === 'All' ||
        question.difficulty ===
          filterDifficulty

      return (
        matchesSearch &&
        matchesSubject &&
        matchesGrade &&
        matchesDifficulty
      )
    })
  }, [
    questions,
    searchTerm,
    filterSubject,
    filterGrade,
    filterDifficulty,
  ])

  const mathematicsCount =
    questions.filter(
      (question) =>
        question.subject === 'Mathematics'
    ).length

  const englishCount =
    questions.filter(
      (question) =>
        question.subject === 'English'
    ).length

  const advancedCount =
    questions.filter(
      (question) =>
        question.difficulty === 'Advanced'
    ).length

  return (
    <main className="page">
      <header className="header">
        <div className="headerInner">
          <Link
            href="/dashboard"
            className="brand"
          >
            <div className="brandLogo">
              <span>J</span>
            </div>

            <div>
              <div className="brandName">
                JOECH TUTOR
              </div>

              <div className="brandMotto">
                Excellence Beyond Borders
              </div>
            </div>
          </Link>

          <div className="headerRight">
            <div className="portalBadge">
              <span className="onlineDot" />
              Teacher / Admin
            </div>

            <Link
              href="/dashboard"
              className="dashboardLink"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebarTitle">
            CBT DASHBOARD
          </div>

          <nav className="nav">
            <Link
              href="/dashboard"
              className="navItem"
            >
              <span className="navIcon">
                ⌂
              </span>
              Dashboard
            </Link>

            <Link
              href="/dashboard/students"
              className="navItem"
            >
              <span className="navIcon">
                ♙
              </span>
              Manage Students
            </Link>

            <Link
              href="/dashboard/assessments"
              className="navItem"
            >
              <span className="navIcon">
                ▣
              </span>
              Manage Exams
            </Link>

            <Link
              href="/dashboard/results"
              className="navItem"
            >
              <span className="navIcon">
                ▤
              </span>
              Student Results
            </Link>

            <div className="navGroup">
              <div className="navGroupTitle">
                RANKING
              </div>

              <Link
                href="/dashboard/results"
                className="navItem nested"
              >
                <span className="navIcon">
                  ↗
                </span>
                Ranking by Exam
              </Link>
            </div>

            <div className="navGroup">
              <div className="navGroupTitle">
                REVIEW
              </div>

              <Link
                href="/dashboard/results"
                className="navItem nested"
              >
                <span className="navIcon">
                  ◉
                </span>
                Exam Attempt Review
              </Link>
            </div>

            <div className="navGroup">
              <div className="navGroupTitle">
                QUIZ SECTION
              </div>

              <button
                type="button"
                className="navItem nested navButton"
                onClick={() => {
                  setShowAddQuestion(true)

                  document
                    .getElementById(
                      'add-question'
                    )
                    ?.scrollIntoView({
                      behavior: 'smooth',
                    })
                }}
              >
                <span className="navIcon">
                  ＋
                </span>
                Add Question
              </button>

              <button
                type="button"
                className="navItem nested navButton active"
                onClick={() => {
                  document
                    .getElementById(
                      'question-bank'
                    )
                    ?.scrollIntoView({
                      behavior: 'smooth',
                    })
                }}
              >
                <span className="navIcon">
                  ☷
                </span>
                Manage Question Bank
              </button>
            </div>
          </nav>

          <div className="sidebarBottom">
            <div className="sidebarHelp">
              <div className="helpIcon">
                ?
              </div>

              <div>
                <strong>
                  CBT Support
                </strong>

                <span>
                  Manage your questions and
                  assessments securely.
                </span>
              </div>
            </div>
          </div>
        </aside>

        <section className="mainContent">
          <div className="pageHeading">
            <div>
              <div className="eyebrow">
                CBT QUESTION MANAGEMENT
              </div>

              <h1>Question Bank</h1>

              <p>
                Create, organize and manage
                Mathematics and English questions
                for your JOECH TUTOR assessments.
              </p>
            </div>

            <button
              type="button"
              className="primaryButton headingButton"
              onClick={() => {
                setShowAddQuestion(true)

                document
                  .getElementById(
                    'add-question'
                  )
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  })
              }}
            >
              <span>＋</span>
              Add Question
            </button>
          </div>

          <section className="stats">
            <div className="statCard">
              <div className="statIcon blue">
                ▣
              </div>

              <div>
                <span>
                  Total Questions
                </span>

                <strong>
                  {questions.length}
                </strong>
              </div>
            </div>

            <div className="statCard">
              <div className="statIcon purple">
                ∑
              </div>

              <div>
                <span>
                  Mathematics
                </span>

                <strong>
                  {mathematicsCount}
                </strong>
              </div>
            </div>

            <div className="statCard">
              <div className="statIcon green">
                Aa
              </div>

              <div>
                <span>English</span>

                <strong>
                  {englishCount}
                </strong>
              </div>
            </div>

            <div className="statCard">
              <div className="statIcon orange">
                ★
              </div>

              <div>
                <span>Advanced</span>

                <strong>
                  {advancedCount}
                </strong>
              </div>
            </div>
          </section>

          <section className="panel bulkPanel">
            <div className="panelHeader">
              <div>
                <div className="sectionNumber">
                  BULK QUESTION UPLOAD
                </div>

                <h2>
                  Import Questions from Excel
                </h2>

                <p>
                  Upload hundreds of CBT questions
                  at once using an Excel file.
                </p>
              </div>

              <button
                type="button"
                className="secondaryButton"
                onClick={downloadTemplate}
              >
                ↓ Download Excel Template
              </button>
            </div>

            <div className="uploadMetadata">
              <div className="uploadMetadataHeader">
                <div>
                  <strong>
                    Excel Import Settings
                  </strong>

                  <span>
                    These settings will be applied
                    to every question in this Excel
                    upload.
                  </span>
                </div>
              </div>

              <div className="uploadMetadataGrid">
                <div className="field">
                  <label htmlFor="uploadSubject">
                    Subject
                  </label>

                  <select
                    id="uploadSubject"
                    value={subject}
                    onChange={(e) =>
                      setSubject(
                        e.target.value
                      )
                    }
                    className="input"
                    disabled={uploading}
                  >
                    <option value="Mathematics">
                      Mathematics
                    </option>

                    <option value="English">
                      English
                    </option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="uploadGrade">
                    Grade
                  </label>

                  <select
                    id="uploadGrade"
                    value={grade}
                    onChange={(e) =>
                      setGrade(
                        e.target.value
                      )
                    }
                    className="input"
                    disabled={uploading}
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

                <div className="field">
                  <label htmlFor="uploadTopic">
                    Topic
                  </label>

                  <input
                    id="uploadTopic"
                    value={topic}
                    onChange={(e) =>
                      setTopic(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Standard Form"
                    className="input"
                    disabled={uploading}
                  />
                </div>

                <div className="field">
                  <label htmlFor="uploadDifficulty">
                    Difficulty
                  </label>

                  <select
                    id="uploadDifficulty"
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(
                        e.target.value
                      )
                    }
                    className="input"
                    disabled={uploading}
                  >
                    <option value="Foundation">
                      Foundation
                    </option>

                    <option value="Intermediate">
                      Intermediate
                    </option>

                    <option value="Advanced">
                      Advanced
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div
              className={
                dragging
                  ? 'uploadBox dragging'
                  : 'uploadBox'
              }
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() =>
                setDragging(false)
              }
              onDrop={handleDrop}
              onClick={() =>
                !uploading &&
                fileInputRef.current?.click()
              }
            >
              <div className="uploadIcon">
                ⇧
              </div>

              <h3>
                {uploading
                  ? 'Uploading questions...'
                  : 'Select or drag and drop Excel bulk questions here!'}
              </h3>

              <p>
                Supported formats: .xlsx and .xls
              </p>

              <p className="uploadLimit">
                Maximum file size: 5 MB
              </p>

              <button
                type="button"
                className="uploadButton"
                disabled={uploading}
                onClick={(e) => {
                  e.stopPropagation()

                  if (!grade) {
                    setMessage(
                      'Please select a Grade before choosing an Excel file.'
                    )
                    return
                  }

                  if (!topic.trim()) {
                    setMessage(
                      'Please enter a Topic before choosing an Excel file.'
                    )
                    return
                  }

                  fileInputRef.current?.click()
                }}
              >
                {uploading
                  ? 'Uploading...'
                  : 'Choose Excel File'}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

           <div className="bulkNotice">
  <strong>
    Excel format:
  </strong>

  <span>
    Use the columns
    <strong>
      {' '}
      Question, Option A, Option B,
      Option C, Option D, Correct Answer
    </strong>
    . Enter <strong>A</strong>,{' '}
    <strong>B</strong>, <strong>C</strong> or{' '}
    <strong>D</strong> in the Correct Answer
    column. The answer is determined
    independently for every question.
  </span>
</div>

            <div className="bulkExample">
  <div className="bulkExampleTitle">
    Correct Answer Example
  </div>

  <div className="bulkExampleGrid">
    <div>
      <span>Option A</span>
      <strong>
        4.5 × 10⁵
      </strong>
    </div>

    <div>
      <span>Option B</span>
      <strong>
        45 × 10⁴
      </strong>
    </div>

    <div>
      <span>Option C</span>
      <strong>
        4.5 × 10⁶
      </strong>
    </div>

    <div>
      <span>Option D</span>
      <strong>
        45 × 10⁵
      </strong>
    </div>

    <div className="correctExample">
      <span>
        Correct Answer
      </span>

      <strong>
        A
      </strong>
    </div>
   </div>

  <div
    style={{
      marginTop: '12px',
      fontSize: '12px',
      color: '#526174',
      lineHeight: 1.5,
    }}
  >
    <strong>
      Important:
    </strong>{' '}
    Each Excel row can have a different
    correct answer. For example, one row
    can be A, the next B, the next C and
    another D.
  </div>
</div>
          </section>

          <section
            id="add-question"
            className="panel"
          >
            <div className="panelHeader">
              <div>
                <div className="sectionNumber">
                  QUESTION ENTRY
                </div>

                <h2>Add Question</h2>

                <p>
                  Add a new multiple-choice question
                  to the JOECH TUTOR CBT Question
                  Bank.
                </p>
              </div>

              <button
                type="button"
                className="collapseButton"
                onClick={() =>
                  setShowAddQuestion(
                    (current) => !current
                  )
                }
              >
                {showAddQuestion
                  ? 'Collapse'
                  : 'Open'}

                <span>
                  {showAddQuestion
                    ? '↑'
                    : '↓'}
                </span>
              </button>
            </div>

            {showAddQuestion && (
              <form
                onSubmit={createQuestion}
                className="questionForm"
              >
                <div className="formSectionTitle">
                  <span className="stepNumber">
                    01
                  </span>

                  <div>
                    <h3>
                      Question Information
                    </h3>

                    <p>
                      Select the subject, grade,
                      topic and difficulty.
                    </p>
                  </div>
                </div>

                <div className="formGrid">
                  <div className="field">
                    <label htmlFor="subject">
                      Subject
                    </label>

                    <select
                      id="subject"
                      value={subject}
                      onChange={(e) =>
                        setSubject(
                          e.target.value
                        )
                      }
                      className="input"
                    >
                      <option value="Mathematics">
                        Mathematics
                      </option>

                      <option value="English">
                        English
                      </option>
                    </select>
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
                      required
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

                  <div className="field">
                    <label htmlFor="topic">
                      Topic
                    </label>

                    <input
                      id="topic"
                      value={topic}
                      onChange={(e) =>
                        setTopic(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Standard Form"
                      className="input"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="difficulty">
                      Difficulty
                    </label>

                    <select
                      id="difficulty"
                      value={difficulty}
                      onChange={(e) =>
                        setDifficulty(
                          e.target.value
                        )
                      }
                      className="input"
                    >
                      <option value="Foundation">
                        Foundation
                      </option>

                      <option value="Intermediate">
                        Intermediate
                      </option>

                      <option value="Advanced">
                        Advanced
                      </option>
                    </select>
                  </div>
                </div>

                <div className="formSectionTitle questionTitle">
                  <span className="stepNumber">
                    02
                  </span>

                  <div>
                    <h3>Your Question</h3>

                    <p>
                      Enter the question exactly
                      as you want students to see it
                      during the CBT.
                    </p>
                  </div>
                </div>

                <div className="field">
                  <textarea
                    value={prompt}
                    onChange={(e) =>
                      setPrompt(
                        e.target.value
                      )
                    }
                    placeholder="Type your question here..."
                    rows={6}
                    className="questionTextarea"
                    required
                  />
                </div>

                <div className="formSectionTitle questionTitle">
                  <span className="stepNumber">
                    03
                  </span>

                  <div>
                    <h3>Answer Choices</h3>

                    <p>
                      Enter four choices and
                      select the correct answer.
                    </p>
                  </div>
                </div>

                <div className="choicesGrid">
                  {options.map(
                    (option, index) => {
                      const letter =
                        String.fromCharCode(
                          65 + index
                        )

                      const isCorrect =
                        correctOption ===
                        String(index)

                      return (
                        <div
                          key={index}
                          className={
                            isCorrect
                              ? 'choiceCard correct'
                              : 'choiceCard'
                          }
                        >
                          <div className="choiceHeader">
                            <div className="choiceLetter">
                              {letter}
                            </div>

                            <span>
                              Choice {letter}
                            </span>

                            {isCorrect && (
                              <strong>
                                ✓ Correct Answer
                              </strong>
                            )}
                          </div>

                          <input
                            value={option}
                            onChange={(e) =>
                              updateOption(
                                index,
                                e.target.value
                              )
                            }
                            placeholder={`Enter choice ${letter}`}
                            className="input"
                            required
                          />
                        </div>
                      )
                    }
                  )}
                </div>

                <div className="field">
                  <label htmlFor="correctOption">
                    Correct Answer
                  </label>

                  <select
                    id="correctOption"
                    value={correctOption}
                    onChange={(e) =>
                      setCorrectOption(
                        e.target.value
                      )
                    }
                    className="input"
                  >
                    <option value="0">
                      Option A
                    </option>

                    <option value="1">
                      Option B
                    </option>

                    <option value="2">
                      Option C
                    </option>

                    <option value="3">
                      Option D
                    </option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="explanation">
                    Explanation
                  </label>

                  <textarea
                    id="explanation"
                    value={explanation}
                    onChange={(e) =>
                      setExplanation(
                        e.target.value
                      )
                    }
                    placeholder="Explain the correct answer..."
                    rows={4}
                    className="input"
                  />
                </div>

                <button
                  type="submit"
                  className="primaryButton"
                >
                  Add Question
                </button>
              </form>
            )}
          </section>

          <section
            id="question-bank"
            className="panel"
          >
            <div className="panelHeader">
              <div>
                <div className="sectionNumber">
                  QUESTION LIBRARY
                </div>

                <h2>Manage Question Bank</h2>

                <p>
                  Search and filter your existing
                  CBT questions.
                </p>
              </div>
            </div>

            <div className="filters">
              <input
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
                placeholder="Search questions, topics or subjects..."
                className="input searchInput"
              />

              <select
                value={filterSubject}
                onChange={(e) =>
                  setFilterSubject(
                    e.target.value
                  )
                }
                className="input"
              >
                <option value="All">
                  All Subjects
                </option>

                <option value="Mathematics">
                  Mathematics
                </option>

                <option value="English">
                  English
                </option>
              </select>

              <select
                value={filterGrade}
                onChange={(e) =>
                  setFilterGrade(
                    e.target.value
                  )
                }
                className="input"
              >
                <option value="All">
                  All Grades
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

              <select
                value={filterDifficulty}
                onChange={(e) =>
                  setFilterDifficulty(
                    e.target.value
                  )
                }
                className="input"
              >
                <option value="All">
                  All Difficulties
                </option>

                <option value="Foundation">
                  Foundation
                </option>

                <option value="Intermediate">
                  Intermediate
                </option>

                <option value="Advanced">
                  Advanced
                </option>
              </select>
            </div>

            {message && (
              <div className="message">
                {message}
              </div>
            )}

            {loading ? (
              <div className="emptyState">
                Loading questions...
              </div>
            ) : filteredQuestions.length ===
              0 ? (
              <div className="emptyState">
                <strong>
                  No questions found
                </strong>

                <span>
                  Add a question or import
                  questions from Excel.
                </span>
              </div>
            ) : (
              <div className="questionList">
                {filteredQuestions.map(
                  (question, index) => (
                    <article
                      key={question.id}
                      className="questionCard"
                    >
                      <div className="questionCardTop">
                        <span className="questionNumber">
                          Q{index + 1}
                        </span>

                        <span className="badge">
                          {question.subject}
                        </span>

                        <span className="badge">
                          Grade {question.grade}
                        </span>

                        <span className="badge">
                          {question.difficulty}
                        </span>
                      </div>

                      <h3>
                        {question.prompt}
                      </h3>

                      <p className="topic">
                        Topic:{' '}
                        {question.topic}
                      </p>

                      <ol type="A">
                        {question.options.map(
                          (
                            option,
                            optionIndex
                          ) => (
                            <li
                              key={
                                optionIndex
                              }
                              className={
                                optionIndex ===
                                question.correct_option
                                  ? 'correctOption'
                                  : ''
                              }
                            >
                              {option}

                              {optionIndex ===
                                question.correct_option && (
                                <strong>
                                  {' '}
                                  ✓ Correct
                                </strong>
                              )}
                            </li>
                          )
                        )}
                      </ol>

                      {question.explanation && (
                        <div className="explanation">
                          <strong>
                            Explanation:
                          </strong>{' '}
                          {
                            question.explanation
                          }
                        </div>
                      )}
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        </section>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f4f7fb;
          color: #172033;
          font-family: Arial, sans-serif;
        }

        .header {
          background: #082b59;
          color: white;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .headerInner {
          min-height: 76px;
          max-width: 1500px;
          margin: auto;
          padding: 0 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          color: white;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brandLogo {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #0b5ed7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 800;
        }

        .brandName {
          font-weight: 800;
          letter-spacing: 1px;
        }

        .brandMotto {
          font-size: 11px;
          opacity: 0.75;
          margin-top: 3px;
        }

        .headerRight {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .portalBadge {
          font-size: 13px;
          opacity: 0.9;
        }

        .onlineDot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #43d17b;
          margin-right: 7px;
        }

        .dashboardLink {
          color: white;
          text-decoration: none;
          font-size: 14px;
        }

        .layout {
          max-width: 1500px;
          margin: auto;
          display: grid;
          grid-template-columns: 250px 1fr;
          min-height: calc(100vh - 76px);
        }

        .sidebar {
          background: white;
          border-right: 1px solid #e1e7ef;
          padding: 25px 16px;
          position: sticky;
          top: 76px;
          height: calc(100vh - 76px);
        }

        .sidebarTitle {
          font-size: 12px;
          font-weight: 800;
          color: #718096;
          letter-spacing: 1.5px;
          padding: 0 12px 18px;
        }

        .nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .navItem {
          width: 100%;
          border: 0;
          background: transparent;
          color: #445066;
          text-decoration: none;
          text-align: left;
          padding: 11px 12px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          cursor: pointer;
        }

        .navItem:hover,
        .navItem.active {
          background: #edf4ff;
          color: #0b5ed7;
        }

        .navButton {
          font-family: inherit;
        }

        .navIcon {
          width: 20px;
          text-align: center;
        }

        .navGroup {
          margin-top: 15px;
        }

        .navGroupTitle {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: #9aa4b2;
          padding: 0 12px 6px;
        }

        .nested {
          padding-left: 18px;
        }

        .sidebarBottom {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 22px;
        }

        .sidebarHelp {
          background: #f4f8ff;
          border-radius: 12px;
          padding: 13px;
          display: flex;
          gap: 10px;
          font-size: 12px;
        }

        .sidebarHelp span {
          display: block;
          color: #718096;
          margin-top: 4px;
          line-height: 1.4;
        }

        .helpIcon {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          background: #0b5ed7;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .mainContent {
          padding: 42px;
          min-width: 0;
        }

        .pageHeading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 25px;
          margin-bottom: 28px;
        }

        .eyebrow,
        .sectionNumber {
          color: #0b5ed7;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        h1 {
          font-size: 34px;
          margin: 7px 0;
        }

        .pageHeading p,
        .panelHeader p {
          color: #718096;
          margin: 0;
          line-height: 1.6;
        }

        .primaryButton,
        .secondaryButton,
        .uploadButton {
          border: 0;
          border-radius: 9px;
          padding: 12px 18px;
          font-weight: 700;
          cursor: pointer;
        }

        .primaryButton {
          background: #0b5ed7;
          color: white;
        }

        .primaryButton:hover {
          background: #084baf;
        }

        .secondaryButton {
          background: #edf4ff;
          color: #0b5ed7;
        }

        .headingButton {
          white-space: nowrap;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 22px;
        }

        .statCard {
          background: white;
          border: 1px solid #e1e7ef;
          border-radius: 13px;
          padding: 18px;
          display: flex;
          gap: 13px;
          align-items: center;
        }

        .statIcon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .blue {
          background: #e8f1ff;
          color: #0b5ed7;
        }

        .purple {
          background: #f0eaff;
          color: #7048c8;
        }

        .green {
          background: #e7f8ef;
          color: #159447;
        }

        .orange {
          background: #fff0df;
          color: #d97706;
        }

        .statCard span {
          display: block;
          color: #718096;
          font-size: 12px;
        }

        .statCard strong {
          display: block;
          font-size: 23px;
          margin-top: 4px;
        }

        .panel {
          background: white;
          border: 1px solid #e1e7ef;
          border-radius: 15px;
          margin-bottom: 22px;
          overflow: hidden;
        }

        .panelHeader {
          padding: 24px 26px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          border-bottom: 1px solid #edf0f4;
        }

        .panelHeader h2 {
          margin: 5px 0 5px;
          font-size: 21px;
        }

        .uploadMetadata {
          padding: 22px 25px 8px;
          background: #fbfcfe;
          border-bottom: 1px solid #edf0f4;
        }

        .uploadMetadataHeader {
          margin-bottom: 16px;
        }

        .uploadMetadataHeader strong {
          display: block;
          font-size: 14px;
          color: #172033;
        }

        .uploadMetadataHeader span {
          display: block;
          margin-top: 4px;
          color: #718096;
          font-size: 12px;
        }

        .uploadMetadataGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }

        .uploadMetadataGrid .field {
          margin-bottom: 10px;
        }

        .uploadBox {
          margin: 25px;
          border: 2px dashed #b8c8dc;
          border-radius: 14px;
          padding: 42px 20px;
          text-align: center;
          cursor: pointer;
          transition: 0.2s;
          background: #fbfdff;
        }

        .uploadBox:hover,
        .uploadBox.dragging {
          border-color: #0b5ed7;
          background: #f3f8ff;
        }

        .uploadIcon {
          width: 58px;
          height: 58px;
          margin: 0 auto 15px;
          border-radius: 50%;
          background: #e8f1ff;
          color: #0b5ed7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 800;
        }

        .uploadBox h3 {
          margin: 0 0 8px;
          font-size: 17px;
        }

        .uploadBox p {
          color: #718096;
          margin: 5px 0;
          font-size: 13px;
        }

        .uploadLimit {
          font-size: 12px !important;
        }

        .uploadButton {
          margin-top: 16px;
          background: #0b5ed7;
          color: white;
        }

        .uploadButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .bulkNotice {
          margin: 0 25px 15px;
          padding: 14px 16px;
          background: #fff8e8;
          border: 1px solid #f1dfad;
          border-radius: 9px;
          color: #765b1d;
          font-size: 13px;
          line-height: 1.5;
        }

        .bulkNotice strong {
          font-weight: 800;
        }

        .bulkExample {
          margin: 0 25px 25px;
          padding: 16px;
          border: 1px solid #dce5f0;
          border-radius: 10px;
          background: #f8fbff;
        }

        .bulkExampleTitle {
          font-size: 12px;
          font-weight: 800;
          color: #0b5ed7;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        .bulkExampleGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .bulkExampleGrid > div {
          background: white;
          border: 1px solid #e0e6ee;
          border-radius: 8px;
          padding: 10px;
        }

        .bulkExampleGrid span {
          display: block;
          color: #718096;
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .bulkExampleGrid strong {
          display: block;
          font-size: 13px;
          color: #172033;
          word-break: break-word;
        }

        .bulkExampleGrid .correctExample {
          grid-column: span 4;
          background: #f1fbf5;
          border-color: #9bd7b4;
        }

        .bulkExampleGrid .correctExample span {
          color: #159447;
        }

        .bulkExampleGrid .correctExample strong {
          color: #126b38;
        }

        .questionForm {
          padding: 28px;
        }

        .formSectionTitle {
          display: flex;
          gap: 13px;
          align-items: center;
          margin-bottom: 20px;
        }

        .questionTitle {
          margin-top: 30px;
        }

        .stepNumber {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #082b59;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
        }

        .formSectionTitle h3 {
          margin: 0 0 3px;
        }

        .formSectionTitle p {
          margin: 0;
          color: #718096;
          font-size: 13px;
        }

        .formGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }

        .field {
          margin-bottom: 18px;
        }

        .field label {
          display: block;
          margin-bottom: 7px;
          font-size: 13px;
          font-weight: 700;
        }

        .input,
        .questionTextarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d6deea;
          border-radius: 8px;
          padding: 11px 12px;
          font: inherit;
          color: #172033;
          background: white;
          outline: none;
        }

        .input:focus,
        .questionTextarea:focus {
          border-color: #0b5ed7;
          box-shadow: 0 0 0 3px #e8f1ff;
        }

        .input:disabled {
          background: #f1f4f8;
          color: #718096;
          cursor: not-allowed;
        }

        .questionTextarea {
          resize: vertical;
        }

        .choicesGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .choiceCard {
          border: 1px solid #dce3ed;
          border-radius: 11px;
          padding: 15px;
        }

        .choiceCard.correct {
          border-color: #41b875;
          background: #f4fcf7;
        }

        .choiceHeader {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 10px;
          font-size: 13px;
          font-weight: 700;
        }

        .choiceHeader strong {
          margin-left: auto;
          color: #159447;
          font-size: 11px;
        }

        .choiceLetter {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: #edf2f7;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .collapseButton {
          border: 1px solid #d7dfeb;
          background: white;
          border-radius: 8px;
          padding: 9px 12px;
          cursor: pointer;
        }

        .collapseButton span {
          margin-left: 7px;
        }

        .filters {
          padding: 20px 26px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 10px;
          border-bottom: 1px solid #edf0f4;
        }

        .searchInput {
          min-width: 0;
        }

        .message {
          margin: 18px 26px 0;
          padding: 13px 15px;
          border-radius: 8px;
          background: #eef7ff;
          color: #15558d;
          font-size: 13px;
          line-height: 1.5;
        }

        .emptyState {
          padding: 50px 20px;
          text-align: center;
          color: #718096;
        }

        .emptyState strong,
        .emptyState span {
          display: block;
        }

        .emptyState span {
          margin-top: 6px;
          font-size: 13px;
        }

        .questionList {
          padding: 22px 26px;
        }

        .questionCard {
          border: 1px solid #e0e6ee;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 15px;
        }

        .questionCardTop {
          display: flex;
          gap: 7px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 13px;
        }

        .questionNumber {
          font-weight: 800;
          color: #082b59;
          margin-right: 5px;
        }

        .badge {
          background: #f0f4f8;
          color: #526174;
          border-radius: 20px;
          padding: 5px 9px;
          font-size: 11px;
        }

        .questionCard h3 {
          margin: 0 0 8px;
          font-size: 16px;
          line-height: 1.5;
        }

        .topic {
          color: #718096;
          font-size: 12px;
        }

        .questionCard ol {
          line-height: 1.8;
          padding-left: 25px;
        }

        .correctOption {
          color: #159447;
          font-weight: 700;
        }

        .explanation {
          margin-top: 14px;
          padding: 12px;
          border-radius: 8px;
          background: #f7f9fc;
          font-size: 13px;
          line-height: 1.5;
        }

        @media (max-width: 1100px) {
          .uploadMetadataGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .bulkExampleGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .bulkExampleGrid .correctExample {
            grid-column: span 2;
          }
        }

        @media (max-width: 1000px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .sidebar {
            display: none;
          }

          .stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .filters {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 700px) {
          .mainContent {
            padding: 20px;
          }

          .headerInner {
            padding: 0 15px;
          }

          .headerRight {
            display: none;
          }

          .pageHeading {
            align-items: flex-start;
            flex-direction: column;
          }

          .stats,
          .formGrid,
          .choicesGrid,
          .filters,
          .uploadMetadataGrid,
          .bulkExampleGrid {
            grid-template-columns: 1fr;
          }

          .bulkExampleGrid .correctExample {
            grid-column: span 1;
          }

          .panelHeader {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  )
}