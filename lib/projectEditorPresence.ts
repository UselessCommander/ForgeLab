/**
 * Shared helpers for showing remote carets + text selections in project Docs / Slides editors.
 */

export type RemoteTextPresenceLayer = {
  id: string
  label: string
  color: string
  /** Semi-transparent selection rects (editor-relative px). */
  highlights: Array<{ left: number; top: number; width: number; height: number }>
  caretLeft: number
  caretTop: number
  hasSelection: boolean
}

/** Map plain-text offsets to a DOM Range inside `root` (contenteditable). */
export function createRangeFromTextOffsets(root: Node, start: number, end: number): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let currentOffset = 0
  let startNode: Node | null = null
  let endNode: Node | null = null
  let startOffsetInNode = 0
  let endOffsetInNode = 0
  while (walker.nextNode()) {
    const node = walker.currentNode
    const len = node.textContent?.length || 0
    const nextOffset = currentOffset + len
    if (!startNode && start <= nextOffset) {
      startNode = node
      startOffsetInNode = Math.max(0, start - currentOffset)
    }
    if (!endNode && end <= nextOffset) {
      endNode = node
      endOffsetInNode = Math.max(0, end - currentOffset)
    }
    currentOffset = nextOffset
    if (startNode && endNode) break
  }
  if (!startNode || !endNode) return null
  const range = document.createRange()
  range.setStart(startNode, startOffsetInNode)
  range.setEnd(endNode, endOffsetInNode)
  return range
}

export function getSelectionOffsetsInContentEditable(editor: HTMLElement): {
  selectionStart: number
  selectionEnd: number
} | null {
  const selection = window.getSelection()
  if (!editor || !selection || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) return null

  const preStart = document.createRange()
  preStart.setStart(editor, 0)
  preStart.setEnd(range.startContainer, range.startOffset)

  const preEnd = document.createRange()
  preEnd.setStart(editor, 0)
  preEnd.setEnd(range.endContainer, range.endOffset)

  return {
    selectionStart: preStart.toString().length,
    selectionEnd: preEnd.toString().length,
  }
}

export function buildRemoteTextPresenceLayers(
  editor: HTMLElement,
  presenceState: Record<string, any[]>,
  options: {
    selfUserId: string
    docId: string
    docKey: 'pageId' | 'slideId'
    colorForUser: (userId: string) => string
  }
): RemoteTextPresenceLayer[] {
  const editorRect = editor.getBoundingClientRect()
  const out: RemoteTextPresenceLayer[] = []

  for (const [key, entries] of Object.entries(presenceState)) {
    const data = Array.isArray(entries) && entries.length > 0 ? entries[entries.length - 1] : null
    if (!data) continue
    if (data.userId === options.selfUserId || key === options.selfUserId) continue
    if (data[options.docKey] !== options.docId) continue
    if (typeof data.selectionStart !== 'number' || typeof data.selectionEnd !== 'number') continue

    const start = Math.min(data.selectionStart, data.selectionEnd)
    const end = Math.max(data.selectionStart, data.selectionEnd)
    const color = data.color || options.colorForUser(String(data.userId || key))
    const id = String(data.userId || key)
    const label = id.slice(-6)
    const hasSelection = end > start

    const highlights: Array<{ left: number; top: number; width: number; height: number }> = []
    if (hasSelection) {
      const range = createRangeFromTextOffsets(editor, start, end)
      if (range) {
        const rects = range.getClientRects()
        for (let i = 0; i < rects.length; i++) {
          const r = rects[i]
          if (r.width < 0.5 && r.height < 0.5) continue
          highlights.push({
            left: r.left - editorRect.left,
            top: r.top - editorRect.top,
            width: Math.max(r.width, 1),
            height: Math.max(r.height, 1),
          })
        }
      }
    }

    const caretIndex = Math.max(data.selectionStart, data.selectionEnd)
    const caretRange = createRangeFromTextOffsets(editor, caretIndex, caretIndex)
    if (!caretRange) continue
    const caretRect = caretRange.getClientRects()[0] || caretRange.getBoundingClientRect()
    const caretLeft = caretRect.left - editorRect.left
    const caretTop = caretRect.top - editorRect.top

    out.push({
      id,
      label,
      color,
      highlights,
      caretLeft,
      caretTop,
      hasSelection,
    })
  }

  return out
}
