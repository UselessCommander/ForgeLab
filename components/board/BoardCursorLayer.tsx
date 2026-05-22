'use client'

import { memo } from 'react'
import type { LiveCursorView } from '@/lib/board-performance-helpers'

type BoardCursorLayerProps = {
  cursors: Record<string, LiveCursorView>
}

function BoardCursorLayerInner({ cursors }: BoardCursorLayerProps) {
  const visible = Object.values(cursors).filter(c => c.visible)
  if (visible.length === 0) return null

  return (
    <>
      {visible.map(cursor => {
        const initial = (cursor.username || 'U').trim().charAt(0).toUpperCase()
        return (
          <div
            key={cursor.userId}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate3d(${cursor.x - 1}px, ${cursor.y - 1}px, 0)`,
              pointerEvents: 'none',
              zIndex: 20,
              willChange: 'transform',
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: `14px solid ${cursor.color}`,
                transform: 'rotate(-35deg)',
                transformOrigin: '50% 80%',
                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.22))',
              }}
            />
            <div
              style={{
                marginTop: 2,
                marginLeft: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: cursor.color,
                color: 'white',
                borderRadius: 999,
                padding: '2px 8px 2px 6px',
                boxShadow: '0 6px 18px rgba(0,0,0,0.16)',
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.22)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                }}
              >
                {initial}
              </span>
              {cursor.username || 'Bruger'}
            </div>
          </div>
        )
      })}
    </>
  )
}

const BoardCursorLayer = memo(BoardCursorLayerInner)
export default BoardCursorLayer
