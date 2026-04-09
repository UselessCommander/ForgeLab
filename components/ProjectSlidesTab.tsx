'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { getProjectToolData, saveProjectToolData } from '@/lib/projects'

type ProjectSlidesTabProps = {
  projectId: string
  canEdit: boolean
}

type Slide = {
  id: string
  title: string
  html: string
}

type SlidesDoc = {
  slides: Slide[]
  activeSlideId: string
  updatedAt: number
}

const SLIDES_TOOL_SLUG = 'project-slides'

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const createSlide = (index: number): Slide => ({
  id: createId(),
  title: `Slide ${index}`,
  html: '<h2>Klik og redigér</h2><p>Skriv dit indhold her…</p>',
})

const DEFAULT_SLIDES_DOC: SlidesDoc = {
  slides: [createSlide(1)],
  activeSlideId: '',
  updatedAt: 0,
}

export default function ProjectSlidesTab({ projectId, canEdit }: ProjectSlidesTabProps) {
  const [doc, setDoc] = useState<SlidesDoc>(DEFAULT_SLIDES_DOC)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fontName, setFontName] = useState('Arial')
  const [fontSize, setFontSize] = useState('4')
  const editorRef = useRef<HTMLDivElement>(null)
  const lastRenderedSlideIdRef = useRef('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUnmountedRef = useRef(false)

  const normalizeSlidesDoc = (raw: any): SlidesDoc => {
    const rawSlides = Array.isArray(raw?.slides) ? raw.slides : []
    const slides = rawSlides
      .map((slide: any, index: number) => ({
        id: typeof slide?.id === 'string' && slide.id.trim() ? slide.id : createId(),
        title:
          typeof slide?.title === 'string' && slide.title.trim()
            ? slide.title.trim()
            : `Slide ${index + 1}`,
        html:
          typeof slide?.html === 'string' && slide.html.trim()
            ? slide.html
            : '<h2>Ny slide</h2><p>Tilføj indhold…</p>',
      }))
      .filter((slide: Slide) => slide.id)

    const ensuredSlides = slides.length > 0 ? slides : [createSlide(1)]
    const activeSlideId =
      typeof raw?.activeSlideId === 'string' &&
      ensuredSlides.some((slide: Slide) => slide.id === raw.activeSlideId)
        ? raw.activeSlideId
        : ensuredSlides[0].id

    return {
      slides: ensuredSlides,
      activeSlideId,
      updatedAt: typeof raw?.updatedAt === 'number' ? raw.updatedAt : Date.now(),
    }
  }

  const activeSlide = useMemo(
    () => doc.slides.find(slide => slide.id === doc.activeSlideId) || doc.slides[0],
    [doc]
  )

  const persist = (nextDoc: SlidesDoc) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        setSaving(true)
        await saveProjectToolData(projectId, SLIDES_TOOL_SLUG, nextDoc as any)
      } catch {
        // ignore save failures in UI, user can continue editing
      } finally {
        if (!isUnmountedRef.current) setSaving(false)
      }
    }, 350)
  }

  useEffect(() => {
    const boot = async () => {
      try {
        const data = await getProjectToolData(projectId, SLIDES_TOOL_SLUG)
        const normalized = normalizeSlidesDoc(data)
        setDoc(normalized)
      } catch {
        const normalized = normalizeSlidesDoc(DEFAULT_SLIDES_DOC)
        setDoc(normalized)
      } finally {
        setLoaded(true)
      }
    }
    boot()
    return () => {
      isUnmountedRef.current = true
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [projectId])

  useEffect(() => {
    let cancelled = false
    const onReload = () => {
      void (async () => {
        try {
          const data = await getProjectToolData(projectId, SLIDES_TOOL_SLUG)
          if (!cancelled) setDoc(normalizeSlidesDoc(data))
        } catch {
          /* behold nuværende doc */
        }
      })()
    }
    window.addEventListener('forgelab-reload-project-slides', onReload)
    return () => {
      cancelled = true
      window.removeEventListener('forgelab-reload-project-slides', onReload)
    }
  }, [projectId])

  useEffect(() => {
    if (!editorRef.current || !activeSlide) return
    const isNewSlide = lastRenderedSlideIdRef.current !== activeSlide.id
    const hasDifferentHtml = editorRef.current.innerHTML !== activeSlide.html
    if (!isNewSlide && !hasDifferentHtml) return
    editorRef.current.innerHTML = activeSlide.html
    lastRenderedSlideIdRef.current = activeSlide.id
  }, [activeSlide?.id, activeSlide?.html])

  const updateDoc = (updater: (current: SlidesDoc) => SlidesDoc) => {
    setDoc(prev => {
      const next = updater(prev)
      persist(next)
      return next
    })
  }

  const addSlide = () => {
    if (!canEdit) return
    updateDoc(current => {
      const slide = createSlide(current.slides.length + 1)
      return {
        slides: [...current.slides, slide],
        activeSlideId: slide.id,
        updatedAt: Date.now(),
      }
    })
  }

  const removeSlide = (slideId: string) => {
    if (!canEdit || doc.slides.length === 1) return
    updateDoc(current => {
      const nextSlides = current.slides.filter(slide => slide.id !== slideId)
      const nextActive =
        current.activeSlideId === slideId ? nextSlides[0]?.id || '' : current.activeSlideId
      return {
        slides: nextSlides,
        activeSlideId: nextActive,
        updatedAt: Date.now(),
      }
    })
  }

  const updateActiveSlideTitle = (title: string) => {
    if (!canEdit || !activeSlide) return
    updateDoc(current => ({
      ...current,
      slides: current.slides.map(slide =>
        slide.id === current.activeSlideId ? { ...slide, title } : slide
      ),
      updatedAt: Date.now(),
    }))
  }

  const updateActiveSlideHtml = (html: string) => {
    if (!canEdit || !activeSlide) return
    updateDoc(current => ({
      ...current,
      slides: current.slides.map(slide =>
        slide.id === current.activeSlideId ? { ...slide, html } : slide
      ),
      updatedAt: Date.now(),
    }))
  }

  const exec = (command: string, value?: string) => {
    if (!canEdit) return
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    updateActiveSlideHtml(editorRef.current?.innerHTML || '<p></p>')
  }

  if (!loaded) {
    return (
      <div style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF1F6' }}>
        <p style={{ color: '#64748B', fontSize: 14 }}>Indlæser slides…</p>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', top: 56, left: 0, right: 0, bottom: 0, background: '#EEF1F6', display: 'grid', gridTemplateColumns: '260px 1fr' }}>
      <aside style={{ borderRight: '1px solid #DDE3EE', background: '#F8FAFD', padding: 12, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Slides</div>
          <button
            type="button"
            onClick={addSlide}
            disabled={!canEdit}
            style={{ border: '1px solid #CBD5E1', background: '#fff', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: canEdit ? 'pointer' : 'not-allowed', opacity: canEdit ? 1 : 0.5 }}
          >
            + Slide
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {doc.slides.map((slide, idx) => {
            const active = slide.id === doc.activeSlideId
            return (
              <div key={slide.id} style={{ border: active ? '1px solid #60A5FA' : '1px solid #DDE3EE', borderRadius: 10, background: active ? '#EFF6FF' : '#fff', padding: 8 }}>
                <button
                  type="button"
                  onClick={() => setDoc(prev => ({ ...prev, activeSlideId: slide.id }))}
                  style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                >
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 5 }}>Slide {idx + 1}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {slide.title || `Slide ${idx + 1}`}
                  </div>
                </button>
                {canEdit && doc.slides.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlide(slide.id)}
                    style={{ marginTop: 6, border: 'none', background: 'transparent', color: '#DC2626', fontSize: 11, cursor: 'pointer', padding: 0 }}
                  >
                    Slet
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </aside>

      <section style={{ overflow: 'auto', padding: 18 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', background: '#fff', border: '1px solid #DDE3EE', borderRadius: 16, boxShadow: '0 10px 28px rgba(15,23,42,0.08)', overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid #E5E7EB', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong style={{ fontSize: 13 }}>Slides Editor</strong>
              <span style={{ fontSize: 11, color: '#64748B' }}>Kimi (Moonshot API) til slide-generering</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{saving ? 'Gemmer…' : 'Gemt'}</div>
          </div>

          <div style={{ borderBottom: '1px solid #E5E7EB', padding: '8px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <select
              value={fontName}
              onChange={e => {
                setFontName(e.target.value)
                exec('fontName', e.target.value)
              }}
              style={{ border: '1px solid #D1D5DB', borderRadius: 8, padding: '5px 8px', fontSize: 12 }}
            >
              <option value="Arial">Arial</option>
              <option value="Verdana">Verdana</option>
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Trebuchet MS">Trebuchet</option>
            </select>
            <select
              value={fontSize}
              onChange={e => {
                setFontSize(e.target.value)
                exec('fontSize', e.target.value)
              }}
              style={{ border: '1px solid #D1D5DB', borderRadius: 8, padding: '5px 8px', fontSize: 12 }}
            >
              <option value="3">Normal</option>
              <option value="4">Mellem</option>
              <option value="5">Stor</option>
              <option value="6">XL</option>
            </select>
            <button type="button" onClick={() => exec('bold')} style={toolbarBtn}>B</button>
            <button type="button" onClick={() => exec('italic')} style={toolbarBtn}>I</button>
            <button type="button" onClick={() => exec('underline')} style={toolbarBtn}>U</button>
            <button type="button" onClick={() => exec('justifyLeft')} style={toolbarBtn}>Venstre</button>
            <button type="button" onClick={() => exec('justifyCenter')} style={toolbarBtn}>Center</button>
            <button type="button" onClick={() => exec('justifyRight')} style={toolbarBtn}>Højre</button>
            <button type="button" onClick={() => exec('insertUnorderedList')} style={toolbarBtn}>Liste</button>
          </div>

          <div style={{ padding: 16 }}>
            <input
              value={activeSlide?.title || ''}
              onChange={e => updateActiveSlideTitle(e.target.value)}
              disabled={!canEdit}
              placeholder="Slide-titel"
              style={{ width: '100%', border: 'none', borderBottom: '1px solid #E5E7EB', outline: 'none', padding: '6px 0 10px', fontSize: 28, fontWeight: 700, color: '#0F172A', marginBottom: 14, background: 'transparent' }}
            />

            <div style={{ margin: '0 auto', width: 'min(100%, 960px)', aspectRatio: '16 / 9', border: '1px solid #D1D5DB', borderRadius: 12, background: '#fff', boxShadow: 'inset 0 0 0 1px #F8FAFC' }}>
              <div
                ref={editorRef}
                contentEditable={canEdit}
                suppressContentEditableWarning
                onInput={e => updateActiveSlideHtml((e.target as HTMLDivElement).innerHTML)}
                style={{ width: '100%', height: '100%', outline: 'none', padding: 28, fontSize: 24, lineHeight: 1.35, color: '#0F172A', fontFamily: 'Arial, Helvetica, sans-serif', overflow: 'auto' }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

const toolbarBtn: CSSProperties = {
  border: '1px solid #D1D5DB',
  borderRadius: 8,
  padding: '5px 9px',
  background: '#fff',
  color: '#334155',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

