'use client'

import Link from 'next/link'
import type { Project } from '@/lib/projects'
import { buildProjectActivity, formatActivityTime } from '@/lib/recent-activity'

type ProjectActivityPanelProps = {
  project: Pick<Project, 'id' | 'name' | 'updatedAt' | 'createdAt' | 'toolIds'>
  collapsed?: boolean
}

export default function ProjectActivityPanel({ project, collapsed }: ProjectActivityPanelProps) {
  const items = buildProjectActivity(project as Project, 6)

  if (collapsed) return null

  return (
    <div
      style={{
        borderTop: '1px solid #F3F4F6',
        padding: '10px 10px 12px',
        maxHeight: 200,
        overflowY: 'auto',
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#9CA3AF',
          marginBottom: 8,
        }}
      >
        Seneste aktivitet
      </p>
      {items.length === 0 ? (
        <p style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.45 }}>
          Ingen aktivitet i projektet endnu. Når du redigerer boards, metoder eller dokumenter, vises det her.
        </p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item) => (
            <li key={item.id}>
              {item.href ? (
                <Link href={item.href} style={{ display: 'block', textDecoration: 'none' }}>
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: '#374151', lineHeight: 1.3 }}>{item.label}</p>
                  <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{formatActivityTime(item.at)}</p>
                </Link>
              ) : (
                <>
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: '#374151' }}>{item.label}</p>
                  <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{formatActivityTime(item.at)}</p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
