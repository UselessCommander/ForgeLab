'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { getProjectToolData, saveProjectToolData } from '@/lib/projects'
import {
  buildRemoteTextPresenceLayers,
  getSelectionOffsetsInContentEditable,
  type RemoteTextPresenceLayer,
} from '@/lib/projectEditorPresence'
import { supabase } from '@/lib/supabase'

type ProjectSlidesTabProps = {
  projectId: string
  canEdit: boolean
  /** Venstre indrykning under fast projekt-sidebar (fx analytics) */
  contentInsetLeftPx?: number
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

type GeneratedOutlineSlide = {
  title: string
  bullets: string[]
  speakerNotes?: string
  imagePrompt?: string
}

type GenerationStep = {
  id: string
  label: string
  detail: string
  status: 'pending' | 'running' | 'done'
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

const colorForUserId = (id: string) => {
  const palette = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return palette[Math.abs(hash) % palette.length]
}

export default function ProjectSlidesTab({ projectId, canEdit, contentInsetLeftPx = 0 }: ProjectSlidesTabProps) {
  const [doc, setDoc] = useState<SlidesDoc>(DEFAULT_SLIDES_DOC)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fontName, setFontName] = useState('Arial')
  const [fontSize, setFontSize] = useState('4')
  const [kimiPrompt, setKimiPrompt] = useState('')
  const [generateSlidesCount, setGenerateSlidesCount] = useState(8)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [generatedDeckTitle, setGeneratedDeckTitle] = useState('')
  const [generatedOutline, setGeneratedOutline] = useState<GeneratedOutlineSlide[] | null>(null)
  const [showSlidesEditor, setShowSlidesEditor] = useState(false)
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([])
  const [pdfFiles, setPdfFiles] = useState<Array<{ name: string; base64: string }>>([])
  const [generationEvents, setGenerationEvents] = useState<string[]>([])
  const [generationElapsedSec, setGenerationElapsedSec] = useState(0)
  const [remotePresenceLayers, setRemotePresenceLayers] = useState<RemoteTextPresenceLayer[]>([])
  const editorRef = useRef<HTMLDivElement>(null)
  const lastRenderedSlideIdRef = useRef('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUnmountedRef = useRef(false)
  const slidesChannelRef = useRef<any>(null)
  const clientPresenceIdRef = useRef(`slides-${Math.random().toString(36).slice(2, 8)}`)
  const presenceThrottleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const presenceRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastPresencePayloadRef = useRef<string>('')
  const schedulePresencePublishRef = useRef<() => void>(() => {})
  const activeSlideIdRef = useRef<string | undefined>(undefined)

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
  activeSlideIdRef.current = activeSlide?.id

  type SlidePresence = {
    userId: string
    color: string
    slideId: string
    selectionStart: number
    selectionEnd: number
    at: number
  }

  const publishSlidesPresence = () => {
    const editor = editorRef.current
    const slideId = activeSlideIdRef.current
    if (!editor || !slidesChannelRef.current || !slideId) return
    const offsets = getSelectionOffsetsInContentEditable(editor)
    if (!offsets) return
    const payload: SlidePresence = {
      userId: clientPresenceIdRef.current,
      color: colorForUserId(clientPresenceIdRef.current),
      slideId,
      selectionStart: offsets.selectionStart,
      selectionEnd: offsets.selectionEnd,
      at: Date.now(),
    }
    const asString = JSON.stringify(payload)
    if (asString === lastPresencePayloadRef.current) return
    lastPresencePayloadRef.current = asString
    slidesChannelRef.current.track(payload).catch(() => {})
  }

  const scheduleSlidesPresencePublish = () => {
    if (presenceThrottleTimerRef.current) clearTimeout(presenceThrottleTimerRef.current)
    presenceThrottleTimerRef.current = setTimeout(() => {
      publishSlidesPresence()
    }, 48)
  }

  schedulePresencePublishRef.current = scheduleSlidesPresencePublish

  const updateRenderedSlidesPresence = (presenceState?: Record<string, any[]>) => {
    const editor = editorRef.current
    const slideId = activeSlideIdRef.current
    if (!editor || !slideId) return
    const state = presenceState || (slidesChannelRef.current?.presenceState?.() as Record<string, any[]>) || {}
    const next = buildRemoteTextPresenceLayers(editor, state, {
      selfUserId: clientPresenceIdRef.current,
      docId: slideId,
      docKey: 'slideId',
      colorForUser: colorForUserId,
    })
    setRemotePresenceLayers(next)
  }

  const refreshSlidesPresenceUi = (presenceState?: Record<string, any[]>) => {
    if (isUnmountedRef.current) return
    updateRenderedSlidesPresence(presenceState)
  }

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
    isUnmountedRef.current = false
    boot()
    return () => {
      isUnmountedRef.current = true
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [projectId])

  useEffect(() => {
    if (!loaded || !projectId) return
    let cancelled = false
    const channel = supabase.channel(`project-slides:${projectId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: clientPresenceIdRef.current },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = slidesChannelRef.current?.presenceState?.() as Record<string, any[]> | undefined
        refreshSlidesPresenceUi(state)
      })
      .on('presence', { event: 'join' }, () => {
        const state = slidesChannelRef.current?.presenceState?.() as Record<string, any[]> | undefined
        refreshSlidesPresenceUi(state)
      })
      .on('presence', { event: 'leave' }, () => {
        const state = slidesChannelRef.current?.presenceState?.() as Record<string, any[]> | undefined
        refreshSlidesPresenceUi(state)
      })

    channel.subscribe(async (status: string) => {
      if (status !== 'SUBSCRIBED' || cancelled) return
      await slidesChannelRef.current?.track?.({
        userId: clientPresenceIdRef.current,
        color: colorForUserId(clientPresenceIdRef.current),
        slideId: '',
        selectionStart: 0,
        selectionEnd: 0,
        at: Date.now(),
      })
      const state = slidesChannelRef.current?.presenceState?.() as Record<string, any[]> | undefined
      refreshSlidesPresenceUi(state)
    })

    slidesChannelRef.current = channel

    presenceRefreshTimerRef.current = setInterval(() => {
      const state = slidesChannelRef.current?.presenceState?.() as Record<string, any[]> | undefined
      refreshSlidesPresenceUi(state)
    }, 1200)

    return () => {
      cancelled = true
      if (presenceRefreshTimerRef.current) {
        clearInterval(presenceRefreshTimerRef.current)
        presenceRefreshTimerRef.current = null
      }
      if (presenceThrottleTimerRef.current) clearTimeout(presenceThrottleTimerRef.current)
      if (slidesChannelRef.current) {
        supabase.removeChannel(slidesChannelRef.current)
        slidesChannelRef.current = null
      }
    }
  }, [projectId, loaded])

  useEffect(() => {
    if (!canEdit) return
    const onSelectionChange = () => {
      if (isUnmountedRef.current) return
      const editor = editorRef.current
      const sel = window.getSelection()
      if (!editor || !sel || sel.rangeCount === 0) return
      const node = sel.anchorNode
      if (!node || !editor.contains(node)) return
      schedulePresencePublishRef.current()
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [canEdit])

  useEffect(() => {
    if (!loaded || !activeSlide) return
    scheduleSlidesPresencePublish()
    const t = setTimeout(() => updateRenderedSlidesPresence(), 80)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.activeSlideId, loaded])

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
    scheduleSlidesPresencePublish()
  }

  const slideHtmlFromDraft = (draft: { bullets: string[]; speakerNotes?: string; imagePrompt?: string }) => {
    const bullets = draft.bullets
      .map(item => `<li>${item.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`)
      .join('')
    const notes = draft.speakerNotes
      ? `<p style="margin-top:18px;font-size:14px;color:#475569;"><strong>Speaker notes:</strong> ${draft.speakerNotes
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</p>`
      : ''
    const imagePrompt = draft.imagePrompt
      ? `<p style="margin-top:10px;font-size:13px;color:#64748B;"><strong>Image idea:</strong> ${draft.imagePrompt
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</p>`
      : ''
    return `<ul>${bullets}</ul>${notes}${imagePrompt}`
  }

  const objectTextPreview = (value: unknown, maxLen = 3200) => {
    const seen = new Set<any>()
    const walk = (node: any): string[] => {
      if (node == null) return []
      if (typeof node === 'string') return [node]
      if (typeof node === 'number' || typeof node === 'boolean') return [String(node)]
      if (typeof node !== 'object') return []
      if (seen.has(node)) return []
      seen.add(node)
      if (Array.isArray(node)) return node.flatMap(item => walk(item))
      const parts: string[] = []
      for (const [key, val] of Object.entries(node)) {
        if (['x', 'y', 'width', 'height', 'id', 'at', 'updatedAt', 'createdAt'].includes(key)) continue
        parts.push(...walk(val))
      }
      return parts
    }
    const text = walk(value)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    return text.slice(0, maxLen)
  }

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Kunne ikke læse fil'))
      reader.readAsDataURL(file)
    })

  const applyGeneratedOutline = () => {
    if (!generatedOutline || generatedOutline.length === 0) return
    const confirmed = window.confirm('Bekræft: Vil du oprette slides ud fra denne outline?')
    if (!confirmed) return
    const nextSlides = generatedOutline.map((slide, index) => ({
      id: createId(),
      title: slide.title?.trim() || `Slide ${index + 1}`,
      html: slideHtmlFromDraft(slide),
    }))
    updateDoc(() => ({
      slides: nextSlides,
      activeSlideId: nextSlides[0].id,
      updatedAt: Date.now(),
    }))
    setGeneratedOutline(null)
    setShowSlidesEditor(true)
  }

  const generateSlidesWithKimi = async () => {
    if (!canEdit || generating) return
    if (!kimiPrompt.trim()) {
      setGenerateError('Skriv til Kimi før du genererer slides.')
      return
    }
    setGenerateError('')
    setGenerating(true)
    setGenerationElapsedSec(0)
    setGenerationEvents([
      'Starter AI-generation',
      'Forbereder prompt og input',
    ])
    setGenerationSteps([
      { id: 'analyze', label: 'Analyserer prompt', detail: 'Forstår emne, stil og målgruppe', status: 'running' },
      { id: 'structure', label: 'Samler kontekst', detail: 'Indlæser relevant board- og PDF-indhold', status: 'pending' },
      { id: 'outline', label: 'Skriver outline', detail: 'Genererer redigerbare slidepunkter', status: 'pending' },
    ])
    const elapsedTimer = setInterval(() => {
      setGenerationElapsedSec(prev => prev + 1)
    }, 1000)
    try {
      setTimeout(() => {
        setGenerationSteps(prev =>
          prev.map(step =>
            step.id === 'analyze'
              ? { ...step, status: 'done' }
              : step.id === 'structure'
                ? { ...step, status: 'running' }
                : step
          )
        )
      }, 600)
      setTimeout(() => {
        setGenerationSteps(prev =>
          prev.map(step =>
            step.id === 'structure'
              ? { ...step, status: 'done' }
              : step.id === 'outline'
                ? { ...step, status: 'running' }
                : step
          )
        )
      }, 1250)

      setGenerationEvents(prev => [...prev, 'Henter board-kontekst fra projektet'])
      const [flowchartData, brainstormingData, empathyData] = await Promise.all([
        getProjectToolData(projectId, 'project-board-flowchart').catch(() => ({})),
        getProjectToolData(projectId, 'brainstorming').catch(() => ({})),
        getProjectToolData(projectId, 'empathy-map').catch(() => ({})),
      ])

      const boardContext = [
        objectTextPreview(flowchartData, 2400),
        objectTextPreview(brainstormingData, 1800),
        objectTextPreview(empathyData, 1800),
      ]
        .filter(Boolean)
        .join('\n')
        .slice(0, 7000)
      setGenerationEvents(prev => [
        ...prev,
        `Board-kontekst klar (${boardContext ? 'fundet indhold' : 'ingen relevant data'})`,
      ])
      if (pdfFiles.length > 0) {
        setGenerationEvents(prev => [...prev, `PDF vedhæftet: ${pdfFiles.length} fil(er) klar til scanning`])
      }
      setGenerationEvents(prev => [...prev, 'Sender prompt til AI-provider (med fallback)'])

      const response = await fetch('/api/slides/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          projectId,
          prompt: kimiPrompt.trim(),
          slidesCount: generateSlidesCount,
          boardContext,
          pdfFiles,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setGenerationEvents(prev => [...prev, `AI returnerede fejl (${response.status})`])
        throw new Error(payload?.error || 'Generering fejlede')
      }

      setGenerationEvents(prev => [...prev, 'Outline modtaget, validerer struktur'])
      const nextOutline = (Array.isArray(payload?.slides) ? payload.slides : []).map((slide: any, index: number) => ({
        title: typeof slide?.title === 'string' && slide.title.trim() ? slide.title.trim() : `Slide ${index + 1}`,
        bullets: Array.isArray(slide?.bullets) ? slide.bullets.filter((x: unknown) => typeof x === 'string') : [],
        speakerNotes: typeof slide?.speakerNotes === 'string' ? slide.speakerNotes : '',
        imagePrompt: typeof slide?.imagePrompt === 'string' ? slide.imagePrompt : '',
      }))

      if (nextOutline.length === 0) {
        throw new Error('Kimi returnerede ingen slides')
      }

      setGeneratedDeckTitle(typeof payload?.deckTitle === 'string' ? payload.deckTitle : 'Generated Deck')
      setGeneratedOutline(
        nextOutline.map(slide => ({
          bullets: Array.isArray(slide?.bullets) ? slide.bullets.filter((x: unknown) => typeof x === 'string') : [],
          title: slide.title,
          speakerNotes: slide.speakerNotes,
          imagePrompt: slide.imagePrompt,
        }))
      )
      setGenerationEvents(prev => [...prev, `Outline klar (${nextOutline.length} slides)`])
      setGenerationSteps(prev => prev.map(step => ({ ...step, status: 'done' })))
    } catch (error) {
      setGenerationEvents(prev => [
        ...prev,
        `Stoppet: ${error instanceof Error ? error.message : 'Ukendt fejl'}`,
      ])
      setGenerateError(error instanceof Error ? error.message : 'Kunne ikke generere slides.')
    } finally {
      clearInterval(elapsedTimer)
      setGenerating(false)
    }
  }

  if (!loaded) {
    return (
      <div style={{ position: 'fixed', inset: `56px 0 0 ${contentInsetLeftPx}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF1F6' }}>
        <p style={{ color: '#64748B', fontSize: 14 }}>Indlæser slides…</p>
      </div>
    )
  }

  if (!showSlidesEditor) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: `56px 0 0 ${contentInsetLeftPx}px`,
          background:
            'radial-gradient(circle at 50% 12%, color-mix(in srgb, var(--forge-accent-200) 60%, transparent), color-mix(in srgb, var(--forge-accent-100) 50%, #FFF) 42%, var(--forge-page-bg) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ width: 'min(980px, 100%)' }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ color: '#111827', fontSize: 46, fontWeight: 800, letterSpacing: '.06em' }}>FORGELAB</div>
            <div style={{ color: 'var(--forge-accent-600)', fontSize: 14, fontWeight: 600, letterSpacing: '.04em' }}>Slides AI Studio</div>
          </div>

          <div
            style={{
              border: '1px solid color-mix(in srgb, var(--forge-accent-300) 38%, #CBD5E1)',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.86)',
              boxShadow: '0 22px 55px color-mix(in srgb, var(--forge-accent-500) 20%, transparent)',
              padding: 14,
            }}
          >
            <textarea
              value={kimiPrompt}
              onChange={e => setKimiPrompt(e.target.value)}
              placeholder="Beskriv præsentationen du vil have ForgeLab AI til at bygge..."
              rows={4}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                borderRadius: 14,
                padding: 14,
                background: '#fff',
                color: '#111827',
                fontSize: 16,
                lineHeight: 1.5,
              }}
            />
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 12 }}>
                <span>ForgeLab AI</span>
                <span>Slides mode</span>
                <input
                  value={generateSlidesCount}
                  onChange={e => setGenerateSlidesCount(Math.min(20, Math.max(3, Number(e.target.value) || 8)))}
                  type="number"
                  min={3}
                  max={20}
                  style={{
                    width: 72,
                    ...generatorInput,
                    background: '#fff',
                    borderColor: 'color-mix(in srgb, var(--forge-accent-300) 40%, #CBD5E1)',
                    color: '#0F172A',
                  }}
                />
                <label
                  style={{
                    border: '1px solid color-mix(in srgb, var(--forge-accent-300) 40%, #CBD5E1)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Tilføj PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    style={{ display: 'none' }}
                    onChange={async e => {
                      const files = Array.from(e.target.files || [])
                      const valid = files.filter(file => file.type === 'application/pdf').slice(0, 4)
                      const encoded = await Promise.all(
                        valid.map(async file => ({ name: file.name, base64: await toBase64(file) }))
                      )
                      setPdfFiles(encoded)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={generateSlidesWithKimi}
                disabled={!canEdit || generating}
                style={{
                  border: '1px solid color-mix(in srgb, var(--forge-accent-300) 40%, #334155)',
                  borderRadius: 12,
                  background:
                    'linear-gradient(135deg, var(--forge-accent-600), var(--forge-accent-500))',
                  color: '#fff',
                  padding: '8px 12px',
                  fontSize: 13,
                  fontWeight: 700,
                  opacity: !canEdit || generating ? 0.5 : 1,
                  cursor: !canEdit || generating ? 'not-allowed' : 'pointer',
                }}
              >
                {generating ? 'Genererer…' : 'Generate outline'}
              </button>
            </div>
            {pdfFiles.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {pdfFiles.map(file => (
                  <span
                    key={file.name}
                    style={{
                      fontSize: 11,
                      color: '#475569',
                      background: '#fff',
                      border: '1px solid #CBD5E1',
                      borderRadius: 999,
                      padding: '2px 8px',
                    }}
                  >
                    PDF: {file.name}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setPdfFiles([])}
                  style={{ ...toolbarBtn, padding: '3px 8px', fontSize: 11 }}
                >
                  Fjern PDF
                </button>
              </div>
            )}
            {generateError && <div style={{ marginTop: 8, color: '#FCA5A5', fontSize: 12 }}>{generateError}</div>}
          </div>

          {generationSteps.length > 0 && (
            <div style={{ marginTop: 16, border: '1px solid color-mix(in srgb, var(--forge-accent-300) 30%, #CBD5E1)', borderRadius: 16, background: 'rgba(255,255,255,0.92)', padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                  Generation process
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {generating ? `Arbejder... ${generationElapsedSec}s` : 'Afsluttet'}
                </div>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {generationSteps.map(step => (
                  <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff', padding: '8px 10px' }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        marginTop: 5,
                        borderRadius: 999,
                        background:
                          step.status === 'done'
                            ? 'var(--forge-accent-500)'
                            : step.status === 'running'
                              ? '#3B82F6'
                              : '#CBD5E1',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{step.label}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{step.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              {generationEvents.length > 0 && (
                <div style={{ marginTop: 10, borderTop: '1px solid #E5E7EB', paddingTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                    Live activity
                  </div>
                  <div style={{ display: 'grid', gap: 5, maxHeight: 140, overflow: 'auto' }}>
                    {generationEvents.map((event, index) => (
                      <div key={`${event}-${index}`} style={{ fontSize: 12, color: '#334155' }}>
                        {index + 1}. {event}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {generatedOutline && (
            <div style={{ marginTop: 16, border: '1px solid color-mix(in srgb, var(--forge-accent-300) 30%, #CBD5E1)', borderRadius: 16, background: 'rgba(255,255,255,0.92)', padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ color: '#0F172A', fontWeight: 700 }}>{generatedDeckTitle || 'ForgeLab Outline'}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setGeneratedOutline(null)} style={{ ...toolbarBtn, background: '#fff', color: '#334155', borderColor: 'color-mix(in srgb, var(--forge-accent-300) 28%, #CBD5E1)' }}>
                    Discard
                  </button>
                  <button type="button" onClick={applyGeneratedOutline} style={{ ...toolbarBtn, background: 'var(--forge-accent-500)', color: '#111827', borderColor: 'var(--forge-accent-400)' }}>
                    Apply + Open editor
                  </button>
                </div>
              </div>
              <div style={{ maxHeight: 260, overflow: 'auto', display: 'grid', gap: 8 }}>
                {generatedOutline.map((slide, index) => (
                  <div key={`kimi-outline-${index}`} style={{ border: '1px solid color-mix(in srgb, var(--forge-accent-300) 24%, #CBD5E1)', borderRadius: 10, background: '#fff', padding: 8 }}>
                    <input
                      value={slide.title}
                      onChange={e =>
                        setGeneratedOutline(current =>
                          current ? current.map((s, i) => (i === index ? { ...s, title: e.target.value } : s)) : current
                        )
                      }
                      style={{ ...generatorInput, width: '100%', marginBottom: 6, background: '#fff', borderColor: 'color-mix(in srgb, var(--forge-accent-300) 24%, #CBD5E1)', color: '#0F172A' }}
                    />
                    <textarea
                      value={slide.bullets.join('\n')}
                      onChange={e =>
                        setGeneratedOutline(current =>
                          current
                            ? current.map((s, i) =>
                                i === index
                                  ? { ...s, bullets: e.target.value.split('\n').map(v => v.trim()).filter(Boolean).slice(0, 8) }
                                  : s
                              )
                            : current
                        )
                      }
                      rows={3}
                      style={{ ...generatorInput, width: '100%', background: '#fff', borderColor: 'color-mix(in srgb, var(--forge-accent-300) 24%, #CBD5E1)', color: '#0F172A' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: `56px 0 0 ${contentInsetLeftPx}px`, background: '#EEF1F6', display: 'grid', gridTemplateColumns: '260px 1fr' }}>
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
              <div
                key={slide.id}
                style={{ border: active ? '1px solid #60A5FA' : '1px solid #DDE3EE', borderRadius: 10, background: active ? '#EFF6FF' : '#fff', padding: 8 }}
              >
                <button
                  type="button"
                  onClick={() => setDoc(prev => ({ ...prev, activeSlideId: slide.id }))}
                  onKeyDown={e => {
                    if (!canEdit || doc.slides.length <= 1) return
                    if (e.key !== 'Delete' && e.key !== 'Backspace') return
                    e.preventDefault()
                    removeSlide(slide.id)
                  }}
                  title={canEdit && doc.slides.length > 1 ? 'Vælg slide · Delete eller Backspace sletter' : undefined}
                  style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                >
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 5 }}>Slide {idx + 1}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {slide.title || `Slide ${idx + 1}`}
                  </div>
                </button>
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
              <span style={{ fontSize: 11, color: '#64748B' }}>ForgeLab AI til slide-generering</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowSlidesEditor(false)}
                style={{ ...toolbarBtn, padding: '6px 10px' }}
              >
                Tilbage til Kimi
              </button>
              <div style={{ fontSize: 12, color: '#64748B' }}>{saving ? 'Gemmer…' : 'Gemt'}</div>
            </div>
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

            <div
              style={{
                margin: '0 auto',
                width: 'min(100%, 960px)',
                aspectRatio: '16 / 9',
                border: '1px solid #D1D5DB',
                borderRadius: 12,
                background: '#fff',
                boxShadow: 'inset 0 0 0 1px #F8FAFC',
                position: 'relative',
              }}
            >
              <div
                ref={editorRef}
                contentEditable={canEdit}
                suppressContentEditableWarning
                onInput={e => {
                  updateActiveSlideHtml((e.target as HTMLDivElement).innerHTML)
                  scheduleSlidesPresencePublish()
                }}
                onMouseUp={() => scheduleSlidesPresencePublish()}
                onKeyUp={() => scheduleSlidesPresencePublish()}
                onClick={() => scheduleSlidesPresencePublish()}
                onScroll={() => updateRenderedSlidesPresence()}
                style={{ width: '100%', height: '100%', outline: 'none', padding: 28, fontSize: 24, lineHeight: 1.35, color: '#0F172A', fontFamily: 'Arial, Helvetica, sans-serif', overflow: 'auto' }}
              />
              {remotePresenceLayers.map(layer => (
                <div
                  key={layer.id}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                >
                  {layer.highlights.map((h, i) => (
                    <div
                      key={`${layer.id}-sel-${i}`}
                      style={{
                        position: 'absolute',
                        left: h.left,
                        top: h.top,
                        width: h.width,
                        height: h.height,
                        background: `${layer.color}44`,
                        borderRadius: 3,
                        boxShadow: `inset 0 0 0 1px ${layer.color}66`,
                      }}
                    />
                  ))}
                  <div
                    style={{
                      position: 'absolute',
                      left: layer.caretLeft,
                      top: layer.caretTop,
                    }}
                  >
                    <div style={{ width: 2, height: 20, background: layer.color, borderRadius: 2 }} />
                    <div
                      style={{
                        marginTop: 2,
                        background: layer.color,
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 6,
                        padding: '2px 6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {layer.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

const toolbarBtn: CSSProperties = {
  border: '1px solid color-mix(in srgb, var(--forge-accent-300) 40%, #CBD5E1)',
  borderRadius: 8,
  padding: '5px 9px',
  background: '#fff',
  color: 'color-mix(in srgb, var(--forge-accent-700) 36%, #334155)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const generatorInput: CSSProperties = {
  border: '1px solid color-mix(in srgb, var(--forge-accent-300) 40%, #CBD5E1)',
  borderRadius: 8,
  padding: '8px 10px',
  background: '#fff',
  color: '#0F172A',
  fontSize: 12,
  outline: 'none',
}

