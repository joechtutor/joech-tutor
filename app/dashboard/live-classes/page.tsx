'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type LiveClass = {
  id: string
  title: string
  subject: string
  topic: string | null
  class_code: string
  scheduled_at: string | null
  duration_minutes: number
  status: 'scheduled' | 'live' | 'ended'
}

export default function LiveClassesPage() {
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadClasses() {
      try {
        const response = await fetch('/api/live-classes')

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load live classes')
        }

        setClasses(data.liveClasses || [])
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load live classes'
        )
      } finally {
        setLoading(false)
      }
    }

    loadClasses()
  }, [])

  function formatDate(date: string | null) {
    if (!date) return 'Date not set'

    return new Date(date).toLocaleString()
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
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '32px',
                color: '#082b59',
              }}
            >
              Live Classes
            </h1>

            <p
              style={{
                marginTop: '8px',
                color: '#64748b',
              }}
            >
              Create and manage your JOECH TUTOR live classes.
            </p>
          </div>

          <Link
            href="/dashboard/live-classes/create"
            style={{
              background: '#0b5ed7',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            + Create Live Class
          </Link>
        </div>

        {loading && (
          <div
            style={{
              background: '#fff',
              borderRadius: '18px',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            Loading live classes...
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && classes.length === 0 && (
          <div
            style={{
              background: '#fff',
              borderRadius: '18px',
              padding: '50px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                fontSize: '56px',
                marginBottom: '15px',
              }}
            >
              🎥
            </div>

            <h2
              style={{
                margin: 0,
                color: '#1e293b',
              }}
            >
              No live classes yet
            </h2>

            <p
              style={{
                color: '#64748b',
                marginTop: '10px',
                marginBottom: '25px',
              }}
            >
              Create your first live class and invite your students.
            </p>

            <Link
              href="/dashboard/live-classes/create"
              style={{
                display: 'inline-block',
                background: '#082b59',
                color: '#fff',
                padding: '12px 22px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Create Your First Class
            </Link>
          </div>
        )}

        {!loading && !error && classes.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {classes.map((liveClass) => (
              <div
                key={liveClass.id}
                style={{
                  background: '#fff',
                  borderRadius: '18px',
                  padding: '25px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      background: '#e0f2fe',
                      color: '#0369a1',
                      padding: '6px 10px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    {liveClass.subject}
                  </span>

                  <span
                    style={{
                      fontSize: '13px',
                      color:
                        liveClass.status === 'live'
                          ? '#15803d'
                          : '#64748b',
                      fontWeight: 700,
                    }}
                  >
                    {liveClass.status.toUpperCase()}
                  </span>
                </div>

                <h2
                  style={{
                    color: '#082b59',
                    marginBottom: '8px',
                    marginTop: '18px',
                  }}
                >
                  {liveClass.title}
                </h2>

                {liveClass.topic && (
                  <p
                    style={{
                      color: '#64748b',
                      marginTop: 0,
                    }}
                  >
                    Topic: {liveClass.topic}
                  </p>
                )}

                <div
                  style={{
                    background: '#f8fafc',
                    padding: '15px',
                    borderRadius: '10px',
                    marginTop: '18px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#64748b',
                    }}
                  >
                    CLASS CODE
                  </div>

                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color: '#0b5ed7',
                      letterSpacing: '2px',
                      marginTop: '4px',
                    }}
                  >
                    {liveClass.class_code}
                  </div>
                </div>

                <p
                  style={{
                    color: '#475569',
                    marginTop: '15px',
                  }}
                >
                  📅 {formatDate(liveClass.scheduled_at)}
                </p>

                <p
                  style={{
                    color: '#475569',
                  }}
                >
                  ⏱️ {liveClass.duration_minutes} minutes
                </p>

                <Link
                  href={`/dashboard/live-classes/${liveClass.id}`}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    background: '#082b59',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontWeight: 700,
                    marginTop: '20px',
                  }}
                >
                  Open Classroom
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}