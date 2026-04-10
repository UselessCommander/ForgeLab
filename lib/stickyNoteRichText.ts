export type StickyFontFamilyId = 'sans' | 'serif' | 'mono'

export type StickyNoteFormat = {
  fontSizePx: number
  fontFamily: StickyFontFamilyId
  bold: boolean
  italic: boolean
}

export const STICKY_NOTE_FORMAT_SIZES = [11, 14, 17, 21, 26, 32] as const

export const STICKY_FONT_SIZE_LABELS: Record<number, string> = {
  11: 'Lille',
  14: 'Normal',
  17: 'Medium',
  21: 'Stor',
  26: 'XL',
  32: 'XXL',
}

export const DEFAULT_STICKY_NOTE_FORMAT: StickyNoteFormat = {
  fontSizePx: 14,
  fontFamily: 'sans',
  bold: false,
  italic: false,
}

export function stickyFontStack(id: StickyFontFamilyId): string {
  switch (id) {
    case 'serif':
      return 'Georgia, "Times New Roman", ui-serif, serif'
    case 'mono':
      return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace'
    default:
      return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  }
}

/** Legacy plaintekst → sikkert HTML til contenteditable */
export function migratePlainStickyTextToHtml(text: string): string {
  const raw = typeof text === 'string' ? text : ''
  const t = raw.trim()
  if (!t) return '<br>'
  if (t.startsWith('<')) return raw || '<br>'
  return raw
    .split('\n')
    .map(line => line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    .join('<br>')
}

export function sanitizeStickyHtml(html: string): string {
  const h = (html || '').trim()
  if (!h) return '<br>'
  let s = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  return s || '<br>'
}

export function clampStickyFontSize(px: number): (typeof STICKY_NOTE_FORMAT_SIZES)[number] {
  const sizes = STICKY_NOTE_FORMAT_SIZES
  let closest: (typeof STICKY_NOTE_FORMAT_SIZES)[number] = sizes[0]
  let best = Infinity
  for (const sz of sizes) {
    const d = Math.abs(sz - px)
    if (d < best) {
      best = d
      closest = sz
    }
  }
  return closest
}

export function parseStickyFormat(raw: unknown): StickyNoteFormat | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const fontSizePx =
    typeof o.fontSizePx === 'number' && Number.isFinite(o.fontSizePx)
      ? clampStickyFontSize(o.fontSizePx)
      : undefined
  const fontFamily =
    o.fontFamily === 'sans' || o.fontFamily === 'serif' || o.fontFamily === 'mono'
      ? o.fontFamily
      : undefined
  if (fontSizePx === undefined && fontFamily === undefined && o.bold !== true && o.italic !== true) {
    return undefined
  }
  return {
    fontSizePx: fontSizePx ?? DEFAULT_STICKY_NOTE_FORMAT.fontSizePx,
    fontFamily: fontFamily ?? DEFAULT_STICKY_NOTE_FORMAT.fontFamily,
    bold: o.bold === true,
    italic: o.italic === true,
  }
}

export function mergeStickyFormat(
  base: StickyNoteFormat | undefined,
  patch: Partial<StickyNoteFormat>
): StickyNoteFormat {
  const b = base ?? DEFAULT_STICKY_NOTE_FORMAT
  return {
    fontSizePx: patch.fontSizePx != null ? clampStickyFontSize(patch.fontSizePx) : b.fontSizePx,
    fontFamily: patch.fontFamily ?? b.fontFamily,
    bold: patch.bold ?? b.bold,
    italic: patch.italic ?? b.italic,
  }
}

export function applyInlineStyleToSelection(
  editor: HTMLElement,
  css: Partial<Record<'fontSize' | 'fontFamily', string>>
): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (range.collapsed) return false
  if (!editor.contains(range.commonAncestorContainer)) return false
  try {
    const span = document.createElement('span')
    if (css.fontSize) span.style.fontSize = css.fontSize
    if (css.fontFamily) span.style.fontFamily = css.fontFamily
    span.appendChild(range.extractContents())
    range.insertNode(span)
    sel.removeAllRanges()
    const nr = document.createRange()
    nr.selectNodeContents(span)
    nr.collapse(false)
    sel.addRange(nr)
    return true
  } catch {
    return false
  }
}
