'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type State =
  | { phase: 'loading' }
  | { phase: 'preview'; projectName: string; role: string }
  | { phase: 'joining' }
  | { phase: 'done'; projectId: string; projectName: string; role: string }
  | { phase: 'already'; projectId: string; projectName: string }
  | { phase: 'error'; message: string }

export default function JoinPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [state, setState] = useState<State>({ phase: 'loading' })

  useEffect(() => {
    if (!token) return
    fetch(`/api/invite/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setState({ phase: 'error', message: d.error })
        else setState({ phase: 'preview', projectName: d.projectName, role: d.role })
      })
      .catch(() => setState({ phase: 'error', message: 'Kunne ikke indlæse invitationen.' }))
  }, [token])

  const handleJoin = async () => {
    setState({ phase: 'joining' })
    try {
      const res = await fetch(`/api/invite/${token}`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/login?return=/join/${token}`)
          return
        }
        setState({ phase: 'error', message: d.error || 'Noget gik galt.' })
        return
      }
      if (d.alreadyMember) {
        setState({ phase: 'already', projectId: d.projectId, projectName: d.projectName })
      } else {
        setState({ phase: 'done', projectId: d.projectId, projectName: d.projectName, role: d.role })
      }
    } catch {
      setState({ phase: 'error', message: 'Netværksfejl — prøv igen.' })
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg,#fef9f0 0%,#fff7ed 100%)',
      fontFamily: 'inherit',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 24px 64px rgba(15,23,42,0.12)',
        padding: '40px 36px',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>

        {state.phase === 'loading' && (
          <p style={{ color: '#6B7280', fontSize: 15 }}>Indlæser invitation…</p>
        )}

        {state.phase === 'preview' && (
          <>
            <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#111827' }}>
              Du er inviteret!
            </h1>
            <p style={{ margin: '0 0 20px', fontSize: 15, color: '#6B7280' }}>
              Tilslut dig projektet <strong style={{ color: '#111827' }}>{state.projectName}</strong> som{' '}
              <span style={{
                display: 'inline-block',
                background: state.role === 'editor' ? '#DBEAFE' : '#F3F4F6',
                color: state.role === 'editor' ? '#1D4ED8' : '#374151',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 13,
                fontWeight: 700,
              }}>
                {state.role === 'editor' ? 'Editor' : 'Viewer'}
              </span>
            </p>
            <button
              onClick={handleJoin}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 12,
                border: 'none',
                background: '#111827',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tilslut projekt
            </button>
            <p style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF' }}>
              Du skal være logget ind for at tilslutte dig.
            </p>
          </>
        )}

        {state.phase === 'joining' && (
          <p style={{ color: '#6B7280', fontSize: 15 }}>Tilslutter dig…</p>
        )}

        {state.phase === 'done' && (
          <>
            <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#111827' }}>
              Velkommen! 🎉
            </h1>
            <p style={{ margin: '0 0 20px', fontSize: 15, color: '#6B7280' }}>
              Du er nu {state.role === 'editor' ? 'editor' : 'viewer'} på{' '}
              <strong>{state.projectName}</strong>.
            </p>
            <Link
              href={`/dashboard/projects/${state.projectId}`}
              style={{
                display: 'block',
                padding: '12px 0',
                borderRadius: 12,
                background: '#111827',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Åbn projekt
            </Link>
          </>
        )}

        {state.phase === 'already' && (
          <>
            <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#111827' }}>
              Du er allerede medlem
            </h1>
            <p style={{ margin: '0 0 20px', fontSize: 15, color: '#6B7280' }}>
              Du har allerede adgang til <strong>{state.projectName}</strong>.
            </p>
            <Link
              href={`/dashboard/projects/${state.projectId}`}
              style={{
                display: 'block',
                padding: '12px 0',
                borderRadius: 12,
                background: '#111827',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Åbn projekt
            </Link>
          </>
        )}

        {state.phase === 'error' && (
          <>
            <h1 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#EF4444' }}>
              Ugyldigt link
            </h1>
            <p style={{ margin: '0 0 20px', fontSize: 15, color: '#6B7280' }}>
              {state.message}
            </p>
            <Link
              href="/dashboard"
              style={{
                display: 'block',
                padding: '12px 0',
                borderRadius: 12,
                background: '#F3F4F6',
                color: '#374151',
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Gå til dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
