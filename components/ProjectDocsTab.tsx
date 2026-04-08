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
  html: string
}

type ProjectDocData = {
  pages: ProjectDocPage[]
  activePageId: string
  updatedAt: number
}

const DOC_TOOL_SLUG = 'project-docs'
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const createPage = (title = 'Fane 1'): ProjectDocPage => ({ id: createId(), title, html: '<p></p>' })
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
  const [syncInfo, setSyncInfo] = useState<string>('Forbinder…')
  const [fontName, setFontName] = useState('Georgia')
  const [fontSize, setFontSize] = useState('4')
  const editorRef = useRef<HTMLDivElement>(null)
  const lastRenderedPageIdRef = useRef<string>('')
  const selectionRangeRef = useRef<Range | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconcileTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isUnmountedRef = useRef(false)
  const yDocRef = useRef<Y.Doc | null>(null)
  const channelRef = useRef<any>(null)
  const applyingRemoteRef = useRef(false)
  const lastYUpdateOriginRef = useRef<any>(null)
  const isSyncingFromServerRef = useRef(false)
  const clientPresenceIdRef = useRef(`docs-${Math.random().toString(36).slice(2, 8)}`)

  const normalizeDoc = (input: any): ProjectDocData => {
    const pages = Array.isArray(input?.pages)
      ? input.pages
          .map((page: any) => ({
            id: typeof page?.id === 'string' ? page.id : createId(),
            title: typeof page?.title === 'string' && page.title.trim() ? page.title : 'Untitled',
            html: typeof page?.html === 'string' ? page.html : '<p></p>',
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
      const htmlText = pageMap?.get('html') as Y.Text | undefined
      return {
        id,
        title: titleText?.toString()?.trim() || 'Untitled',
        html: htmlText?.toString() || '<p></p>',
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
        const html = new Y.Text()
        html.insert(0, page.html || '<p></p>')
        pageMap.set('title', title)
        pageMap.set('html', html)
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
    }, 900)
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
          pageMap.set('html', new Y.Text())
          pages.set(page.id, pageMap)
        }
        const titleText = pageMap.get('title') as Y.Text
        const htmlText = pageMap.get('html') as Y.Text
        applyTextDiff(titleText, page.title || 'Untitled')
        applyTextDiff(htmlText, page.html || '<p></p>')
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
          const state = channel.presenceState()
          const count = Object.keys(state).length || 1
          if (!isUnmountedRef.current) setOnlineCount(count)
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              at: Date.now(),
              docsUser: clientPresenceIdRef.current,
            })
            if (!isUnmountedRef.current) setSyncInfo('Realtime aktiv')
          }
        })

      channelRef.current = channel

      // Reconcile with persisted state periodically as a safety net.
      // This catches rare missed realtime events without requiring refresh.
      reconcileTimerRef.current = setInterval(async () => {
        if (isUnmountedRef.current || isSyncingFromServerRef.current) return
        try {
          isSyncingFromServerRef.current = true
          const serverData = await getProjectToolData(projectId, DOC_TOOL_SLUG)
          const normalized = normalizeDoc(serverData)
          const localDoc = readDocFromY()
          if (normalized.updatedAt > localDoc.updatedAt) {
            applyServerDocToY(normalized)
            if (!isUnmountedRef.current) setSyncInfo('Synkroniseret')
          }
        } catch {
          // Silent: realtime channel remains primary
        } finally {
          isSyncingFromServerRef.current = false
        }
      }, 1500)
    }

    boot()

    return () => {
      cancelled = true
      isUnmountedRef.current = true
      if (reconcileTimerRef.current) {
        clearInterval(reconcileTimerRef.current)
        reconcileTimerRef.current = null
      }
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
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

  const setActivePage = (pageId: string) => {
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
    if (!canEdit) return
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

  const rememberSelection = () => {
    const editorEl = editorRef.current
    const selection = window.getSelection()
    if (!editorEl || !selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    if (editorEl.contains(range.commonAncestorContainer)) {
      selectionRangeRef.current = range.cloneRange()
    }
  }

  const exportToPdf = () => {
    const activePage = doc.pages.find(page => page.id === doc.activePageId) || doc.pages[0]
    const htmlContent = editorRef.current?.innerHTML || activePage?.html || '<p></p>'
    const win = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800')
    if (!win) return

    const safeTitle = (activePage?.title || 'project-doc').replace(/[^\w\s-]/g, '').trim() || 'project-doc'
    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${safeTitle}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 16mm; }
            body { font-family: Georgia, Cambria, "Times New Roman", Times, serif; color: #111827; }
            h1, h2, h3 { margin: 0 0 12px; }
            p { line-height: 1.7; margin: 0 0 10px; }
            ul, ol { margin: 0 0 12px 22px; }
            blockquote { margin: 0 0 12px; padding-left: 12px; border-left: 3px solid #D1D5DB; color: #374151; }
            table { border-collapse: collapse; width: 100%; margin: 10px 0; }
            td, th { border: 1px solid #E5E7EB; padding: 6px 8px; }
          </style>
        </head>
        <body>
          <h1>${activePage?.title || 'Untitled document'}</h1>
          ${htmlContent}
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 150)
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

  const toolbarButtonStyle: React.CSSProperties = {
    border: '1px solid #D1D5DB',
    background: '#fff',
    color: '#374151',
    borderRadius: 8,
    padding: '5px 8px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  }

  return (
    <div
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
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Projekt Docs</div>
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

        <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', minHeight: 'calc(100vh - 140px)' }}>
          <aside
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
          </aside>

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
                  maxWidth: 860,
                  minHeight: 'calc(100vh - 300px)',
                  margin: '0 auto',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  background: '#fff',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  ref={editorRef}
                  contentEditable={canEdit}
                  suppressContentEditableWarning
                  onInput={e => handleContentChange((e.target as HTMLDivElement).innerHTML)}
                  onMouseUp={rememberSelection}
                  onKeyUp={rememberSelection}
                  onBlur={rememberSelection}
                  style={{
                    width: '100%',
                    minHeight: 'calc(100vh - 320px)',
                    outline: 'none',
                    padding: '32px 42px',
                    fontSize: 16,
                    lineHeight: 1.7,
                    color: '#111827',
                    fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
                    background: canEdit ? '#fff' : '#FAFAFA',
                  }}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
