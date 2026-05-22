'use client'

import { memo } from 'react'

export type BoardCommentPinData = {
  id: string
  x: number
  y: number
  text: string
  createdBy: string
  createdAt: number
}

type BoardCommentPinProps = {
  comment: BoardCommentPinData
  zIndex: number
  canEdit: boolean
  createdAtLabel: string
  commentInitial: string
  onContextMenu: (e: React.MouseEvent) => void
  onClick: (e: React.MouseEvent) => void
  onPinMouseDown: (e: React.MouseEvent) => void
}

function BoardCommentPinInner({
  comment,
  zIndex,
  canEdit,
  createdAtLabel,
  commentInitial,
  onContextMenu,
  onClick,
  onPinMouseDown,
}: BoardCommentPinProps) {
  return (
    <div
      data-board-comment={comment.id}
      onContextMenu={onContextMenu}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: comment.x,
        top: comment.y,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        zIndex,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: '999px',
          border: '1px solid #E2E8F0',
          background: '#FFFFFF',
          boxShadow: '0 6px 16px rgba(15,23,42,0.16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          onMouseDown={onPinMouseDown}
          title={comment.text.trim() ? 'Klik for at åbne kommentar' : 'Tom kommentar'}
          style={{
            width: 30,
            height: 30,
            borderRadius: '999px',
            background: '#2563EB',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontSize: 12,
            fontWeight: 700,
            userSelect: 'none',
            cursor: canEdit ? 'grab' : 'pointer',
          }}
        >
          {commentInitial}
        </div>
      </div>
      <span
        style={{
          fontSize: 10,
          lineHeight: 1,
          color: '#64748B',
          fontWeight: 700,
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid #E2E8F0',
          borderRadius: 999,
          padding: '3px 6px',
          boxShadow: '0 2px 6px rgba(15,23,42,0.1)',
          userSelect: 'none',
        }}
      >
        {createdAtLabel}
      </span>
    </div>
  )
}

const BoardCommentPin = memo(BoardCommentPinInner)
export default BoardCommentPin
