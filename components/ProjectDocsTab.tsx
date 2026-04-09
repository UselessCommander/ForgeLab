'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getProjectToolData, saveProjectToolData } from '@/lib/projects'
import { supabase } from '@/lib/supabase'
import * as Y from 'yjs'

type ProjectDocsTabProps = {
  projectId: string
  canEdit: boolean
}

type ProjectDocPage = {
  id: string
  title: string
  header: string
  html: string
  footer: string
}

type ProjectDocData = {
  pages: ProjectDocPage[]
  activePageId: string
  updatedAt: number
}

type CursorPresence = {
  userId: string
  color: string
  pageId: string
  selectionStart: number
  selectionEnd: number
  at: number
}

const DOC_TOOL_SLUG = 'project-docs'
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const createPage = (title = 'Fane 1'): ProjectDocPage => ({
  id: createId(),
  title,
  header: '',
  html: '<p></p>',
  footer: '',
})
const LOCAL_ORIGIN = 'local'
const REMOTE_ORIGIN = 'remote'
const DEFAULT_DOC: ProjectDocData = {
  pages: [createPage('Fane 1')],
  activePageId: '',
  updatedAt: 0,
}

export default function ProjectDocsTab({ projectId, canEdit }: ProjectDocsTabProps) {
  const [doc, setDoc] = useState<ProjectDocData>(DEFAULT_DOC)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [onlineCount, setOnlineCount] = useState(1)
  const [remoteCursors, setRemoteCursors] = useState<Array<{ id: string; label: string; color: string; left: number; top: number }>>([])
  const [syncInfo, setSyncInfo] = useState<string>('Forbinder…')
  const [fontName, setFontName] = useState('Georgia')
  const [fontSize, setFontSize] = useState('4')
  const [showViewMenu, setShowViewMenu] = useState(false)
  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [showSideElementsSubmenu, setShowSideElementsSubmenu] = useState(false)
  const [showFormatMenu, setShowFormatMenu] = useState(false)
  const [showToolsMenu, setShowToolsMenu] = useState(false)
  const [mode, setMode] = useState<'editing' | 'viewing'>('editing')
  const [showCommentsPanel, setShowCommentsPanel] = useState(false)
  const [hideSidebar, setHideSidebar] = useState(false)
  const [showPrintLayout, setShowPrintLayout] = useState(true)
  const [showPageNumbers, setShowPageNumbers] = useState(false)
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [watermarkText, setWatermarkText] = useState('')
  const [showRuler, setShowRuler] = useState(true)
  const [showEquationToolbar, setShowEquationToolbar] = useState(false)
  const [showInvisibleChars, setShowInvisibleChars] = useState(false)
  const [showLineNumbers, setShowLineNumbers] = useState(false)
  const [lineSpacing, setLineSpacing] = useState(1.7)
  const editorRef = useRef<HTMLDivElement>(null)
  const docsShellRef = useRef<HTMLDivElement>(null)
  const headerInputRef = useRef<HTMLInputElement>(null)
  const footerInputRef = useRef<HTMLInputElement>(null)
  const lastRenderedPageIdRef = useRef<string>('')
  const selectionRangeRef = useRef<Range | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconcileTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const presenceRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isUnmountedRef = useRef(false)
  const yDocRef = useRef<Y.Doc | null>(null)
  const channelRef = useRef<any>(null)
  const dbChannelRef = useRef<any>(null)
  const applyingRemoteRef = useRef(false)
  const lastYUpdateOriginRef = useRef<any>(null)
  const isSyncingFromServerRef = useRef(false)
  const lastLocalEditAtRef = useRef(0)
  const clientPresenceIdRef = useRef(`docs-${Math.random().toString(36).slice(2, 8)}`)
  const presenceThrottleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPresencePayloadRef = useRef<string>('')

  const normalizeDoc = (input: any): ProjectDocData => {
    const pages = Array.isArray(input?.pages)
      ? input.pages
          .map((page: any) => ({
            id: typeof page?.id === 'string' ? page.id : createId(),
            title: typeof page?.title === 'string' && page.title.trim() ? page.title : 'Untitled',
            header: typeof page?.header === 'string' ? page.header : '',
            html: typeof page?.html === 'string' ? page.html : '<p></p>',
            footer: typeof page?.footer === 'string' ? page.footer : '',
          }))
          .filter((page: ProjectDocPage) => page.id && page.title)
      : []

    const ensuredPages = pages.length > 0
      ? pages
      : [createPage('Fane 1')]

    const activePageId =
      typeof input?.activePageId === 'string' && ensuredPages.some((p: ProjectDocPage) => p.id === input.activePageId)
        ? input.activePageId
        : ensuredPages[0].id

    return {
      pages: ensuredPages,
      activePageId,
      updatedAt: typeof input?.updatedAt === 'number' ? input.updatedAt : 0,
    }
  }

  const encodeUpdate = (update: Uint8Array) => {
    const chunkSize = 0x8000
    let binary = ''
    for (let i = 0; i < update.length; i += chunkSize) {
      const chunk = update.subarray(i, i + chunkSize)
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j])
      }
    }
    return btoa(binary)
  }

  const decodeUpdate = (encoded: string) => {
    const binary = atob(encoded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  }

  const colorForUserId = (id: string) => {
    const palette = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
    return palette[Math.abs(hash) % palette.length]
  }

  const getSelectionOffsetsInEditor = () => {
    const editor = editorRef.current
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

  const createRangeFromOffsets = (root: Node, start: number, end: number) => {
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

  const publishPresence = () => {
    const offsets = getSelectionOffsetsInEditor()
    if (!offsets || !channelRef.current) return
    const payload: CursorPresence = {
      userId: clientPresenceIdRef.current,
      color: colorForUserId(clientPresenceIdRef.current),
      pageId: doc.activePageId,
      selectionStart: offsets.selectionStart,
      selectionEnd: offsets.selectionEnd,
      at: Date.now(),
    }
    const asString = JSON.stringify(payload)
    if (asString === lastPresencePayloadRef.current) return
    lastPresencePayloadRef.current = asString
    channelRef.current.track(payload).catch(() => {})
  }

  const schedulePresencePublish = () => {
    if (presenceThrottleTimerRef.current) clearTimeout(presenceThrottleTimerRef.current)
    presenceThrottleTimerRef.current = setTimeout(() => {
      publishPresence()
    }, 60)
  }

  const updateRenderedRemoteCursors = (presenceState?: Record<string, any[]>) => {
    const editor = editorRef.current
    if (!editor || !doc.activePageId) return
    const state = presenceState || (channelRef.current?.presenceState?.() as Record<string, any[]>) || {}
    const editorRect = editor.getBoundingClientRect()
    const next: Array<{ id: string; label: string; color: string; left: number; top: number }> = []

    for (const [key, entries] of Object.entries(state)) {
      const data = Array.isArray(entries) && entries.length > 0 ? entries[entries.length - 1] : null
      if (!data) continue
      if (data.userId === clientPresenceIdRef.current || key === clientPresenceIdRef.current) continue
      if (data.pageId !== doc.activePageId) continue
      if (typeof data.selectionStart !== 'number' || typeof data.selectionEnd !== 'number') continue

      const end = Math.max(data.selectionStart, data.selectionEnd)
      const range = createRangeFromOffsets(editor, end, end)
      if (!range) continue
      const rect = range.getClientRects()[0] || range.getBoundingClientRect()
      if (!rect || (!rect.left && !rect.top && !rect.width && !rect.height)) continue

      next.push({
        id: data.userId || key,
        label: String(data.userId || key).slice(-6),
        color: data.color || colorForUserId(String(data.userId || key)),
        left: rect.left - editorRect.left,
        top: rect.top - editorRect.top,
      })
    }

    setRemoteCursors(next)
  }

  const calculateOnlineCount = (presenceState?: Record<string, any[]>) => {
    const state = presenceState || (channelRef.current?.presenceState?.() as Record<string, any[]>) || {}
    const now = Date.now()
    const ACTIVE_TTL_MS = 30000
    const uniqueUsers = new Set<string>()

    for (const entries of Object.values(state)) {
      if (!Array.isArray(entries)) continue
      for (const entry of entries) {
        if (!entry) continue
        const userId = typeof entry.userId === 'string' ? entry.userId : undefined
        const at = typeof entry.at === 'number' ? entry.at : 0
        if (!userId) continue
        if (at > 0 && now - at > ACTIVE_TTL_MS) continue
        uniqueUsers.add(userId)
      }
    }

    return Math.max(1, uniqueUsers.size)
  }

  const refreshPresenceUi = (presenceState?: Record<string, any[]>) => {
    if (isUnmountedRef.current) return
    setOnlineCount(calculateOnlineCount(presenceState))
    updateRenderedRemoteCursors(presenceState)
  }

  const getYCollections = () => {
    const yDoc = yDocRef.current
    if (!yDoc) return null
    const root = yDoc.getMap('root')
    const pages = yDoc.getMap<Y.Map<any>>('pages')
    const pageOrder = yDoc.getArray<string>('pageOrder')
    return { yDoc, root, pages, pageOrder }
  }

  const readDocFromY = (): ProjectDocData => {
    const collections = getYCollections()
    if (!collections) return DEFAULT_DOC
    const { root, pages, pageOrder } = collections

    const orderedIds = pageOrder.toArray().filter(id => pages.has(id))
    const missingIds = Array.from(pages.keys()).filter(id => !orderedIds.includes(id))
    const allIds = [...orderedIds, ...missingIds]

    const normalizedPages: ProjectDocPage[] = allIds.map(id => {
      const pageMap = pages.get(id)
      const titleText = pageMap?.get('title') as Y.Text | undefined
      const headerText = pageMap?.get('header') as Y.Text | undefined
      const htmlText = pageMap?.get('html') as Y.Text | undefined
      const footerText = pageMap?.get('footer') as Y.Text | undefined
      return {
        id,
        title: titleText?.toString()?.trim() || 'Untitled',
        header: headerText?.toString() || '',
        html: htmlText?.toString() || '<p></p>',
        footer: footerText?.toString() || '',
      }
    })

    const ensuredPages = normalizedPages.length > 0 ? normalizedPages : [createPage('Fane 1')]
    const rawActive = root.get('activePageId')
    const activePageId =
      typeof rawActive === 'string' && ensuredPages.some(page => page.id === rawActive)
        ? rawActive
        : ensuredPages[0].id
    const updatedAt = Number(root.get('updatedAt') || 0)

    return {
      pages: ensuredPages,
      activePageId,
      updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
    }
  }

  const initializeYDoc = (initialDoc: ProjectDocData) => {
    const yDoc = new Y.Doc()
    yDocRef.current = yDoc
    const root = yDoc.getMap('root')
    const pages = yDoc.getMap<Y.Map<any>>('pages')
    const pageOrder = yDoc.getArray<string>('pageOrder')

    yDoc.transact(() => {
      for (const page of initialDoc.pages) {
        const pageMap = new Y.Map<any>()
        const title = new Y.Text()
        title.insert(0, page.title || 'Untitled')
        const header = new Y.Text()
        header.insert(0, page.header || '')
        const html = new Y.Text()
        html.insert(0, page.html || '<p></p>')
        const footer = new Y.Text()
        footer.insert(0, page.footer || '')
        pageMap.set('title', title)
        pageMap.set('header', header)
        pageMap.set('html', html)
        pageMap.set('footer', footer)
        pages.set(page.id, pageMap)
      }
      pageOrder.insert(0, initialDoc.pages.map(page => page.id))
      root.set('activePageId', initialDoc.activePageId || initialDoc.pages[0]?.id || '')
      root.set('updatedAt', initialDoc.updatedAt || Date.now())
    }, 'init')
  }

  const updateStateFromY = () => {
    if (isUnmountedRef.current) return
    setDoc(readDocFromY())
  }

  const schedulePersist = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        setSaving(true)
        await saveProjectToolData(projectId, DOC_TOOL_SLUG, readDocFromY() as any)
        if (!isUnmountedRef.current) setSyncInfo('Alle ændringer gemt')
      } catch {
        if (!isUnmountedRef.current) setSyncInfo('Gem fejlede — prøver igen')
      } finally {
        if (!isUnmountedRef.current) setSaving(false)
      }
    }, 250)
  }

  const applyServerDocToY = (serverDoc: ProjectDocData) => {
    const collections = getYCollections()
    if (!collections) return
    const { yDoc, root, pages, pageOrder } = collections

    yDoc.transact(() => {
      const incomingIds = serverDoc.pages.map(p => p.id)
      const existingIds = Array.from(pages.keys())

      // Remove pages that no longer exist remotely.
      for (const existingId of existingIds) {
        if (!incomingIds.includes(existingId)) pages.delete(existingId)
      }

      // Upsert pages from server.
      for (const page of serverDoc.pages) {
        let pageMap = pages.get(page.id)
        if (!pageMap) {
          pageMap = new Y.Map<any>()
          pageMap.set('title', new Y.Text())
          pageMap.set('header', new Y.Text())
          pageMap.set('html', new Y.Text())
          pageMap.set('footer', new Y.Text())
          pages.set(page.id, pageMap)
        }
        const titleText = pageMap.get('title') as Y.Text
        const headerText = pageMap.get('header') as Y.Text
        const htmlText = pageMap.get('html') as Y.Text
        const footerText = pageMap.get('footer') as Y.Text
        applyTextDiff(titleText, page.title || 'Untitled')
        applyTextDiff(headerText, page.header || '')
        applyTextDiff(htmlText, page.html || '<p></p>')
        applyTextDiff(footerText, page.footer || '')
      }

      // Replace page order to match server.
      pageOrder.delete(0, pageOrder.length)
      pageOrder.insert(0, incomingIds)
      root.set('activePageId', serverDoc.activePageId)
      root.set('updatedAt', serverDoc.updatedAt)
    }, REMOTE_ORIGIN)
  }

  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      try {
        const serverData = await getProjectToolData(projectId, DOC_TOOL_SLUG)
        if (cancelled) return
        const normalized = normalizeDoc(serverData)
        initializeYDoc(normalized)
        updateStateFromY()
      } catch {
        if (cancelled) return
        initializeYDoc(normalizeDoc(DEFAULT_DOC))
        updateStateFromY()
        setSyncInfo('Kunne ikke hente nyeste version')
      } finally {
        if (!cancelled) setLoaded(true)
      }

      const yDoc = yDocRef.current
      if (!yDoc) return

      yDoc.on('update', async (update: Uint8Array, origin: any) => {
        lastYUpdateOriginRef.current = origin
        updateStateFromY()

        if (origin === REMOTE_ORIGIN) return
        if (!applyingRemoteRef.current) {
          try {
            await channelRef.current?.send({
              type: 'broadcast',
              event: 'y-update',
              payload: {
                from: clientPresenceIdRef.current,
                update: encodeUpdate(update),
              },
            })
            if (!isUnmountedRef.current) setSyncInfo('Synkroniserer…')
          } catch {
            if (!isUnmountedRef.current) setSyncInfo('Realtime afbrudt')
          }
        }
        if (origin === LOCAL_ORIGIN) {
          schedulePersist()
        }
      })

      const channel = supabase
        .channel(`project-docs:${projectId}`, {
          config: {
            broadcast: { self: false },
            presence: { key: clientPresenceIdRef.current },
          },
        })
        .on('broadcast', { event: 'y-update' }, ({ payload }: any) => {
          if (!payload?.update || payload?.from === clientPresenceIdRef.current) return
          const localYDoc = yDocRef.current
          if (!localYDoc) return
          try {
            applyingRemoteRef.current = true
            Y.applyUpdate(localYDoc, decodeUpdate(payload.update), REMOTE_ORIGIN)
            if (!isUnmountedRef.current) setSyncInfo('Synkroniseret realtime')
          } finally {
            applyingRemoteRef.current = false
          }
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState() as Record<string, any[]>
          refreshPresenceUi(state)
        })
        .on('presence', { event: 'join' }, () => {
          const state = channel.presenceState() as Record<string, any[]>
          refreshPresenceUi(state)
        })
        .on('presence', { event: 'leave' }, () => {
          const state = channel.presenceState() as Record<string, any[]>
          refreshPresenceUi(state)
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              userId: clientPresenceIdRef.current,
              color: colorForUserId(clientPresenceIdRef.current),
              pageId: doc.activePageId,
              selectionStart: 0,
              selectionEnd: 0,
              at: Date.now(),
            })
            if (!isUnmountedRef.current) setSyncInfo('Realtime aktiv')
            refreshPresenceUi(channel.presenceState() as Record<string, any[]>)
          }
        })

      channelRef.current = channel

      // DB-level realtime as primary cross-client sync signal.
      // This is more reliable than broadcast-only channels across sessions.
      const dbChannel = supabase
        .channel(`project-docs-db:${projectId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_tool_data',
            filter: `project_id=eq.${projectId}`,
          },
          async (payload: any) => {
            const row = payload?.new || payload?.old
            if (!row || row.tool_slug !== DOC_TOOL_SLUG) return
            if (isSyncingFromServerRef.current) return
            try {
              isSyncingFromServerRef.current = true
              const serverData = await getProjectToolData(projectId, DOC_TOOL_SLUG)
              const normalized = normalizeDoc(serverData)
              const localDoc = readDocFromY()
              if (JSON.stringify(normalized) !== JSON.stringify(localDoc)) {
                applyServerDocToY(normalized)
                if (!isUnmountedRef.current) setSyncInfo('Synkroniseret')
              }
            } catch {
              // Keep UI responsive even if one sync pull fails.
            } finally {
              isSyncingFromServerRef.current = false
            }
          }
        )
        .subscribe()

      dbChannelRef.current = dbChannel

      // Keep presence UI aligned across clients even through reconnect jitter.
      presenceRefreshTimerRef.current = setInterval(() => {
        const state = channelRef.current?.presenceState?.() as Record<string, any[]> | undefined
        refreshPresenceUi(state)
      }, 1200)

      // Reconcile with persisted state periodically as a safety net.
      // This catches rare missed realtime events without requiring refresh.
      reconcileTimerRef.current = setInterval(async () => {
        if (isUnmountedRef.current || isSyncingFromServerRef.current) return
        try {
          isSyncingFromServerRef.current = true
          const serverData = await getProjectToolData(projectId, DOC_TOOL_SLUG)
          const normalized = normalizeDoc(serverData)
          const localDoc = readDocFromY()
          const isLikelyTyping = Date.now() - lastLocalEditAtRef.current < 350
          const serverSnapshot = JSON.stringify(normalized)
          const localSnapshot = JSON.stringify(localDoc)

          // Apply server changes whenever content diverges (not only timestamps),
          // but avoid hard-overwriting in the middle of a local keystroke burst.
          if (!isLikelyTyping && serverSnapshot !== localSnapshot) {
            applyServerDocToY(normalized)
            if (!isUnmountedRef.current) setSyncInfo('Synkroniseret')
          }
        } catch {
          // Silent: realtime channel remains primary
        } finally {
          isSyncingFromServerRef.current = false
        }
      }, 500)
    }

    boot()

    return () => {
      cancelled = true
      isUnmountedRef.current = true
      if (reconcileTimerRef.current) {
        clearInterval(reconcileTimerRef.current)
        reconcileTimerRef.current = null
      }
      if (presenceRefreshTimerRef.current) {
        clearInterval(presenceRefreshTimerRef.current)
        presenceRefreshTimerRef.current = null
      }
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (presenceThrottleTimerRef.current) clearTimeout(presenceThrottleTimerRef.current)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (dbChannelRef.current) {
        supabase.removeChannel(dbChannelRef.current)
        dbChannelRef.current = null
      }
      if (yDocRef.current) {
        yDocRef.current.destroy()
        yDocRef.current = null
      }
    }
  }, [projectId])

  const applyTextDiff = (yText: Y.Text, nextValue: string) => {
    const prev = yText.toString()
    if (prev === nextValue) return
    let start = 0
    const prevLen = prev.length
    const nextLen = nextValue.length
    while (start < prevLen && start < nextLen && prev[start] === nextValue[start]) start++
    let endPrev = prevLen - 1
    let endNext = nextLen - 1
    while (endPrev >= start && endNext >= start && prev[endPrev] === nextValue[endNext]) {
      endPrev--
      endNext--
    }
    const deleteLen = Math.max(0, endPrev - start + 1)
    const insertText = nextValue.slice(start, endNext + 1)
    if (deleteLen > 0) yText.delete(start, deleteLen)
    if (insertText) yText.insert(start, insertText)
  }

  const handleContentChange = (content: string) => {
    if (!canEdit) return
    lastLocalEditAtRef.current = Date.now()
    const collections = getYCollections()
    if (!collections) return
    const { yDoc, root, pages } = collections
    const activePageId = root.get('activePageId')
    if (typeof activePageId !== 'string') return
    const pageMap = pages.get(activePageId)
    const html = pageMap?.get('html') as Y.Text | undefined
    if (!html) return

    yDoc.transact(() => {
      applyTextDiff(html, content || '<p></p>')
      root.set('updatedAt', Date.now())
    }, LOCAL_ORIGIN)
  }

  const handleDocumentTitleChange = (title: string) => {
    if (!canEdit) return
    lastLocalEditAtRef.current = Date.now()
    const collections = getYCollections()
    if (!collections) return
    const { yDoc, root, pages } = collections
    const activePageId = root.get('activePageId')
    if (typeof activePageId !== 'string') return
    const pageMap = pages.get(activePageId)
    const titleText = pageMap?.get('title') as Y.Text | undefined
    if (!titleText) return

    yDoc.transact(() => {
      applyTextDiff(titleText, title || 'Untitled')
      root.set('updatedAt', Date.now())
    }, LOCAL_ORIGIN)
  }

  const handleHeaderChange = (headerValue: string) => {
    if (!canEdit) return
    lastLocalEditAtRef.current = Date.now()
    const collections = getYCollections()
    if (!collections) return
    const { yDoc, root, pages } = collections
    const activePageId = root.get('activePageId')
    if (typeof activePageId !== 'string') return
    const pageMap = pages.get(activePageId)
    const headerText = pageMap?.get('header') as Y.Text | undefined
    if (!headerText) return

    yDoc.transact(() => {
      applyTextDiff(headerText, headerValue)
      root.set('updatedAt', Date.now())
    }, LOCAL_ORIGIN)
  }

  const handleFooterChange = (footerValue: string) => {
    if (!canEdit) return
    lastLocalEditAtRef.current = Date.now()
    const collections = getYCollections()
    if (!collections) return
    const { yDoc, root, pages } = collections
    const activePageId = root.get('activePageId')
    if (typeof activePageId !== 'string') return
    const pageMap = pages.get(activePageId)
    const footerText = pageMap?.get('footer') as Y.Text | undefined
    if (!footerText) return

    yDoc.transact(() => {
      applyTextDiff(footerText, footerValue)
      root.set('updatedAt', Date.now())
    }, LOCAL_ORIGIN)
  }

  const setActivePage = (pageId: string) => {
    lastLocalEditAtRef.current = Date.now()
    const collections = getYCollections()
    if (!collections) return
    const { yDoc, root } = collections
    yDoc.transact(() => {
      root.set('activePageId', pageId)
      root.set('updatedAt', Date.now())
    }, LOCAL_ORIGIN)
  }

  const addPage = () => {
    if (!canEdit) return
    lastLocalEditAtRef.current = Date.now()
    const collections = getYCollections()
    if (!collections) return
    const { yDoc, root, pages, pageOrder } = collections
    const nextTitle = `Fane ${doc.pages.length + 1}`
    const page = createPage(nextTitle)

    yDoc.transact(() => {
      const pageMap = new Y.Map<any>()
      const title = new Y.Text()
      title.insert(0, page.title)
      const html = new Y.Text()
      html.insert(0, page.html)
      pageMap.set('title', title)
      pageMap.set('html', html)
      pages.set(page.id, pageMap)
      pageOrder.push([page.id])
      root.set('activePageId', page.id)
      root.set('updatedAt', Date.now())
    }, LOCAL_ORIGIN)
  }

  const removePage = (pageId: string) => {
    if (!canEdit || doc.pages.length === 1) return
    lastLocalEditAtRef.current = Date.now()
    const collections = getYCollections()
    if (!collections) return
    const { yDoc, root, pages, pageOrder } = collections

    yDoc.transact(() => {
      pages.delete(pageId)
      const ids = pageOrder.toArray()
      const index = ids.indexOf(pageId)
      if (index >= 0) pageOrder.delete(index, 1)
      const remainingIds = pageOrder.toArray().filter(id => pages.has(id))
      if (remainingIds.length > 0) {
        const active = root.get('activePageId')
        if (typeof active !== 'string' || !remainingIds.includes(active)) {
          root.set('activePageId', remainingIds[0])
        }
      }
      root.set('updatedAt', Date.now())
    }, LOCAL_ORIGIN)
  }

  const exec = (command: string, value?: string) => {
    if (!canEdit || mode === 'viewing') return
    const selection = window.getSelection()
    if (selectionRangeRef.current && selection) {
      selection.removeAllRanges()
      selection.addRange(selectionRangeRef.current)
    }
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    if (window.getSelection && window.getSelection()?.rangeCount) {
      selectionRangeRef.current = window.getSelection()!.getRangeAt(0).cloneRange()
    }
    const html = editorRef.current?.innerHTML || '<p></p>'
    handleContentChange(html)
  }

  const insertHtml = (html: string) => {
    if (!canEdit || mode === 'viewing') return
    editorRef.current?.focus()
    document.execCommand('insertHTML', false, html)
    const currentHtml = editorRef.current?.innerHTML || '<p></p>'
    handleContentChange(currentHtml)
    rememberSelection()
  }

  const insertElement = (type: string, innerHtml: string) => {
    insertHtml(
      `<div data-insert-type="${type}" style="position:relative;border:1px dashed #D1D5DB;border-radius:8px;padding:8px 10px;margin:10px 0;background:#fff;">${innerHtml}</div><p></p>`
    )
  }

  const removeSelectedInsertElement = () => {
    if (!canEdit || mode === 'viewing') return
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection || selection.rangeCount === 0) return
    const anchorNode = selection.anchorNode
    const anchorEl =
      anchorNode instanceof Element
        ? anchorNode
        : anchorNode?.parentElement || null
    if (!anchorEl) return

    const removable = anchorEl.closest('[data-insert-type], [data-docs-toc="true"]') as HTMLElement | null
    if (!removable || !editor.contains(removable)) return
    removable.remove()
    const currentHtml = editor.innerHTML || '<p></p>'
    handleContentChange(currentHtml)
    rememberSelection()
  }

  const insertColumns = () => {
    insertHtml('<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;"><div><p>Kolonne 1</p></div><div><p>Kolonne 2</p></div></div><p></p>')
  }

  const rememberSelection = () => {
    const editorEl = editorRef.current
    const selection = window.getSelection()
    if (!editorEl || !selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    if (editorEl.contains(range.commonAncestorContainer)) {
      selectionRangeRef.current = range.cloneRange()
      schedulePresencePublish()
    }
  }

  const exportToPdf = () => {
    const activePage = doc.pages.find(page => page.id === doc.activePageId) || doc.pages[0]
    const htmlContent = editorRef.current?.innerHTML || activePage?.html || '<p></p>'
    const win = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800')
    if (!win) return

    const safeTitle = (activePage?.title || 'project-doc').replace(/[^\w\s-]/g, '').trim() || 'project-doc'
    const safeHeader = activePage?.header || ''
    const safeFooter = activePage?.footer || ''
    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${safeTitle}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 16mm; }
            body { font-family: Georgia, Cambria, "Times New Roman", Times, serif; color: #111827; }
            .doc-shell { min-height: calc(297mm - 32mm); display: flex; flex-direction: column; }
            .doc-header { border-bottom: 1px solid #E5E7EB; min-height: 1.27cm; margin-bottom: 8mm; font-size: 12px; color: #4B5563; display:flex; align-items:flex-end; padding-bottom: 2mm; }
            .doc-content { flex: 1; }
            .doc-footer { border-top: 1px solid #E5E7EB; min-height: 1.27cm; margin-top: 8mm; font-size: 12px; color: #6B7280; text-align: right; display:flex; align-items:flex-start; justify-content:flex-end; padding-top: 2mm; }
            h1, h2, h3 { margin: 0 0 12px; }
            p { line-height: 1.7; margin: 0 0 10px; }
            ul, ol { margin: 0 0 12px 22px; }
            blockquote { margin: 0 0 12px; padding-left: 12px; border-left: 3px solid #D1D5DB; color: #374151; }
            table { border-collapse: collapse; width: 100%; margin: 10px 0; }
            td, th { border: 1px solid #E5E7EB; padding: 6px 8px; }
          </style>
        </head>
        <body>
          <div class="doc-shell">
            <div class="doc-header">${safeHeader || '&nbsp;'}</div>
            <div class="doc-content">
              <h1>${activePage?.title || 'Untitled document'}</h1>
              ${htmlContent}
            </div>
            <div class="doc-footer">${safeFooter || '&nbsp;'}</div>
          </div>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 150)
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await docsShellRef.current?.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // Ignore unsupported fullscreen API errors
    }
  }

  const getWordCount = () => {
    const text = (editorRef.current?.innerText || '').trim()
    if (!text) return 0
    return text.split(/\s+/).length
  }

  const runTranslateDocument = () => {
    const text = editorRef.current?.innerText?.trim() || ''
    if (!text) return
    const to = window.prompt('Oversæt dokument til (fx en, de, fr)', 'en')
    if (!to) return
    insertHtml(`<p><em>Oversættelse (${to}) placeholder:</em></p><p>${text.slice(0, 1200)}</p><p></p>`)
  }

  const insertTableOfContents = () => {
    const editor = editorRef.current
    if (!editor) return
    const headings = Array.from(editor.querySelectorAll('h1, h2, h3')) as HTMLElement[]
    if (headings.length === 0) {
      insertElement('toc', '<div data-docs-toc="true"><strong>Indholdsfortegnelse</strong><p><em>Ingen overskrifter endnu (brug H1/H2/H3).</em></p></div>')
      return
    }
    const slugify = (text: string) =>
      text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9æøå\s-]/gi, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')

    const items = headings
      .map((h, index) => {
        const text = (h.innerText || h.textContent || '').trim() || `Afsnit ${index + 1}`
        const id = h.id || `toc-${slugify(text) || index + 1}-${index + 1}`
        h.id = id
        const level = Number(h.tagName.replace('H', '')) || 1
        const indent = Math.max(0, level - 1) * 14
        return `<li style="margin:4px 0 4px ${indent}px;"><a href="#${id}" style="color:#1D4ED8;text-decoration:none;">${text}</a></li>`
      })
      .join('')

    insertElement('toc', `<div data-docs-toc="true" style="padding:10px 12px;border:1px solid #E5E7EB;border-radius:8px;background:#F9FAFB;"><strong>Indholdsfortegnelse</strong><ul style="margin:8px 0 0 0;padding:0;list-style:none;">${items}</ul></div>`)
  }

  const insertFootnote = () => {
    const note = window.prompt('Fodnote tekst')
    if (!note) return
    const marker = `<sup style="font-size:10px;color:#6B7280;">[${Date.now().toString().slice(-3)}]</sup>`
    const footnote = `<p style="font-size:12px;color:#6B7280;margin-top:6px;"><em>Fodnote:</em> ${note}</p>`
    insertElement('footnote', `${marker}${footnote}`)
  }

  const saveStatus = useMemo(() => {
    if (!loaded) return 'Indlæser dokument…'
    if (saving) return 'Gemmer…'
    return syncInfo
  }, [loaded, saving, syncInfo])

  const activePage = doc.pages.find(page => page.id === doc.activePageId) || doc.pages[0]

  useEffect(() => {
    if (!editorRef.current || !activePage) return
    const isNewPage = lastRenderedPageIdRef.current !== activePage.id
    const hasDifferentHtml = editorRef.current.innerHTML !== (activePage.html || '<p></p>')
    const editorFocused = document.activeElement === editorRef.current
    const lastOrigin = lastYUpdateOriginRef.current
    if (!isNewPage && !hasDifferentHtml) return
    // Keep local typing smooth by not force-rendering local updates while focused.
    if (!isNewPage && editorFocused && lastOrigin === LOCAL_ORIGIN) return

    // For remote updates, do update immediately (best-effort selection preserve).
    if (!isNewPage && editorFocused && lastOrigin === REMOTE_ORIGIN) {
      const selection = window.getSelection()
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null
      editorRef.current.innerHTML = activePage.html || '<p></p>'
      if (range && selection) {
        try {
          selection.removeAllRanges()
          selection.addRange(range)
        } catch {
          // Ignore if range can no longer be restored after remote DOM update
        }
      }
      lastRenderedPageIdRef.current = activePage.id
      return
    }

    editorRef.current.innerHTML = activePage.html || '<p></p>'
    lastRenderedPageIdRef.current = activePage.id
  }, [activePage?.id, activePage?.html])

  useEffect(() => {
    schedulePresencePublish()
    // Recompute rendered cursor positions after page switches/renders.
    const t = setTimeout(() => updateRenderedRemoteCursors(), 80)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.activePageId, activePage?.html])

  const toolbarButtonStyle: React.CSSProperties = {
    border: '1px solid #D1D5DB',
    background: '#fff',
    color: '#374151',
    borderRadius: 8,
    padding: '5px 8px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
  }

  return (
    <div
      ref={docsShellRef}
      style={{
        position: 'fixed',
        top: 56,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#F5F6F8',
        overflow: 'auto',
        padding: '16px',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          background: '#F5F6F8',
          border: '1px solid #E7EAF0',
          borderRadius: 18,
          boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            background: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Projekt Docs</div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#92400E',
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: 999,
                padding: '2px 8px',
              }}
            >
              Beta / WIP
            </span>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowInsertMenu(v => !v)}
                style={{
                  border: '1px solid #D1D5DB',
                  background: '#fff',
                  color: '#374151',
                  borderRadius: 8,
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Indsæt ▾
              </button>
              {showInsertMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    zIndex: 60,
                    width: 280,
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    boxShadow: '0 18px 32px rgba(0,0,0,0.12)',
                    padding: 10,
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <button type="button" onClick={() => insertElement('image', '<img src=\"https://placehold.co/900x380?text=Billede\" alt=\"Billede\" style=\"max-width:100%;height:auto;border:1px solid #e5e7eb;border-radius:8px;\" />')} style={toolbarButtonStyle}>Billede</button>
                  <button type="button" onClick={() => insertElement('table', '<table style=\"width:100%;border-collapse:collapse;\"><tr><th style=\"border:1px solid #d1d5db;padding:6px;\">Kolonne 1</th><th style=\"border:1px solid #d1d5db;padding:6px;\">Kolonne 2</th></tr><tr><td style=\"border:1px solid #d1d5db;padding:6px;\">Data</td><td style=\"border:1px solid #d1d5db;padding:6px;\">Data</td></tr></table>')} style={toolbarButtonStyle}>Tabel</button>
                  <button type="button" onClick={() => insertElement('blocks', '<div style=\"display:flex;gap:8px;flex-wrap:wrap;\"><span style=\"padding:4px 8px;border-radius:999px;background:#E0F2FE;border:1px solid #7DD3FC;\">Byggeklods</span><span style=\"padding:4px 8px;border-radius:999px;background:#F3E8FF;border:1px solid #D8B4FE;\">Byggeklods</span></div>')} style={toolbarButtonStyle}>Byggeklodser</button>
                  <button type="button" onClick={() => insertElement('smartchip', '<span style=\"display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border-radius:999px;background:#FEF3C7;border:1px solid #FCD34D;font-size:12px;\">Smartchip</span>')} style={toolbarButtonStyle}>Smartchips</button>
                  <button type="button" onClick={() => insertElement('audio-button', '<button style=\"padding:6px 10px;border-radius:8px;border:1px solid #d1d5db;background:#fff;\">🔊 Afspil lyd</button>')} style={toolbarButtonStyle}>Knapper til lyd</button>
                  <button type="button" onClick={() => insertElement('signature', '<div style=\"padding:8px 12px;border:1px dashed #9CA3AF;border-radius:8px;display:inline-block;\">✍️ Elektronisk underskrift</div>')} style={toolbarButtonStyle}>Elektronisk underskrift</button>
                  <button type="button" onClick={() => { const url = window.prompt('Indsæt link (https://...)'); if (url) exec('createLink', url) }} style={toolbarButtonStyle}>Link</button>
                  <button type="button" onClick={() => insertElement('diagram', '<svg width=\"520\" height=\"180\" viewBox=\"0 0 520 180\"><rect x=\"20\" y=\"20\" width=\"140\" height=\"48\" rx=\"8\" fill=\"#DBEAFE\" stroke=\"#60A5FA\"/><rect x=\"200\" y=\"20\" width=\"140\" height=\"48\" rx=\"8\" fill=\"#DCFCE7\" stroke=\"#4ADE80\"/><rect x=\"380\" y=\"20\" width=\"120\" height=\"48\" rx=\"8\" fill=\"#FEF3C7\" stroke=\"#F59E0B\"/><line x1=\"160\" y1=\"44\" x2=\"200\" y2=\"44\" stroke=\"#6B7280\" stroke-width=\"2\"/><line x1=\"340\" y1=\"44\" x2=\"380\" y2=\"44\" stroke=\"#6B7280\" stroke-width=\"2\"/></svg>')} style={toolbarButtonStyle}>Tegning / Diagram</button>
                  <button type="button" onClick={() => insertElement('symbols', '<div style=\"font-size:24px;letter-spacing:6px;\">◆ ● ▲ ■ ✦ ✓ ✗</div>')} style={toolbarButtonStyle}>Symboler</button>
                  <button type="button" onClick={() => addPage()} style={toolbarButtonStyle}>Fane</button>
                  <button type="button" onClick={() => insertElement('horizontal-rule', '<hr style=\"border:none;border-top:1px solid #D1D5DB;margin:8px 0;\" />')} style={toolbarButtonStyle}>Vandret streg</button>
                  <button type="button" onClick={() => insertElement('page-break', '<div style=\"height:1px;border-top:2px dashed #9CA3AF;margin:10px 0;\"></div><div style=\"font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;\">Side-/kolonneskift</div>')} style={toolbarButtonStyle}>Side-/kolonneskift</button>
                  <button
                    type="button"
                    onClick={() => {
                      const name = window.prompt('Bogmærke-navn')
                      if (name) insertElement('bookmark', `<a id=\"bookmark-${name.replaceAll(' ', '-')}\" style=\"display:inline-block;padding:2px 6px;border:1px solid #E5E7EB;border-radius:6px;background:#F9FAFB;font-size:11px;\">🔖 ${name}</a>`)
                    }}
                    style={toolbarButtonStyle}
                  >
                    Bogmærke
                  </button>
                  <div
                    style={{ position: 'relative' }}
                    onMouseEnter={() => setShowSideElementsSubmenu(true)}
                    onMouseLeave={() => setShowSideElementsSubmenu(false)}
                  >
                    <button type="button" style={{ ...toolbarButtonStyle, width: '100%', textAlign: 'left' }}>
                      Sideelementer ▸
                    </button>
                    {showSideElementsSubmenu && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 'calc(100% + 8px)',
                          zIndex: 70,
                          width: 280,
                          background: '#fff',
                          border: '1px solid #E5E7EB',
                          borderRadius: 12,
                          boxShadow: '0 18px 32px rgba(0,0,0,0.12)',
                          padding: 8,
                          display: 'grid',
                          gap: 6,
                        }}
                      >
                        <button type="button" onClick={insertTableOfContents} style={toolbarButtonStyle}>Indholdsfortegnelse</button>
                        <button type="button" onClick={() => headerInputRef.current?.focus()} style={toolbarButtonStyle}>Sidehoved</button>
                        <button type="button" onClick={() => footerInputRef.current?.focus()} style={toolbarButtonStyle}>Sidefod</button>
                        <button
                          type="button"
                          onClick={() => {
                            const value = window.prompt('Vandmærke tekst', watermarkText || 'Udkast')
                            if (value !== null) setWatermarkText(value.trim())
                          }}
                          style={toolbarButtonStyle}
                        >
                          Vandmærke
                        </button>
                        <button type="button" onClick={() => setShowPageNumbers(v => !v)} style={toolbarButtonStyle}>
                          Sidetal: {showPageNumbers ? 'Til' : 'Fra'}
                        </button>
                        <button type="button" onClick={insertFootnote} style={toolbarButtonStyle}>Fodnote</button>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={removeSelectedInsertElement} style={toolbarButtonStyle}>
                    Slet indsat element
                  </button>
                  <button type="button" onClick={() => setShowCommentsPanel(v => !v)} style={toolbarButtonStyle}>Kommenter</button>
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowViewMenu(v => !v)}
                style={{
                  border: '1px solid #D1D5DB',
                  background: '#fff',
                  color: '#374151',
                  borderRadius: 8,
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Visning ▾
              </button>
              {showViewMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    zIndex: 60,
                    width: 330,
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    boxShadow: '0 18px 32px rgba(0,0,0,0.12)',
                    padding: 10,
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <button type="button" onClick={() => setMode(m => (m === 'editing' ? 'viewing' : 'editing'))} style={toolbarButtonStyle}>
                    Tilstand: {mode === 'editing' ? 'Redigering' : 'Visning'}
                  </button>
                  <button type="button" onClick={() => setShowCommentsPanel(v => !v)} style={toolbarButtonStyle}>
                    Kommentarer: {showCommentsPanel ? 'Vises' : 'Skjult'}
                  </button>
                  <button type="button" onClick={() => setHideSidebar(v => !v)} style={toolbarButtonStyle}>
                    Skjul sidebjælken: {hideSidebar ? 'Ja' : 'Nej'}
                  </button>
                  <button type="button" onClick={() => setShowPrintLayout(v => !v)} style={toolbarButtonStyle}>
                    Vis udskriftslayout: {showPrintLayout ? 'Ja' : 'Nej'}
                  </button>
                  <button type="button" onClick={() => setShowRuler(v => !v)} style={toolbarButtonStyle}>
                    Vis lineal: {showRuler ? 'Ja' : 'Nej'}
                  </button>
                  <button type="button" onClick={() => setShowEquationToolbar(v => !v)} style={toolbarButtonStyle}>
                    Vis ligningsværktøjslinje: {showEquationToolbar ? 'Ja' : 'Nej'}
                  </button>
                  <button type="button" onClick={() => setShowInvisibleChars(v => !v)} style={toolbarButtonStyle}>
                    Vis usynlige tegn: {showInvisibleChars ? 'Ja' : 'Nej'}
                  </button>
                  <button type="button" onClick={toggleFullscreen} style={toolbarButtonStyle}>
                    Fuld skærm
                  </button>
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowFormatMenu(v => !v)}
                style={{
                  border: '1px solid #D1D5DB',
                  background: '#fff',
                  color: '#374151',
                  borderRadius: 8,
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Formatér ▾
              </button>
              {showFormatMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    zIndex: 60,
                    width: 360,
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    boxShadow: '0 18px 32px rgba(0,0,0,0.12)',
                    padding: 10,
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <button type="button" onClick={() => exec('bold')} style={toolbarButtonStyle}>Tekst</button>
                  <button type="button" onClick={() => exec('formatBlock', '<H2>')} style={toolbarButtonStyle}>Afsnitsstile</button>
                  <button type="button" onClick={() => exec('justifyLeft')} style={toolbarButtonStyle}>Juster og indryk</button>
                  <button
                    type="button"
                    onClick={() => {
                      const value = window.prompt('Linjeafstand (fx 1.2, 1.5, 1.7, 2.0)', String(lineSpacing))
                      const parsed = Number(value)
                      if (Number.isFinite(parsed) && parsed > 0.8 && parsed < 4) setLineSpacing(parsed)
                    }}
                    style={toolbarButtonStyle}
                  >
                    Linje- og afsnitsafstand
                  </button>
                  <button type="button" onClick={insertColumns} style={toolbarButtonStyle}>Kolonner</button>
                  <button type="button" onClick={() => exec('insertUnorderedList')} style={toolbarButtonStyle}>Punkttegn og nummerering</button>
                  <button type="button" onClick={() => headerInputRef.current?.focus()} style={toolbarButtonStyle}>Sidehoveder og sidefødder</button>
                  <button type="button" onClick={() => setShowPageNumbers(v => !v)} style={toolbarButtonStyle}>
                    Sidetal: {showPageNumbers ? 'Til' : 'Fra'}
                  </button>
                  <button type="button" onClick={() => setPageOrientation(v => (v === 'portrait' ? 'landscape' : 'portrait'))} style={toolbarButtonStyle}>
                    Sideretning: {pageOrientation === 'portrait' ? 'Portræt' : 'Landskab'}
                  </button>
                  <button type="button" onClick={() => setShowPrintLayout(v => !v)} style={toolbarButtonStyle}>
                    Skift til formatet Uden sideinddeling: {showPrintLayout ? 'Nej' : 'Ja'}
                  </button>
                  <button type="button" onClick={() => insertHtml('<table style="width:100%;border-collapse:collapse;"><tr><th style="border:1px solid #d1d5db;padding:6px;">Kolonne 1</th><th style="border:1px solid #d1d5db;padding:6px;">Kolonne 2</th></tr><tr><td style="border:1px solid #d1d5db;padding:6px;">Data</td><td style="border:1px solid #d1d5db;padding:6px;">Data</td></tr></table><p></p>')} style={toolbarButtonStyle}>Tabel</button>
                  <button type="button" onClick={() => insertHtml('<img src=\"https://placehold.co/900x380?text=Billede\" alt=\"Billede\" style=\"max-width:100%;height:auto;border:1px solid #e5e7eb;border-radius:8px;\" /><p></p>')} style={toolbarButtonStyle}>Billede</button>
                  <button type="button" onClick={() => insertHtml('<hr style=\"border:none;border-top:2px solid #9CA3AF;margin:14px 0;\" />')} style={toolbarButtonStyle}>Kanter og linjer</button>
                  <button type="button" onClick={() => exec('removeFormat')} style={toolbarButtonStyle}>Ryd formatering</button>
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowToolsMenu(v => !v)}
                style={{
                  border: '1px solid #D1D5DB',
                  background: '#fff',
                  color: '#374151',
                  borderRadius: 8,
                  padding: '5px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Værktøjer ▾
              </button>
              {showToolsMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    zIndex: 60,
                    width: 360,
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    boxShadow: '0 18px 32px rgba(0,0,0,0.12)',
                    padding: 10,
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <button type="button" onClick={() => window.alert('Stave-/grammatikkontrol kan tilkobles med browser eller ekstern API.')} style={toolbarButtonStyle}>
                    Stavemåde og grammatik
                  </button>
                  <button type="button" onClick={() => window.alert(`Antal ord: ${getWordCount()}`)} style={toolbarButtonStyle}>
                    Antal ord
                  </button>
                  <button type="button" onClick={() => window.alert('Gennemse foreslåede redigeringer: kommende collaborative feature')} style={toolbarButtonStyle}>
                    Gennemse foreslåede redigeringer
                  </button>
                  <button type="button" onClick={() => insertHtml('<blockquote>Henvisning: [indsæt kilde]</blockquote><p></p>')} style={toolbarButtonStyle}>
                    Henvisninger
                  </button>
                  <button type="button" onClick={() => insertHtml('<div style=\"margin:10px 0;padding:8px 12px;border:1px dashed #9CA3AF;border-radius:8px;display:inline-block;\">✍️ Elektronisk underskrift</div><p></p>')} style={toolbarButtonStyle}>
                    Elektronisk underskrift
                  </button>
                  <button type="button" onClick={() => setShowLineNumbers(v => !v)} style={toolbarButtonStyle}>
                    Linjenumre: {showLineNumbers ? 'Til' : 'Fra'}
                  </button>
                  <button type="button" onClick={() => insertHtml('<div style=\"padding:8px;border:1px solid #E5E7EB;border-radius:8px;background:#F8FAFC;\">Tilknyttet objekt: [indsæt link/id]</div><p></p>')} style={toolbarButtonStyle}>
                    Tilknyttede objekter
                  </button>
                  <button type="button" onClick={() => {
                    const word = window.prompt('Ordbog: slå ord op')
                    if (word) window.open(`https://ordnet.dk/ddo/ordbog?query=${encodeURIComponent(word)}`, '_blank')
                  }} style={toolbarButtonStyle}>
                    Ordbog
                  </button>
                  <button type="button" onClick={runTranslateDocument} style={toolbarButtonStyle}>
                    Oversæt dokument
                  </button>
                  <button type="button" onClick={() => insertHtml('<button style=\"padding:6px 10px;border-radius:8px;border:1px solid #d1d5db;background:#fff;\">🔊 Afspil lyd</button>')} style={toolbarButtonStyle}>
                    Lyd
                  </button>
                  <button type="button" onClick={() => window.alert('Gemini-assistent kan bruges via chat-panelet ✨')} style={toolbarButtonStyle}>
                    Gemini
                  </button>
                  <button type="button" onClick={() => window.alert('Notifikationsindstillinger: kommende')} style={toolbarButtonStyle}>
                    Notifikationsindstillinger
                  </button>
                  <button type="button" onClick={() => window.alert('Præferencer: kommende')} style={toolbarButtonStyle}>
                    Præferencer
                  </button>
                  <button type="button" onClick={() => window.alert('Tilgængelighed: kommende')} style={toolbarButtonStyle}>
                    Tilgængelighed
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={exportToPdf}
              style={{
                border: '1px solid #D1D5DB',
                background: '#fff',
                color: '#374151',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Eksportér PDF
            </button>
            <div style={{ fontSize: 12, color: '#64748B' }}>👥 {onlineCount} online</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{saveStatus}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: hideSidebar ? '1fr' : '230px 1fr', minHeight: 'calc(100vh - 140px)' }}>
          {!hideSidebar && <aside
            style={{
              borderRight: '1px solid #E5E7EB',
              background: '#F8FAFC',
              padding: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Dokumentfaner
              </div>
              <button
                type="button"
                onClick={addPage}
                disabled={!canEdit}
                style={{
                  ...toolbarButtonStyle,
                  padding: '4px 7px',
                  fontSize: 11,
                  opacity: canEdit ? 1 : 0.55,
                }}
              >
                + Fane
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {doc.pages.map(page => {
                const active = page.id === doc.activePageId
                return (
                  <div
                    key={page.id}
                    style={{
                      border: active ? '1px solid #BFDBFE' : '1px solid #E5E7EB',
                      background: active ? '#DBEAFE' : '#fff',
                      borderRadius: 10,
                      padding: '6px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setActivePage(page.id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#1E293B',
                        fontSize: 12,
                        textAlign: 'left',
                        cursor: 'pointer',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {page.title}
                    </button>
                    {canEdit && doc.pages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePage(page.id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#EF4444',
                          cursor: 'pointer',
                          fontSize: 14,
                          lineHeight: 1,
                        }}
                        title="Slet fane"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>}

          <section style={{ background: '#F3F4F6', overflow: 'auto' }}>
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 5,
                background: '#fff',
                borderBottom: '1px solid #E5E7EB',
                padding: '10px 12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              <select
                value={fontName}
                onMouseDown={e => e.preventDefault()}
                onChange={e => {
                  setFontName(e.target.value)
                  exec('fontName', e.target.value)
                }}
                style={toolbarButtonStyle}
              >
                <option value="Georgia">Georgia</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
                <option value="Courier New">Courier New</option>
              </select>
              <select
                value={fontSize}
                onMouseDown={e => e.preventDefault()}
                onChange={e => {
                  setFontSize(e.target.value)
                  exec('fontSize', e.target.value)
                }}
                style={toolbarButtonStyle}
              >
                <option value="2">Lille</option>
                <option value="3">Normal</option>
                <option value="4">Mellem</option>
                <option value="5">Stor</option>
                <option value="6">XL</option>
              </select>
              <button onMouseDown={e => e.preventDefault()} onClick={() => exec('formatBlock', '<H1>')} type="button" style={toolbarButtonStyle}>H1</button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => exec('formatBlock', '<H2>')} type="button" style={toolbarButtonStyle}>H2</button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => exec('formatBlock', '<P>')} type="button" style={toolbarButtonStyle}>P</button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => exec('bold')} type="button" style={toolbarButtonStyle}><b>B</b></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => exec('italic')} type="button" style={toolbarButtonStyle}><i>I</i></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => exec('underline')} type="button" style={toolbarButtonStyle}><u>U</u></button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => exec('insertUnorderedList')} type="button" style={toolbarButtonStyle}>• Liste</button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => exec('insertOrderedList')} type="button" style={toolbarButtonStyle}>1. Liste</button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => exec('justifyLeft')} type="button" style={toolbarButtonStyle}>Venstre</button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => exec('justifyCenter')} type="button" style={toolbarButtonStyle}>Center</button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => exec('justifyRight')} type="button" style={toolbarButtonStyle}>Højre</button>
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  const url = window.prompt('Indsæt link (https://...)')
                  if (url) exec('createLink', url)
                }}
                type="button"
                style={toolbarButtonStyle}
              >
                Link
              </button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => exec('removeFormat')} type="button" style={toolbarButtonStyle}>Ryd format</button>
              <input type="color" title="Tekstfarve" onMouseDown={e => e.preventDefault()} onChange={e => exec('foreColor', e.target.value)} />
              <input type="color" title="Markering" onMouseDown={e => e.preventDefault()} onChange={e => exec('hiliteColor', e.target.value)} />
              <button onMouseDown={e => e.preventDefault()} onClick={() => exec('undo')} type="button" style={toolbarButtonStyle}>Undo</button>
              <button onMouseDown={e => e.preventDefault()} onClick={() => exec('redo')} type="button" style={toolbarButtonStyle}>Redo</button>
            </div>
            {showRuler && (
              <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '2px 18px', fontSize: 10, color: '#9CA3AF', letterSpacing: '.02em' }}>
                {Array.from({ length: 21 }).map((_, i) => (
                  <span key={i} style={{ display: 'inline-block', width: '10mm', textAlign: 'center' }}>{i}</span>
                ))}
              </div>
            )}
            {showEquationToolbar && (
              <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '8px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onMouseDown={e => e.preventDefault()} onClick={() => insertHtml('<span>∑</span>')} type="button" style={toolbarButtonStyle}>∑</button>
                <button onMouseDown={e => e.preventDefault()} onClick={() => insertHtml('<span>∫</span>')} type="button" style={toolbarButtonStyle}>∫</button>
                <button onMouseDown={e => e.preventDefault()} onClick={() => insertHtml('<span>√x</span>')} type="button" style={toolbarButtonStyle}>√x</button>
                <button onMouseDown={e => e.preventDefault()} onClick={() => insertHtml('<span>x²</span>')} type="button" style={toolbarButtonStyle}>x²</button>
                <button onMouseDown={e => e.preventDefault()} onClick={() => insertHtml('<span>π</span>')} type="button" style={toolbarButtonStyle}>π</button>
              </div>
            )}

            <div style={{ padding: '18px 24px 36px' }}>
              <input
                value={activePage?.title || ''}
                onChange={e => handleDocumentTitleChange(e.target.value)}
                disabled={!canEdit}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 32,
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: 14,
                }}
              />

              <div
                style={{
                  width: '100%',
                  maxWidth: showPrintLayout ? (pageOrientation === 'portrait' ? '210mm' : '297mm') : '100%',
                  minHeight: showPrintLayout ? (pageOrientation === 'portrait' ? '297mm' : '210mm') : 'calc(100vh - 260px)',
                  margin: '0 auto',
                  position: 'relative',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  background: '#fff',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ borderBottom: '1px solid #E5E7EB', minHeight: '1.27cm', padding: '0.2cm 1.2cm', display: 'flex', alignItems: 'flex-end' }}>
                  <input
                    ref={headerInputRef}
                    value={activePage?.header || ''}
                    onChange={e => handleHeaderChange(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Header (fx projektnavn, dato, team)"
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 12,
                      color: '#4B5563',
                      fontStyle: activePage?.header ? 'normal' : 'italic',
                    }}
                  />
                </div>
                <div
                  onScroll={() => updateRenderedRemoteCursors()}
                  ref={editorRef}
                  contentEditable={canEdit}
                  suppressContentEditableWarning
                  onInput={e => handleContentChange((e.target as HTMLDivElement).innerHTML)}
                  onMouseUp={rememberSelection}
                  onKeyUp={rememberSelection}
                  onBlur={rememberSelection}
                  onClick={rememberSelection}
                  style={{
                    width: '100%',
                    minHeight: 'calc(297mm - 220px)',
                    flex: 1,
                    outline: 'none',
                    padding: '28px 42px',
                    fontSize: 16,
                    lineHeight: lineSpacing,
                    color: '#111827',
                    fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
                    background: canEdit ? '#fff' : '#FAFAFA',
                    letterSpacing: showInvisibleChars ? '0.2px' : undefined,
                    counterReset: showLineNumbers ? 'line' : undefined,
                  }}
                />
                {watermarkText && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        transform: 'rotate(-28deg)',
                        fontSize: 56,
                        fontWeight: 700,
                        color: 'rgba(107,114,128,0.12)',
                        letterSpacing: '.08em',
                        textTransform: 'uppercase',
                        userSelect: 'none',
                      }}
                    >
                      {watermarkText}
                    </div>
                  </div>
                )}
                {remoteCursors.map(cursor => (
                  <div
                    key={cursor.id}
                    style={{
                      position: 'absolute',
                      left: cursor.left,
                      top: cursor.top,
                      pointerEvents: 'none',
                      zIndex: 30,
                    }}
                  >
                    <div style={{ width: 2, height: 18, background: cursor.color, borderRadius: 2 }} />
                    <div
                      style={{
                        marginTop: 2,
                        background: cursor.color,
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 6,
                        padding: '2px 6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cursor.label}
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #E5E7EB', minHeight: '1.27cm', padding: '0.2cm 1.2cm', display: 'flex', alignItems: 'flex-start' }}>
                  <input
                    ref={footerInputRef}
                    value={activePage?.footer || ''}
                    onChange={e => handleFooterChange(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Footer (fx side nr., fortroligt, firma)"
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 12,
                      color: '#6B7280',
                      textAlign: 'right',
                      fontStyle: activePage?.footer ? 'normal' : 'italic',
                    }}
                  />
                  {showPageNumbers && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>Side 1</div>
                  )}
                </div>
              </div>
            </div>
          </section>
          {showCommentsPanel && (
            <aside style={{ width: 280, borderLeft: '1px solid #E5E7EB', background: '#fff', padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Kommentarer</div>
              <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
                Brug "Kommenter"-knappen til at åbne/lukke denne panelvisning.
                <br />
                Næste step kan være trådede kommentarer pr. tekst-markering.
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
