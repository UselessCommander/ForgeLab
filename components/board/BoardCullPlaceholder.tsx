'use client'

import { memo } from 'react'

type BoardCullPlaceholderProps = {
  left: number
  top: number
  width: number
  height: number
  zIndex: number
}

function BoardCullPlaceholderInner({ left, top, width, height, zIndex }: BoardCullPlaceholderProps) {
  return (
    <div
      aria-hidden
      data-board-cull-placeholder
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        pointerEvents: 'none',
        zIndex,
      }}
    />
  )
}

const BoardCullPlaceholder = memo(BoardCullPlaceholderInner)
export default BoardCullPlaceholder
