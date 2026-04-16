'use client'

import { useLayoutEffect, useRef } from 'react'
import {
  migratePlainStickyTextToHtml,
  sanitizeStickyHtml,
  type StickyNoteFormat,
} from '@/lib/stickyNoteRichText'
import { stickyFontStack } from '@/lib/stickyNoteRichText'

type Props = {
  noteId: string
  text: string
  format: StickyNoteFormat
  disabled: boolean
  isSelected: boolean
  onRequestSelect: (id: string, additive: boolean) => void
  onCommitHtml: (id: string, html: string) => void
  registerEditor: (id: string, el: HTMLDivElement | null) => void
}

export default function StickyNoteBodyEditor({
  noteId,
  text,
  format,
  disabled,
  isSelected,
  onRequestSelect,
  onCommitHtml,
  registerEditor,
}: Props) {
  const elRef = useRef<HTMLDivElement>(null)
  const skipSync = useRef(false)

  useLayoutEffect(() => {
    registerEditor(noteId, elRef.current)
    return () => registerEditor(noteId, null)
  }, [noteId, registerEditor])

  useLayoutEffect(() => {
    const el = elRef.current
    if (!el) return
    if (skipSync.current) {
      skipSync.current = false
      return
    }
    el.innerHTML = migratePlainStickyTextToHtml(text)
  }, [text, noteId])

  return (
    <div
      ref={elRef}
      data-sticky-editor={noteId}
      contentEditable={!disabled}
      suppressContentEditableWarning
      className="forge-sticky-note-input"
      style={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        border: 'none',
        background: 'transparent',
        padding: '12px 12px 6px',
        fontSize: format.fontSizePx,
        lineHeight: 1.4,
        outline: 'none',
        boxSizing: 'border-box',
        cursor: disabled ? 'default' : 'text',
        fontFamily: stickyFontStack(format.fontFamily),
        fontWeight: format.bold ? 700 : 400,
        fontStyle: format.italic ? 'italic' : 'normal',
        overflow: 'auto',
        wordBreak: 'break-word',
        userSelect: 'text',
        WebkitUserSelect: 'text',
      }}
      onMouseDown={e => {
        if (disabled) return
        if (!isSelected) {
          // Første klik: vælg sticky'en, men lad ikke tekstmarkør/drag starte endnu.
          e.stopPropagation()
          const additive = e.metaKey || e.ctrlKey || e.shiftKey
          onRequestSelect(noteId, additive)
          e.preventDefault()
        }
      }}
      onPointerDown={e => {
        if (disabled) return
        // Når sticky'en ikke er valgt endnu, skal klik kun ramme selection-logikken ovenfor.
        // Når den ER valgt, skal pointeren gerne boble op, så man kan trække den.
        if (!isSelected) {
          e.stopPropagation()
        }
      }}
      onInput={() => {
        const el = elRef.current
        if (!el) return
        skipSync.current = true
        onCommitHtml(noteId, sanitizeStickyHtml(el.innerHTML))
      }}
    />
  )
}
