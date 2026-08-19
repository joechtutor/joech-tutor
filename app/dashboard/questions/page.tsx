'use client'

import { useEffect, useState } from 'react'

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

  const [subject, setSubject] = useState('Mathematics')
  const [grade, setGrade] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('Foundation')
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctOption, setCorrectOption] = useState('0')
  const [explanation, setExplanation] = useState('')

  async function loadQuestions() {
    try {
      const res = await fetch('/api/questions')
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
        setMessage(data.error || 'Unable to create question')
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

  return (
    <main
      style={{
        padding: 40,
        fontFamily: 'Arial',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <h1>Question Bank</h1>

      <p>
        Create and manage Mathematics and English
        assessment questions.
      </p>

      <section
        style={{
          border: '1px solid #ddd',
          padding: 25,
          borderRadius: 10,
          marginTop: 25,
        }}
      >
        <h2>Add Question</h2>

        <form onSubmit={createQuestion}>
          <div style={{ marginBottom: 15 }}>
            <label>Subject</label>
            <br />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ padding: 10, width: '100%' }}
            >
              <option value="Mathematics">Mathematics</option>
              <option value="English">English</option>
            </select>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label>Grade</label>
            <br />
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              style={{ padding: 10, width: '100%' }}
            >
              <option value="">Select grade</option>
              <option value="5">Grade 5</option>
              <option value="6">Grade 6</option>
              <option value="7">Grade 7</option>
              <option value="8">Grade 8</option>
              <option value="9">Grade 9</option>
            </select>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label>Topic</label>
            <br />
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Standard Form"
              style={{ padding: 10, width: '100%' }}
              required
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label>Difficulty</label>
            <br />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{ padding: 10, width: '100%' }}
            >
              <option value="Foundation">Foundation</option>
              <option value="Intermediate">
                Intermediate
              </option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label>Question</label>
            <br />
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the question..."
              rows={5}
              style={{ padding: 10, width: '100%' }}
              required
            />
          </div>

          <h3>Answer Options</h3>

          {options.map((option, index) => (
            <div
              key={index}
              style={{ marginBottom: 10 }}
            >
              <label>Option {String.fromCharCode(65 + index)}</label>
              <input
                value={option}
                onChange={(e) =>
                  updateOption(index, e.target.value)
                }
                style={{
                  padding: 10,
                  width: '100%',
                }}
                placeholder={`Option ${String.fromCharCode(
                  65 + index
                )}`}
                required
              />
            </div>
          ))}

          <div style={{ marginBottom: 15 }}>
            <label>Correct Answer</label>
            <br />
            <select
              value={correctOption}
              onChange={(e) =>
                setCorrectOption(e.target.value)
              }
              style={{ padding: 10, width: '100%' }}
            >
              <option value="0">Option A</option>
              <option value="1">Option B</option>
              <option value="2">Option C</option>
              <option value="3">Option D</option>
            </select>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label>Explanation</label>
            <br />
            <textarea
              value={explanation}
              onChange={(e) =>
                setExplanation(e.target.value)
              }
              placeholder="Explain the correct answer..."
              rows={4}
              style={{ padding: 10, width: '100%' }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 20px',
              cursor: 'pointer',
            }}
          >
            Add Question
          </button>
        </form>

        {message && (
          <p style={{ marginTop: 20 }}>
            {message}
          </p>
        )}
      </section>

      <section style={{ marginTop: 40 }}>
        <h2>Question Bank</h2>

        {loading ? (
          <p>Loading questions...</p>
        ) : questions.length === 0 ? (
          <p>No questions created yet.</p>
        ) : (
          <div>
            {questions.map((question) => (
              <article
                key={question.id}
                style={{
                  border: '1px solid #ddd',
                  padding: 20,
                  marginBottom: 15,
                  borderRadius: 8,
                }}
              >
                <strong>
                  {question.subject} — Grade {question.grade}
                </strong>

                <p>
                  <strong>Topic:</strong>{' '}
                  {question.topic}
                </p>

                <p>
                  <strong>Difficulty:</strong>{' '}
                  {question.difficulty}
                </p>

                <p>
                  <strong>Question:</strong>{' '}
                  {question.prompt}
                </p>

                <ol type="A">
                  {question.options.map(
                    (option, index) => (
                      <li key={index}>
                        {option}
                        {index ===
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
                  <p>
                    <strong>Explanation:</strong>{' '}
                    {question.explanation}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}