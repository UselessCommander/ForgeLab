'use client'

import { MessageCircle } from 'lucide-react'
import type { ProjectComment } from '@/lib/comments'

interface CommentPinProps {
  comment: ProjectComment
  zoom: number
  pan: { x: number; y: number }
  onSelect: (comment: ProjectComment) => void
}

export default function CommentPin({ comment, zoom, pan, onSelect }: CommentPinProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(comment)
  }

  // Calculate screen position from canvas coordinates
  const screenX = comment.position_x! * zoom + pan.x
  const screenY = comment.position_y! * zoom + pan.y

  const getUnresolvedCount = (comment: ProjectComment): number => {
    if (comment.resolved) return 0
    let count = 1
    if (comment.replies) {
      for (const reply of comment.replies) {
        if (!reply.resolved) count++
      }
    }
    return count
  }

  const unresolvedCount = getUnresolvedCount(comment)

  return (
    <div
      className="absolute z-30 cursor-pointer"
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={handleClick}
    >
      <div
        className={`
          relative flex items-center justify-center w-6 h-6 rounded-full border-2
          transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110
          ${comment.resolved 
            ? 'bg-gray-100 border-gray-300' 
            : 'bg-blue-500 border-white'
          }
        `}
      >
        <MessageCircle 
          className={`w-3 h-3 ${comment.resolved ? 'text-gray-500' : 'text-white'}`} 
        />
        
        {/* Unresolved count badge */}
        {!comment.resolved && unresolvedCount > 1 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-semibold text-[10px]">
            {unresolvedCount}
          </div>
        )}
      </div>
    </div>
  )
}
