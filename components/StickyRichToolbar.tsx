'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState, type CSSProperties } from 'react'
import type { StickyFontFamilyId, StickyNoteFormat } from '@/lib/stickyNoteRichText'
import { STICKY_NOTE_FORMAT_SIZES, STICKY_FONT_SIZE_LABELS } from '@/lib/stickyNoteRichText'

type Anchor = { left: number; top: number; width: number; height: number }

type Props = {
  visible: boolean
  anchor: Anchor | null
  format: StickyNoteFormat
  noteColor: string
  colorPalette: readonly string[]
  boldActive: boolean
  italicActive: boolean
  strikeActive: boolean
  onSetNoteColor: (c: string) => void
  onSetFormat: (patch: Partial<StickyNoteFormat>) => void
  onFontSizePx: (px: number) => void
  onRunCommand: (fn: () => void) => void
  /** Fx flowchart: anden aria-label og farve-knaptekst */
  toolbarAriaLabel?: string
  colorButtonTitle?: string
  colorButtonAriaLabel?: string
}

const TOOLBAR_H = 40
const GAP = 8

const btnBase: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'rgba(255,255,255,0.92)',
  borderRadius: 6,
  padding: '4px 8px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 28,
}

const activeBtn: CSSProperties = {
  background: 'rgba(255,255,255,0.16)',
}

export default function StickyRichToolbar({
  visible,
  anchor,
  format,
  noteColor,
  colorPalette,
  boldActive,
  italicActive,
  strikeActive,
  onSetNoteColor,
  onSetFormat,
  onFontSizePx,
  onRunCommand,
  toolbarAriaLabel = 'Sticky note formatering',
  colorButtonTitle = 'Sticky-farve',
  colorButtonAriaLabel = 'Vælg sticky-farve',
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !visible || !anchor) return null

  const barW = 580
  let left = anchor.left + anchor.width / 2 - barW / 2
  left = Math.max(12, Math.min(left, window.innerWidth - barW - 12))
  let top = anchor.top - TOOLBAR_H - GAP
  if (top < 12) top = anchor.top + Math.max(anchor.height, 8) + GAP

  const bar = (
    <div
      role="toolbar"
      aria-label={toolbarAriaLabel}
      style={{
        position: 'fixed',
        left,
        top,
        width: barW,
        minHeight: TOOLBAR_H,
        zIndex: 12000,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 10,
        background: 'linear-gradient(180deg, #3a3a3c 0%, #2c2c2e 100%)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
      onMouseDown={e => {
        if ((e.target as HTMLElement).closest('select')) return
        e.preventDefault()
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          type="button"
          title={colorButtonTitle}
          aria-label={colorButtonAriaLabel}
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.35)',
            background: noteColor,
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
          onMouseDown={e => e.preventDefault()}
          onClick={e => {
            e.preventDefault()
            setColorOpen(v => !v)
          }}
        />
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>▾</span>
        {colorOpen ? (
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 6,
              padding: 8,
              gap: 6,
              flexWrap: 'wrap',
              width: 160,
              background: '#1c1c1e',
              borderRadius: 10,
              boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
              zIndex: 2,
            }}
            onMouseDown={e => e.preventDefault()}
          >
            {colorPalette.map(c => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => {
                  onSetNoteColor(c)
                  setColorOpen(false)
                }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: noteColor === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                  background: c,
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
        <span style={{ ...btnBase, fontSize: 13, fontWeight: 700, padding: '4px 6px' }}>Aa</span>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>▾</span>
        <select
          aria-label="Skrifttype"
          value={format.fontFamily}
          onChange={e => onSetFormat({ fontFamily: e.target.value as StickyFontFamilyId })}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          <option value="sans">Sans</option>
          <option value="serif">Serif</option>
          <option value="mono">Monospace</option>
        </select>
      </div>

      <div style={{ position: 'relative', minWidth: 100 }}>
        <select
          aria-label="Skriftstørrelse"
          value={format.fontSizePx}
          onChange={e => onFontSizePx(Number(e.target.value))}
          style={{
            width: '100%',
            appearance: 'none',
            WebkitAppearance: 'none',
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 6,
            padding: '5px 26px 5px 10px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {STICKY_NOTE_FORMAT_SIZES.map(sz => (
            <option key={sz} value={sz} style={{ color: '#111' }}>
              {STICKY_FONT_SIZE_LABELS[sz] ?? sz} ({sz}px)
            </option>
          ))}
        </select>
        <span
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 9,
            pointerEvents: 'none',
          }}
        >
          ▾
        </span>
      </div>

      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

      <button
        type="button"
        title="Fed"
        aria-pressed={boldActive}
        style={{ ...btnBase, ...(boldActive ? activeBtn : {}), fontWeight: 800, minWidth: 30 }}
        onClick={() => onRunCommand(() => document.execCommand('bold', false))}
      >
        B
      </button>
      <button
        type="button"
        title="Kursiv"
        aria-pressed={italicActive}
        style={{ ...btnBase, ...(italicActive ? activeBtn : {}), fontStyle: 'italic', minWidth: 30 }}
        onClick={() => onRunCommand(() => document.execCommand('italic', false))}
      >
        I
      </button>
      <button
        type="button"
        title="Gennemstreget"
        aria-pressed={strikeActive}
        style={{ ...btnBase, ...(strikeActive ? activeBtn : {}), textDecoration: 'line-through', minWidth: 30 }}
        onClick={() => onRunCommand(() => document.execCommand('strikeThrough', false))}
      >
        S
      </button>
      <button
        type="button"
        title="Link"
        style={{ ...btnBase, minWidth: 30 }}
        onClick={() =>
          onRunCommand(() => {
            const url = window.prompt('Indsæt URL:', 'https://')
            if (url) document.execCommand('createLink', false, url)
          })
        }
      >
        🔗
      </button>

      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

      <button
        type="button"
        title="Punktliste"
        aria-label="Punktliste"
        style={{ ...btnBase, minWidth: 32, padding: '4px 6px' }}
        onClick={() => onRunCommand(() => document.execCommand('insertUnorderedList', false))}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none" />
          <path d="M10 6h11M10 12h11M10 18h11" />
        </svg>
      </button>
      <button
        type="button"
        title="Nummereret liste"
        aria-label="Nummereret liste"
        style={{ ...btnBase, minWidth: 32, padding: '4px 6px' }}
        onClick={() => onRunCommand(() => document.execCommand('insertOrderedList', false))}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <text x="3" y="8.5" fontSize="6.5" fill="currentColor" stroke="none" fontWeight="700" fontFamily="system-ui, sans-serif">
            1
          </text>
          <text x="3" y="14.5" fontSize="6.5" fill="currentColor" stroke="none" fontWeight="700" fontFamily="system-ui, sans-serif">
            2
          </text>
          <text x="3" y="20.5" fontSize="6.5" fill="currentColor" stroke="none" fontWeight="700" fontFamily="system-ui, sans-serif">
            3
          </text>
          <path d="M11 6h10M11 12h10M11 18h10" />
        </svg>
      </button>
    </div>
  )

  return createPortal(bar, document.body)
}
