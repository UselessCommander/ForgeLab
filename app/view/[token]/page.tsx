'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type ProjectData = {
  id: string
  name: string
  description: string
  framework: string | null
  updatedAt: string
  toolCount: number
  memberCount: number
  tools: string[]
}

type State =
  | { phase: 'loading' }
  | { phase: 'ready'; project: ProjectData; token: string }
  | { phase: 'error'; message: string }

export default function PublicViewPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<State>({ phase: 'loading' })

  useEffect(() => {
    if (!token) return
    fetch(`/api/view/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setState({ phase: 'error', message: d.error })
        else setState({ phase: 'ready', project: d.project, token })
      })
      .catch(() => setState({ phase: 'error', message: 'Kunne ikke indlæse projektet.' }))
  }, [token])

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: 'inherit' }}>
      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>ForgeLab</span>
        <span style={{ fontSize: 12, background: '#F3F4F6', color: '#6B7280', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>Read only</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <Link
            href={`/join/${token}`}
            style={{ fontSize: 13, fontWeight: 600, color: '#4F46E5', textDecoration: 'none', padding: '6px 14px', border: '1.5px solid #C7D2FE', borderRadius: 8 }}
          >
            Log ind for at samarbejde
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px' }}>
        {state.phase === 'loading' && (
          <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 15, marginTop: 80 }}>Indlæser projekt…</div>
        )}

        {state.phase === 'error' && (
          <div style={{ textAlign: 'center', marginTop: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <p style={{ color: '#6B7280', fontSize: 15 }}>{state.message}</p>
            <Link href="/" style={{ color: '#4F46E5', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>← Gå til forsiden</Link>
          </div>
        )}

        {state.phase === 'ready' && (
          <>
            {/* Project header */}
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
                {state.project.name}
              </h1>
              {state.project.description && (
                <p style={{ margin: '0 0 16px', fontSize: 15, color: '#6B7280', lineHeight: 1.6 }}>
                  {state.project.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {state.project.framework && (
                  <span style={{ fontSize: 12, background: '#EEF2FF', color: '#4338CA', borderRadius: 6, padding: '3px 10px', fontWeight: 600 }}>
                    {state.project.framework}
                  </span>
                )}
                <span style={{ fontSize: 12, background: '#F3F4F6', color: '#6B7280', borderRadius: 6, padding: '3px 10px' }}>
                  {state.project.memberCount} {state.project.memberCount === 1 ? 'medlem' : 'medlemmer'}
                </span>
                <span style={{ fontSize: 12, background: '#F3F4F6', color: '#6B7280', borderRadius: 6, padding: '3px 10px' }}>
                  {state.project.toolCount} {state.project.toolCount === 1 ? 'værktøj' : 'værktøjer'}
                </span>
                {state.project.updatedAt && (
                  <span style={{ fontSize: 12, color: '#9CA3AF', padding: '3px 0' }}>
                    Opdateret {new Date(state.project.updatedAt).toLocaleDateString('da-DK')}
                  </span>
                )}
              </div>
            </div>

            {/* Tools */}
            {state.project.tools.length > 0 && (
              <div>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Værktøjer i projektet
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {state.project.tools.map(slug => (
                    <span
                      key={slug}
                      style={{ fontSize: 13, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 12px', color: '#374151', fontWeight: 500 }}
                    >
                      {slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ marginTop: 48, padding: '24px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#111827' }}>Vil du samarbejde på projektet?</p>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9CA3AF' }}>Log ind eller opret en konto for at deltage som editor.</p>
              <Link
                href={`/join/${token}`}
                style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 10, background: '#111827', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
              >
                Log ind og deltag
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
