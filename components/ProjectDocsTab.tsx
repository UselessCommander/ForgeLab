'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getProjectToolData, saveProjectToolData } from '@/lib/projects'

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
const DEFAULT_DOC: ProjectDocData = {
  pages: [createPage('Fane 1')],
  activePageId: '',
  updatedAt: 0,
}

export default function ProjectDocsTab({ projectId, canEdit }: ProjectDocsTabProps) {
  const [doc, setDoc] = useState<ProjectDocData>(DEFAULT_DOC)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [syncInfo, setSyncInfo] = useState<string>('Forbinder…')
  const [fontName, setFontName] = useState('Georgia')
  const [fontSize, setFontSize] = useState('4')
  const editorRef = useRef<HTMLDivElement>(null)
  const docRef = useRef<ProjectDocData>(DEFAULT_DOC)
  const lastRenderedPageIdRef = useRef<string>('')
  const selectionRangeRef = useRef<Range | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUnmountedRef = useRef(false)

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

  const loadFromServer = async () => {
    try {
      const serverData = await getProjectToolData(projectId, DOC_TOOL_SLUG)
      const normalized = normalizeDoc(serverData)
      setDoc(prev => {
        if (dirty) return prev
        if (normalized.updatedAt > prev.updatedAt) return normalized
        if (!loaded) return normalized
        return prev
      })
      if (!dirty) setSyncInfo('Synkroniseret')
    } catch {
      setSyncInfo('Kunne ikke hente nyeste version')
    } finally {
      if (!loaded) setLoaded(true)
    }
  }

  const persistNow = async (nextDoc: ProjectDocData) => {
    try {
      setSaving(true)
      await saveProjectToolData(projectId, DOC_TOOL_SLUG, nextDoc as any)
      if (!isUnmountedRef.current) {
        setDirty(false)
        setSyncInfo('Alle ændringer gemt')
      }
    } catch {
      if (!isUnmountedRef.current) setSyncInfo('Gem fejlede — prøver igen')
    } finally {
      if (!isUnmountedRef.current) setSaving(false)
    }
  }

  useEffect(() => {
    docRef.current = doc
  }, [doc])

  useEffect(() => {
    loadFromServer()
    const pollTimer = setInterval(() => {
      loadFromServer()
    }, 2200)

    return () => {
      isUnmountedRef.current = true
      clearInterval(pollTimer)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, dirty])

  const handleContentChange = (content: string) => {
    if (!canEdit) return
    const currentDoc = docRef.current
    const nextDoc: ProjectDocData = {
      ...currentDoc,
      pages: currentDoc.pages.map(page => (page.id === currentDoc.activePageId ? { ...page, html: content } : page)),
      updatedAt: Date.now(),
    }
    docRef.current = nextDoc
    setDirty(true)
    setSyncInfo('Gemmer…')

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      persistNow(nextDoc)
    }, 700)
  }

  const handleDocumentTitleChange = (title: string) => {
    if (!canEdit) return
    const nextDoc: ProjectDocData = {
      ...doc,
      pages: doc.pages.map(page => (page.id === doc.activePageId ? { ...page, title } : page)),
      updatedAt: Date.now(),
    }
    setDoc(nextDoc)
    setDirty(true)
    setSyncInfo('Gemmer…')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      persistNow(nextDoc)
    }, 500)
  }

  const setActivePage = (pageId: string) => {
    setDoc(prev => ({ ...prev, activePageId: pageId }))
  }

  const addPage = () => {
    if (!canEdit) return
    const nextTitle = `Fane ${doc.pages.length + 1}`
    const page = createPage(nextTitle)
    const nextDoc: ProjectDocData = {
      ...doc,
      pages: [...doc.pages, page],
      activePageId: page.id,
      updatedAt: Date.now(),
    }
    setDoc(nextDoc)
    setDirty(true)
    setSyncInfo('Gemmer…')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => persistNow(nextDoc), 450)
  }

  const removePage = (pageId: string) => {
    if (!canEdit || doc.pages.length === 1) return
    const remaining = doc.pages.filter(page => page.id !== pageId)
    const nextActive = remaining.some(page => page.id === doc.activePageId) ? doc.activePageId : remaining[0].id
    const nextDoc: ProjectDocData = {
      ...doc,
      pages: remaining,
      activePageId: nextActive,
      updatedAt: Date.now(),
    }
    setDoc(nextDoc)
    setDirty(true)
    setSyncInfo('Gemmer…')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => persistNow(nextDoc), 450)
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
    if (lastRenderedPageIdRef.current === activePage.id) return
    editorRef.current.innerHTML = activePage.html || '<p></p>'
    lastRenderedPageIdRef.current = activePage.id
  }, [activePage])

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
