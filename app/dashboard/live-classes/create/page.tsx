'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'

export default function CreateLiveClassPage() {
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [duration, setDuration] = useState('60')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/live-classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          subject,
          topic,
          scheduled_at: scheduledAt || null,
          duration_minutes: Number(duration),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create live class')
      }

      window.location.href = '/dashboard/live-classes'
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to create live class'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        padding: '40px',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <Link
          href="/dashboard/live-classes"
          style={{
            color: '#0b5ed7',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          ← Back to Live Classes
        </Link>

        <div
          style={{
            background: '#fff',
            marginTop: '20px',
            padding: '35px',
            borderRadius: '18px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <h1
            style={{
              marginTop: 0,
              color: '#082b59',
              fontSize: '30px',
            }}
          >
            Create Live Class
          </h1>

          <p style={{ color: '#64748b' }}>
            Set up a new JOECH TUTOR live lesson.
          </p>

          <form onSubmit={handleSubmit}>
            <label
              style={{
                display: 'block',
                marginTop: '25px',
                fontWeight: 600,
              }}
            >
              Class Title
            </label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mathematics — Algebra"
              required
              style={{
                width: '100%',
                padding: '13px',
                marginTop: '8px',
                border: '1px solid #cbd5e1',
                borderRadius: '9px',
                fontSize: '16px',
              }}
            />

            <label
              style={{
                display: 'block',
                marginTop: '20px',
                fontWeight: 600,
              }}
            >
              Subject
            </label>

            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '13px',
                marginTop: '8px',
                border: '1px solid #cbd5e1',
                borderRadius: '9px',
                fontSize: '16px',
                background: '#fff',
              }}
            >
              <option value="">Select subject</option>
              <option value="Mathematics">Mathematics</option>
              <option value="English">English</option>
              <option value="Yoruba">Yoruba</option>
              <option value="Basic Science">Basic Science</option>
              <option value="Business Studies">Business Studies</option>
              <option value="Reasoning">Reasoning</option>
            </select>

            <label
              style={{
                display: 'block',
                marginTop: '20px',
                fontWeight: 600,
              }}
            >
              Topic
            </label>

            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Linear Equations"
              style={{
                width: '100%',
                padding: '13px',
                marginTop: '8px',
                border: '1px solid #cbd5e1',
                borderRadius: '9px',
                fontSize: '16px',
              }}
            />

            <label
              style={{
                display: 'block',
                marginTop: '20px',
                fontWeight: 600,
              }}
            >
              Date and Time
            </label>

            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{
                width: '100%',
                padding: '13px',
                marginTop: '8px',
                border: '1px solid #cbd5e1',
                borderRadius: '9px',
                fontSize: '16px',
              }}
            />

            <label
              style={{
                display: 'block',
                marginTop: '20px',
                fontWeight: 600,
              }}
            >
              Duration (minutes)
            </label>

            <input
              type="number"
              min="1"
              max="240"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '13px',
                marginTop: '8px',
                border: '1px solid #cbd5e1',
                borderRadius: '9px',
                fontSize: '16px',
              }}
            />

            {message && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '12px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '8px',
                }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '30px',
                padding: '14px',
                border: 'none',
                borderRadius: '10px',
                background: '#0b5ed7',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Creating Class...' : 'Create Live Class'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}