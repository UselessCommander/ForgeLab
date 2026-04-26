'use client'

// @ts-nocheck
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { Sparkles, ChevronDown } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { getProjectToolData } from '@/lib/projects'
import { hasFunctionalStorageConsent } from '@/lib/cookie-consent'

interface AiChatCompanionProps {
  projectId: string
  projectTools: { slug: string; tool: any }[]
  availableToolSlugs: string[]
  projectName: string
  workspaceTab?:
    | 'board'
    | 'planning'
    | 'docs'
    | 'slides'
    | 'card-sorting'
    | 'survey'
    | 'qr'
    | 'files'
    | 'comments'
  framework: string
  role: string
  zIndex?: number
  onAddTool: (slug: string) => void
}

export default function AiChatCompanion({
  projectId,
  projectTools,
  availableToolSlugs,
  projectName,
  workspaceTab = 'board',
  framework,
  role,
  zIndex: zIndexProp,
  onAddTool,
}: AiChatCompanionProps) {
  const MODEL_OPTIONS: Record<string, string[]> = {
    auto: ['auto'],
    max: ['max'],
    google: ['gemini-2.5-flash', 'gemini-2.0-flash'],
    openai: ['gpt-4o-mini', 'gpt-4o'],
    anthropic: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'],
    openrouter: [
      'nvidia/nemotron-3-super-120b-a12b:free',
      'minimax/minimax-m2.5:free',
      'openai/gpt-oss-120b:free',
      'nvidia/nemotron-3-nano-30b-a3b:free',
      'google/gemma-4-31b-it:free',
    ],
    mistral: ['mistral-small-latest', 'mistral-medium-latest'],
    groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    kimi: ['kimi-k2.5', 'kimi-k2', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  }

  const MAX_FILES = 5
  const MAX_FILE_SIZE_MB = 8
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

  const [isOpen, setIsOpen] = useState(false)
  const [fabPressed, setFabPressed] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string>('auto')
  const [selectedModel, setSelectedModel] = useState<string>('auto')
  /** useChat holder transport fra første mount; body() ellers læser gamle provider/model fra closure → API fik altid fx "auto"/Gemini. */
  const selectedProviderRef = useRef(selectedProvider)
  const selectedModelRef = useRef(selectedModel)
  const kimiOnlyMode = workspaceTab === 'slides'

  useEffect(() => {
    selectedProviderRef.current = selectedProvider
  }, [selectedProvider])
  useEffect(() => {
    selectedModelRef.current = selectedModel
  }, [selectedModel])

  const providerSelectKeys = Object.keys(MODEL_OPTIONS).filter(
    key => key !== 'kimi' || workspaceTab === 'slides'
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const slidesContextDigestRef = useRef('')
  const slidesIncludedToolSlugsRef = useRef<string[]>([])
  const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const [slidesContextMode, setSlidesContextMode] = useState<'focused' | 'broad'>('focused')
  const [pendingSlideOutline, setPendingSlideOutline] = useState<{
    analysisSummary: string
    slides: Array<{ order: number; title: string; slideType: string; summary: string }>
  } | null>(null)
  const [applyingOutline, setApplyingOutline] = useState(false)

  const resolveSlidesIncludedToolSlugs = useCallback(
    (queryText?: string) => {
      const boardTools = projectTools.filter(t => t.slug !== 'project-slides')
      if (slidesContextMode === 'broad') return boardTools.map(t => t.slug)

      const query = (queryText || '').trim().toLowerCase()
      if (!query) return boardTools.map(t => t.slug)

      const matched = boardTools
        .filter(t => {
          const slug = t.slug.toLowerCase()
          const title = String(t.tool?.title || '').toLowerCase()
          return (slug && query.includes(slug)) || (title && query.includes(title))
        })
        .map(t => t.slug)

      return matched.length > 0 ? matched : boardTools.map(t => t.slug)
    },
    [projectTools, slidesContextMode]
  )

  const rebuildSlidesContextDigest = useCallback(async (queryText?: string) => {
    if (!kimiOnlyMode) return
    const parts: string[] = []
    const docsData = await getProjectToolData(projectId, 'project-docs')
    if (docsData && Object.keys(docsData).length > 0) {
      parts.push('=== PROJEKT DOCS (afkortet) ===\n' + JSON.stringify(docsData).slice(0, 12000))
    }
    const includedToolSlugs = resolveSlidesIncludedToolSlugs(queryText)
    slidesIncludedToolSlugsRef.current = includedToolSlugs
    for (const slug of includedToolSlugs) {
      const d = await getProjectToolData(projectId, slug)
      parts.push(`=== VÆRKTØJ "${slug}" (afkortet) ===\n` + JSON.stringify(d).slice(0, 10000))
    }
    slidesContextDigestRef.current = parts.join('\n\n')
  }, [kimiOnlyMode, projectId, resolveSlidesIncludedToolSlugs])

  useEffect(() => {
    if (!kimiOnlyMode) return
    void rebuildSlidesContextDigest()
  }, [kimiOnlyMode, rebuildSlidesContextDigest, projectId, projectTools, slidesContextMode])

  const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

  const isEmptyObject = (value: unknown) =>
    isPlainObject(value) && Object.keys(value).length === 0

  const getTypeLabel = (value: unknown) =>
    Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value

  const validateShapeExact = (
    expected: unknown,
    actual: unknown,
    path = 'data',
    errors: string[] = []
  ) => {
    if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) {
        errors.push(`${path}: forventer array, fik ${getTypeLabel(actual)}`)
        return errors
      }
      if (expected.length > 0) {
        const expectedItem = expected[0]
        actual.forEach((item, index) => {
          validateShapeExact(expectedItem, item, `${path}[${index}]`, errors)
        })
      }
      return errors
    }

    if (isPlainObject(expected)) {
      if (!isPlainObject(actual)) {
        errors.push(`${path}: forventer object, fik ${getTypeLabel(actual)}`)
        return errors
      }

      const expectedKeys = Object.keys(expected)
      const actualKeys = Object.keys(actual)

      for (const key of expectedKeys) {
        if (!(key in actual)) {
          errors.push(`${path}.${key}: mangler felt`)
        }
      }
      for (const key of actualKeys) {
        if (!(key in expected)) {
          errors.push(`${path}.${key}: ukendt felt`)
        }
      }
      for (const key of expectedKeys) {
        if (key in actual) {
          validateShapeExact(
            (expected as Record<string, unknown>)[key],
            (actual as Record<string, unknown>)[key],
            `${path}.${key}`,
            errors
          )
        }
      }
      return errors
    }

    if (typeof expected !== typeof actual) {
      errors.push(`${path}: forventer ${typeof expected}, fik ${typeof actual}`)
    }
    return errors
  }

  const escapeHtml = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')

  const outlineRowToSlideHtml = (row: { title: string; slideType: string; summary: string }) => {
    const paras = row.summary
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${escapeHtml(p)}</p>`)
      .join('')
    const typeHtml = row.slideType
      ? `<p style="font-size:12px;color:#64748b;margin:0 0 8px;">${escapeHtml(row.slideType)}</p>`
      : ''
    return `<h2>${escapeHtml(row.title)}</h2>${typeHtml}${paras || '<p></p>'}`
  }

  const applyPendingOutlineToSlides = async () => {
    if (!pendingSlideOutline?.slides?.length) return
    setApplyingOutline(true)
    try {
      const ordered = pendingSlideOutline.slides
        .slice()
        .sort((a, b) => a.order - b.order)
        .map(row => ({
          id: createId(),
          title: row.title?.trim() || 'Slide',
          html: outlineRowToSlideHtml({
            title: row.title || 'Slide',
            slideType: row.slideType || '',
            summary: row.summary || '',
          }),
        }))
      const doc = {
        slides: ordered,
        activeSlideId: ordered[0]?.id || '',
        updatedAt: Date.now(),
      }
      const res = await fetch(`/api/projects/${projectId}/tools/project-slides/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: doc }),
      })
      if (!res.ok) throw new Error('save failed')
      setPendingSlideOutline(null)
      window.dispatchEvent(new CustomEvent('forgelab-reload-project-slides'))
    } catch {
      alert('Kunne ikke gemme slides. Prøv igen.')
    } finally {
      setApplyingOutline(false)
    }
  }

  const updatePendingOutlineSlide = (
    index: number,
    patch: Partial<{ order: number; title: string; slideType: string; summary: string }>
  ) => {
    setPendingSlideOutline(prev => {
      if (!prev) return prev
      const slides = prev.slides.map((s, i) => (i === index ? { ...s, ...patch } : s))
      return { ...prev, slides }
    })
  }

  const removePendingOutlineSlide = (index: number) => {
    setPendingSlideOutline(prev => {
      if (!prev) return prev
      const slides = prev.slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }))
      return { ...prev, slides }
    })
  }

  const addPendingOutlineSlide = () => {
    setPendingSlideOutline(prev => {
      if (!prev) return prev
      const nextOrder = prev.slides.length ? Math.max(...prev.slides.map(s => s.order)) + 1 : 1
      return {
        ...prev,
        slides: [
          ...prev.slides,
          { order: nextOrder, title: 'Ny slide', slideType: '', summary: 'Kort disposition…' },
        ],
      }
    })
  }

  const movePendingOutlineSlide = (index: number, dir: -1 | 1) => {
    setPendingSlideOutline(prev => {
      if (!prev) return prev
      const j = index + dir
      if (j < 0 || j >= prev.slides.length) return prev
      const slides = [...prev.slides]
      ;[slides[index], slides[j]] = [slides[j], slides[index]]
      return {
        ...prev,
        slides: slides.map((s, i) => ({ ...s, order: i + 1 })),
      }
    })
  }

  const textToDocHtml = (value: string) => {
    const lines = value
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)

    if (lines.length === 0) return '<p></p>'
    return lines.map(line => `<p>${escapeHtml(line)}</p>`).join('')
  }

  const createDocPage = (title?: string) => ({
    id: createId(),
    title: (title || '').trim() || 'Ny side',
    html: '<p></p>',
  })

  const normalizeDocData = (raw: any) => {
    const rawPages = Array.isArray(raw?.pages) ? raw.pages : []
    const pages = rawPages
      .map((page: any) => ({
        id: typeof page?.id === 'string' && page.id.trim() ? page.id : createId(),
        title: typeof page?.title === 'string' && page.title.trim() ? page.title : 'Untitled',
        html: typeof page?.html === 'string' ? page.html : '<p></p>',
      }))
      .filter((page: any) => page.id)

    if (pages.length === 0) pages.push(createDocPage('Untitled'))

    const activePageId =
      typeof raw?.activePageId === 'string' && pages.some((p: any) => p.id === raw.activePageId)
        ? raw.activePageId
        : pages[0].id

    return {
      pages,
      activePageId,
      updatedAt: Date.now(),
    }
  }

  const [input, setInput] = useState('')
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [loadingDotCount, setLoadingDotCount] = useState(1)
  const { messages, sendMessage, setMessages, isLoading, status, error } = (useChat as any)({
    // Nyt chat-id pr. fane: ellers genbruger AI SDK samme Chat/transport fra første mount,
    // og body() har stale closure → API får altid workspaceTab fra første visning (typisk "board").
    id: `${projectId}-${workspaceTab}`,
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
      body: () => {
        const recentUserMessages = (messages || [])
          .filter((m: any) => m?.role === 'user')
          .slice(-3)
          .map((m: any) => getMessageText(m))
          .filter(Boolean)

        return {
          aiProvider: kimiOnlyMode ? 'kimi' : selectedProviderRef.current,
          aiModel: kimiOnlyMode ? 'kimi-k2.5' : selectedModelRef.current,
          context: {
            projectId,
            projectName,
            framework,
            role,
            workspaceTab,
            activeToolSlugs: projectTools.map(t => t.slug),
            activeToolTitles: projectTools.map(t => t.tool?.title || t.slug),
            availableToolSlugs,
            toolCount: projectTools.length,
            recentUserMessages,
            ...(kimiOnlyMode
              ? {
                  slidesContextMode,
                  slidesIncludedToolSlugs: slidesIncludedToolSlugsRef.current,
                  slidesProjectContextDigest: slidesContextDigestRef.current || '',
                }
              : {}),
          },
        }
      },
    }),
    maxSteps: kimiOnlyMode ? 8 : 6,
    async onToolCall({ toolCall }: { toolCall: any }) {
      if (toolCall.toolName === 'readToolData') {
        // readToolData is executed server-side; this client handler is a no-op passthrough
        return undefined
      }
      if (toolCall.toolName === 'addTool') {
        const slug =
          (toolCall?.args && typeof toolCall.args.slug === 'string' ? toolCall.args.slug : undefined) ||
          (toolCall?.input && typeof toolCall.input.slug === 'string' ? toolCall.input.slug : undefined)

        if (slug) {
          const isAlreadyActive = projectTools.some(tool => tool.slug === slug)
          if (isAlreadyActive) return `Modulet ${slug} er allerede aktivt`

          const isAvailable = availableToolSlugs.includes(slug)
          if (!isAvailable) return `Modulet ${slug} er ikke tilgængeligt i dette board lige nu`

          await onAddTool(slug)
          return `Tilføjede modulet: ${slug}`
        }
        return 'Modulet kunne ikke tilføjes, fordi slug mangler i tool-kaldet.'
      }

      if (toolCall.toolName === 'populateAffinityDiagram') {
        const payload = toolCall?.args || toolCall?.input
        const themes = Array.isArray(payload?.themes) ? payload.themes : []
        const ungrouped = Array.isArray(payload?.ungrouped) ? payload.ungrouped : []

        if (themes.length === 0) {
          return 'Affinity blev ikke udfyldt: ingen temaer modtaget.'
        }

        const hasAffinity = projectTools.some(t => t.slug === 'affinity-diagram')
        if (!hasAffinity) {
          if (availableToolSlugs.includes('affinity-diagram')) {
            await onAddTool('affinity-diagram')
          } else {
            return 'Affinity Diagram er ikke aktivt, og kan ikke tilføjes lige nu.'
          }
        }

        const data = {
          groups: themes.map((theme: any) => ({
            id: createId(),
            title: String(theme?.title || 'Tema'),
            notes: (Array.isArray(theme?.notes) ? theme.notes : []).map((text: any) => ({
              id: createId(),
              text: String(text || ''),
            })),
          })),
          ungrouped: ungrouped.map((text: any) => ({
            id: createId(),
            text: String(text || ''),
          })),
        }

        const response = await fetch(
          `/api/projects/${projectId}/tools/affinity-diagram/data`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data }),
          }
        )

        if (!response.ok) {
          return 'Kunne ikke gemme AI-forslag i Affinity Diagram.'
        }

        return `Udfyldte Affinity Diagram med ${themes.length} temaer.`
      }

      if (toolCall.toolName === 'updateToolData') {
        // Server-side execute already wrote to DB. Trigger board reload so UI updates live.
        const payload = toolCall?.args || toolCall?.input || {}
        const toolSlug = typeof payload?.toolSlug === 'string' ? payload.toolSlug : ''
        const description = typeof payload?.description === 'string' ? payload.description : ''

        if (!toolSlug) return 'toolSlug mangler i updateToolData.'

        // Dispatch custom event so board panels reload their tool data
        window.dispatchEvent(new CustomEvent('forgelab-ai-tool-updated', { detail: { toolSlug } }))
        window.dispatchEvent(new CustomEvent('forgelab-reload-board-tool', { detail: { toolSlug } }))

        return description || `Opdaterede ${toolSlug} direkte i boardet.`
      }
      if (toolCall.toolName === 'editProjectDocs') {
        const payload = toolCall?.args || toolCall?.input || {}
        const mode = payload?.mode === 'replace' ? 'replace' : 'append'
        const content = typeof payload?.content === 'string' ? payload.content.trim() : ''
        const pageTitle = typeof payload?.pageTitle === 'string' ? payload.pageTitle.trim() : ''

        if (!content) return 'Kunne ikke opdatere docs: content mangler.'

        const existingResponse = await fetch(`/api/projects/${projectId}/tools/project-docs/data`)
        if (!existingResponse.ok) {
          return 'Kunne ikke hente docs-data.'
        }

        const existingPayload = await existingResponse.json()
        const doc = normalizeDocData(existingPayload?.data)
        const newHtml = textToDocHtml(content)

        let targetPage =
          (pageTitle
            ? doc.pages.find(
                (page: any) => page.title.trim().toLowerCase() === pageTitle.toLowerCase()
              )
            : undefined) || doc.pages.find((page: any) => page.id === doc.activePageId)

        if (!targetPage) {
          targetPage = createDocPage(pageTitle || 'Ny side')
          doc.pages.push(targetPage)
        }

        if (mode === 'replace') {
          targetPage.html = newHtml
        } else {
          const currentHtml = typeof targetPage.html === 'string' ? targetPage.html : '<p></p>'
          targetPage.html = `${currentHtml}${newHtml}`
        }

        doc.activePageId = targetPage.id
        doc.updatedAt = Date.now()

        const response = await fetch(`/api/projects/${projectId}/tools/project-docs/data`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: doc }),
        })

        if (!response.ok) {
          return 'Kunne ikke gemme AI-opdatering i docs.'
        }

        return `Opdaterede docs-siden "${targetPage.title}" (${mode === 'replace' ? 'erstattet' : 'tilføjet'}).`
      }
      if (toolCall.toolName === 'editProjectSlides') {
        const payload = toolCall?.args || toolCall?.input || {}
        const mode = payload?.mode === 'replace' ? 'replace' : 'append'
        const slideTitle = typeof payload?.slideTitle === 'string' ? payload.slideTitle.trim() : ''
        const title = typeof payload?.title === 'string' ? payload.title.trim() : ''
        const contentHtml =
          typeof payload?.contentHtml === 'string' && payload.contentHtml.trim()
            ? payload.contentHtml.trim()
            : ''

        if (!contentHtml) return 'Kunne ikke opdatere slides: contentHtml mangler.'

        const createSlide = (index: number) => ({
          id: createId(),
          title: `Slide ${index}`,
          html: '<h2>Ny slide</h2><p>Tilføj indhold…</p>',
        })

        const normalizeSlides = (raw: any) => {
          const slides = Array.isArray(raw?.slides)
            ? raw.slides
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
                .filter((slide: any) => slide.id)
            : []

          if (slides.length === 0) slides.push(createSlide(1))
          const activeSlideId =
            typeof raw?.activeSlideId === 'string' && slides.some((s: any) => s.id === raw.activeSlideId)
              ? raw.activeSlideId
              : slides[0].id

          return {
            slides,
            activeSlideId,
            updatedAt: Date.now(),
          }
        }

        const existingResponse = await fetch(`/api/projects/${projectId}/tools/project-slides/data`)
        if (!existingResponse.ok) {
          return 'Kunne ikke hente slides-data.'
        }
        const existingPayload = await existingResponse.json()
        const slidesDoc = normalizeSlides(existingPayload?.data)

        let targetSlide =
          (slideTitle
            ? slidesDoc.slides.find(
                (slide: any) => slide.title.trim().toLowerCase() === slideTitle.toLowerCase()
              )
            : undefined) || slidesDoc.slides.find((slide: any) => slide.id === slidesDoc.activeSlideId)

        if (!targetSlide) {
          targetSlide = createSlide(slidesDoc.slides.length + 1)
          slidesDoc.slides.push(targetSlide)
        }

        if (title) targetSlide.title = title
        targetSlide.html = mode === 'replace' ? contentHtml : `${targetSlide.html}${contentHtml}`

        slidesDoc.activeSlideId = targetSlide.id
        slidesDoc.updatedAt = Date.now()

        const response = await fetch(`/api/projects/${projectId}/tools/project-slides/data`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: slidesDoc }),
        })

        if (!response.ok) return 'Kunne ikke gemme AI-opdatering i slides.'
        window.dispatchEvent(new CustomEvent('forgelab-reload-project-slides'))
        return `Opdaterede slide "${targetSlide.title}".`
      }

      if (toolCall.toolName === 'proposeSlideDeckOutline') {
        const payload = toolCall?.args || toolCall?.input || {}
        const analysisSummary =
          typeof payload.analysisSummary === 'string' ? payload.analysisSummary.trim() : ''
        const rawSlides = Array.isArray(payload.slides) ? payload.slides : []
        const normalized = rawSlides.map((s: any, i: number) => ({
          order: typeof s?.order === 'number' && Number.isFinite(s.order) ? s.order : i + 1,
          title: String(s?.title || `Slide ${i + 1}`).trim() || `Slide ${i + 1}`,
          slideType: typeof s?.slideType === 'string' ? s.slideType.trim() : '',
          summary: typeof s?.summary === 'string' ? s.summary.trim() : '',
        }))
        if (normalized.length > 0) {
          setPendingSlideOutline({
            analysisSummary: analysisSummary || 'Outline fra AI',
            slides: normalized,
          })
        }
        return 'Outline er klar. Gennemse og redigér nedenfor, og tryk «Opret slides».'
      }

      return 'Ingen ændring udført'
    }
  })

  useEffect(() => {
    if (kimiOnlyMode) {
      selectedProviderRef.current = 'kimi'
      selectedModelRef.current = 'kimi-k2.5'
      setSelectedProvider('kimi')
      setSelectedModel('kimi-k2.5')
      return
    }
    if (!hasFunctionalStorageConsent()) return
    const storedProvider = localStorage.getItem('forgelab.aiProvider')
    const storedModel = localStorage.getItem('forgelab.aiModel')
    if (storedProvider === 'kimi') {
      selectedProviderRef.current = 'auto'
      selectedModelRef.current = 'auto'
      setSelectedProvider('auto')
      setSelectedModel('auto')
      return
    }
    if (storedProvider && MODEL_OPTIONS[storedProvider]) {
      const nextModel =
        storedModel && MODEL_OPTIONS[storedProvider].includes(storedModel)
          ? storedModel
          : MODEL_OPTIONS[storedProvider][0]
      selectedProviderRef.current = storedProvider
      selectedModelRef.current = nextModel
      setSelectedProvider(storedProvider)
      setSelectedModel(nextModel)
    }
  }, [kimiOnlyMode])

  useLayoutEffect(() => {
    if (workspaceTab === 'slides') return
    setSelectedProvider(prev => (prev === 'kimi' ? 'auto' : prev))
    setSelectedModel(prev => (prev === 'kimi-k2.5' ? 'auto' : prev))
  }, [workspaceTab])

  useEffect(() => {
    if (kimiOnlyMode) return
    if (!hasFunctionalStorageConsent()) return
    localStorage.setItem('forgelab.aiProvider', selectedProvider)
    localStorage.setItem('forgelab.aiModel', selectedModel)
  }, [selectedProvider, selectedModel, kimiOnlyMode])

  // In newer Vercel AI SDKs, loading can be inferred from status or isLoading
  const isTyping = isLoading || status === 'in_progress' || status === 'submitted' || status === 'streaming'
  const loadingMessages = [
    'Tænker kreativt over din idé',
    'Skitserer næste skridt',
    'Bygger forslag til dit board',
    'Forfiner et stærkt svar',
    'Redigerer boardet direkte…',
    'Henter og analyserer data',
    'Skriver indhold til dit tool',
  ]

  useEffect(() => {
    if (!isTyping) {
      setLoadingMessageIndex(0)
      setLoadingDotCount(1)
      return
    }

    const messageTimer = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length)
    }, 1800)

    const dotTimer = setInterval(() => {
      setLoadingDotCount(prev => (prev % 3) + 1)
    }, 360)

    return () => {
      clearInterval(messageTimer)
      clearInterval(dotTimer)
    }
  }, [isTyping])

  const convertFileToUiPart = (file: File) =>
    new Promise<any>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = event => {
        const dataUrl = event.target?.result
        if (typeof dataUrl !== 'string') {
          reject(new Error('Kunne ikke læse filen.'))
          return
        }
        resolve({
          type: 'file',
          mediaType: file.type || 'application/octet-stream',
          filename: file.name,
          url: dataUrl,
        })
      }
      reader.onerror = () => reject(new Error(`Kunne ikke læse filen: ${file.name}`))
      reader.readAsDataURL(file)
    })

  const stripFilePartsFromHistory = (history: any[] = []) =>
    history.map(message => {
      if (!Array.isArray(message?.parts)) return message
      const nextParts = message.parts.filter((part: any) => part?.type !== 'file')
      return { ...message, parts: nextParts }
    })

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError(null)
    if ((!input.trim() && pendingFiles.length === 0) || isTyping) return

    if (kimiOnlyMode) await rebuildSlidesContextDigest(input.trim())

    // Undgå at tidligere vedhæftede filer bliver sendt igen på hver ny besked.
    if (typeof setMessages === 'function') {
      setMessages((prev: any[]) => stripFilePartsFromHistory(prev))
    }

    let fileParts: any[] = []
    if (pendingFiles.length > 0) {
      try {
        fileParts = await Promise.all(pendingFiles.map(convertFileToUiPart))
      } catch (err: any) {
        setUploadError(err?.message || 'Kunne ikke forberede filer til upload.')
        return
      }
    }

    sendMessage({
      text: input.trim() || 'Vedhæftet filer',
      files: fileParts,
    })
    setInput('')
    setPendingFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const allowedFiles: File[] = []
    const rejectedFileNames: string[] = []
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejectedFileNames.push(file.name)
        continue
      }
      allowedFiles.push(file)
    }

    setPendingFiles(prev => {
      const next = [...prev, ...allowedFiles]
      if (next.length > MAX_FILES) {
        setUploadError(`Maks ${MAX_FILES} filer ad gangen.`)
        return next.slice(0, MAX_FILES)
      }
      return next
    })

    if (rejectedFileNames.length > 0) {
      setUploadError(
        `Disse filer er for store (maks ${MAX_FILE_SIZE_MB} MB): ${rejectedFileNames.join(', ')}`
      )
    } else if (!uploadError) {
      setUploadError(null)
    }
  }

  const removePendingFile = (indexToRemove: number) => {
    setPendingFiles(prev => prev.filter((_, index) => index !== indexToRemove))
    setUploadError(null)
  }

  const getMessageText = (message: any) => {
    if (typeof message?.content === 'string' && message.content.length > 0) return message.content
    if (!Array.isArray(message?.parts)) return ''
    return message.parts
      .filter((part: any) => part?.type === 'text' && typeof part?.text === 'string')
      .map((part: any) => part.text)
      .join('')
  }

  const getMessageFileParts = (message: any) => {
    if (!Array.isArray(message?.parts)) return []
    return message.parts.filter((part: any) => part?.type === 'file')
  }

  const getFriendlyErrorMessage = (rawMessage?: string, activeProvider?: string) => {
    if (!rawMessage) return 'Der opstod en ukendt fejl. Prøv igen.'
    const lower = rawMessage.toLowerCase()
    const provider = (activeProvider || '').toLowerCase()
    const envHint = ' i miljøvariabler (.env.local lokalt eller under Vercel → Environment Variables).'

    if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('exceeded your current quota')) {
      return 'Din AI-kvote er opbrugt lige nu. Prøv igen om lidt eller skift til en billigere model.'
    }

    const keyish =
      lower.includes('api key') ||
      lower.includes('api_key') ||
      lower.includes('invalid api') ||
      lower.includes('incorrect api key')

    const mentionsGoogle =
      lower.includes('google_generative_ai') ||
      lower.includes('google_generative') ||
      lower.includes('generative language') ||
      lower.includes('gemini') ||
      (lower.includes('google') && keyish)
    const mentionsOpenrouter = lower.includes('openrouter')

    if (mentionsOpenrouter || (provider === 'openrouter' && keyish)) {
      return `OpenRouter: API-nøglen mangler eller er ugyldig. Sæt OPENROUTER_API_KEY${envHint}`
    }

    if (mentionsGoogle || (provider === 'google' && keyish)) {
      return `Google (Gemini): API-nøglen mangler eller er ugyldig. Sæt GOOGLE_GENERATIVE_AI_API_KEY (eller GOOGLE_API_KEY / GEMINI_API_KEY)${envHint}`
    }

    if (provider === 'openai' && keyish) {
      return `OpenAI: API-nøglen mangler eller er ugyldig. Sæt OPENAI_API_KEY${envHint}`
    }

    if (provider === 'anthropic' && keyish) {
      return `Anthropic: API-nøglen mangler eller er ugyldig. Sæt ANTHROPIC_API_KEY${envHint}`
    }

    if (provider === 'mistral' && keyish) {
      return `Mistral: API-nøglen mangler eller er ugyldig. Sæt MISTRAL_API_KEY${envHint}`
    }

    if (provider === 'kimi' && keyish) {
      return `Kimi/Moonshot: API-nøglen mangler eller er ugyldig. Sæt MOONSHOT_API_KEY eller KIMI_API_KEY${envHint}`
    }

    if (lower.includes('groq') && (keyish || lower.includes('401'))) {
      return `Groq: API-nøglen mangler eller er ugyldig. Sæt GROQ_API_KEY${envHint}`
    }

    if (keyish) {
      return `API-nøglen mangler eller er ugyldig for den valgte provider (${provider || 'ukendt'}). Tjek den tilhørende nøgle${envHint}`
    }

    if (lower.includes('failed to fetch') || lower.includes('network')) {
      return 'Netværksfejl ved kontakt til AI-serveren. Tjek forbindelse og prøv igen.'
    }

    if (
      lower.includes('request entity too large') ||
      lower.includes('function_payload_too_large') ||
      lower.includes('file_payload_too_large') ||
      lower.includes('payload too large')
    ) {
      return 'Din besked blev for stor til serveren. Prøv med færre/mindre filer eller del dokumentet op i mindre bidder.'
    }

    return rawMessage
  }

  useEffect(() => {
    const msg = String(error?.message || '').toLowerCase()
    const isPayloadLarge =
      msg.includes('request entity too large') ||
      msg.includes('function_payload_too_large') ||
      msg.includes('file_payload_too_large') ||
      msg.includes('payload too large')
    if (!isPayloadLarge) return
    if (typeof setMessages === 'function') {
      setMessages((prev: any[]) => stripFilePartsFromHistory(prev))
    }
  }, [error, setMessages])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes forgeAiFabRing {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.1); }
}
@keyframes forgeAiFabPress {
  0% { transform: scale(1) rotate(0deg); }
  35% { transform: scale(0.86) rotate(-14deg); }
  65% { transform: scale(1.08) rotate(8deg); }
  100% { transform: scale(1) rotate(0deg); }
}
.forge-ai-fab-wrap { position: relative; width: 62px; height: 62px; flex-shrink: 0; }
.forge-ai-fab-ring {
  position: absolute; inset: -5px; border-radius: 9999px;
  border: 2px solid rgba(196, 181, 253, 0.65);
  animation: forgeAiFabRing 2.4s ease-in-out infinite;
  pointer-events: none;
}
.forge-ai-fab-wrap.is-open .forge-ai-fab-ring { animation: none; opacity: 0.25; transform: scale(1); }
.forge-ai-fab-btn {
  position: relative; z-index: 1;
  width: 58px; height: 58px; border-radius: 18px;
  background: linear-gradient(145deg, #ddd6fe 0%, #7c3aed 45%, #4c1d95 100%);
  color: #fff; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow:
    0 12px 32px rgba(76, 29, 149, 0.42),
    0 0 0 1px rgba(255,255,255,0.22) inset,
    0 -2px 12px rgba(255,255,255,0.12) inset;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}
.forge-ai-fab-btn:hover {
  transform: scale(1.06);
  box-shadow:
    0 14px 36px rgba(76, 29, 149, 0.48),
    0 0 0 1px rgba(255,255,255,0.3) inset,
    0 -2px 14px rgba(255,255,255,0.16) inset;
}
.forge-ai-fab-btn.pressing { animation: forgeAiFabPress 0.48s cubic-bezier(0.34, 1.45, 0.64, 1) both; }
.forge-ai-fab-icons {
  position: relative;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}
.forge-ai-fab-icon-layer {
  position: absolute;
  left: 50%;
  top: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    opacity 0.42s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.48s cubic-bezier(0.34, 1.35, 0.52, 1);
  will-change: transform, opacity;
}
.forge-ai-fab-sparkle-layer {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1) rotate(0deg);
}
.forge-ai-fab-chevron-layer {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5) rotate(-108deg);
  pointer-events: none;
}
.forge-ai-fab-wrap.is-open .forge-ai-fab-sparkle-layer {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.42) rotate(32deg);
  pointer-events: none;
  transition-delay: 0ms, 0ms;
}
.forge-ai-fab-wrap.is-open .forge-ai-fab-chevron-layer {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1) rotate(0deg);
  pointer-events: auto;
  transition-delay: 0.12s, 0.1s;
}
`,
        }}
      />
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          position: 'fixed', bottom: 30, right: 30, zIndex: zIndexProp ?? 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16
        }}
      >
        {isOpen && (
          <div style={{
            width: kimiOnlyMode ? 480 : 460, height: 580, background: '#fff', borderRadius: 24,
            boxShadow: '0 20px 48px rgba(0,0,0,0.18)', border: '1px solid #E5E7EB',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {/* Header */}
            <div
              style={{
                background: '#7C3AED',
                color: '#fff',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexShrink: 0,
                minHeight: 52,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, minWidth: 0 }}>
                <span style={{ display: 'flex', flexShrink: 0, opacity: 0.95 }}>
                  <Sparkles size={22} strokeWidth={2.2} aria-hidden />
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Forge AI
                </h3>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 8,
                  flex: 1,
                  minWidth: 0,
                  flexWrap: 'nowrap',
                }}
              >
                {kimiOnlyMode ? (
                  <span
                    title="Slides bruger Moonshots officielle Kimi API (kimi-k2.5). Sæt MOONSHOT_API_KEY eller KIMI_API_KEY og evt. KIMI_MODEL / MOONSHOT_BASE_URL i .env."
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.18)',
                      border: '1px solid rgba(255,255,255,0.35)',
                    }}
                  >
                    Slides · KIMI K2
                  </span>
                ) : (
                  <>
                    <select
                      value={
                        providerSelectKeys.includes(selectedProvider)
                          ? selectedProvider
                          : providerSelectKeys[0] || 'auto'
                      }
                      onChange={e => {
                        const provider = e.target.value
                        const nextModel = MODEL_OPTIONS[provider]?.[0] || ''
                        selectedProviderRef.current = provider
                        selectedModelRef.current = nextModel
                        setSelectedProvider(provider)
                        setSelectedModel(nextModel)
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.16)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#fff',
                        borderRadius: 8,
                        fontSize: 11,
                        padding: '6px 8px',
                        maxHeight: 32,
                        lineHeight: 1.2,
                      }}
                      disabled={isTyping}
                    >
                      {providerSelectKeys.map(provider => (
                        <option key={provider} value={provider} style={{ color: '#111827' }}>
                          {provider}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedModel}
                      onChange={e => {
                        const m = e.target.value
                        selectedModelRef.current = m
                        setSelectedModel(m)
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.16)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#fff',
                        borderRadius: 8,
                        fontSize: 11,
                        padding: '6px 8px',
                        maxHeight: 32,
                        lineHeight: 1.2,
                        maxWidth: 160,
                        minWidth: 0,
                      }}
                      disabled={isTyping}
                    >
                      {(MODEL_OPTIONS[selectedProvider] || []).map(model => (
                        <option key={model} value={model} style={{ color: '#111827' }}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Luk"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 22,
                    lineHeight: 1,
                    padding: '4px 6px',
                    borderRadius: 8,
                    opacity: 0.9,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, background: '#F9FAFB' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#6B7280', fontSize: 14, marginTop: 24, padding: '0 8px' }}>
                  {kimiOnlyMode ? (
                    <>
                      <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#374151' }}>Slides-assistent</p>
                      <p style={{ margin: '0 0 6px' }}>
                        Beskriv præsentationen. Jeg bruger dine vedhæftede filer og relevant projektkontekst fra
                        docs + board-værktøjer automatisk.
                      </p>
                      <p style={{ margin: 0, fontSize: 12.5 }}>
                        Først får du en disposition (outline) du kan rette; derefter opretter du slides med knappen i
                        panelet.
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: '0 0 10px', fontWeight: 600, color: '#374151', fontSize: 15 }}>Hej! Jeg er din AI-makker ✨</p>
                      <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>Jeg kan <strong>redigere dine tools direkte</strong> — bare bed mig om det.</p>
                      <div style={{ textAlign: 'left', fontSize: 12, color: '#4B5563', background: '#F9FAFB', borderRadius: 10, padding: '10px 12px', border: '1px solid #E5E7EB', marginTop: 4 }}>
                        <div style={{ marginBottom: 4 }}>✏️ &quot;Udfyld SWOT for en kaffebar&quot;</div>
                        <div style={{ marginBottom: 4 }}>📋 &quot;Lav en Kanban med onboarding-opgaver&quot;</div>
                        <div style={{ marginBottom: 4 }}>🧠 &quot;Strukturer mine noter i Affinity Diagram&quot;</div>
                        <div style={{ marginBottom: 4 }}>👤 &quot;Skriv en persona baseret på dette&quot;</div>
                        <div>📄 &quot;Analyser denne PDF og udfyld relevante tools&quot;</div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {messages.map((m: any) => (
                <div key={m.id} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  background: m.role === 'user' ? '#7C3AED' : '#fff',
                  color: m.role === 'user' ? '#fff' : '#111827',
                  padding: '10px 14px', borderRadius: 18,
                  borderBottomRightRadius: m.role === 'user' ? 4 : 18,
                  borderBottomLeftRadius: m.role !== 'user' ? 4 : 18,
                  maxWidth: '85%', fontSize: 13.5, lineHeight: 1.5,
                  boxShadow: m.role === 'user' ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                  border: m.role === 'user' ? 'none' : '1px solid #F3F4F6'
                }}>
                  {getMessageText(m)}
                  {getMessageFileParts(m).length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {getMessageFileParts(m).map((filePart: any, idx: number) => (
                        <span
                          key={`${m.id}-file-${idx}`}
                          style={{
                            fontSize: 11,
                            padding: '4px 8px',
                            borderRadius: 999,
                            background: m.role === 'user' ? 'rgba(255,255,255,0.2)' : '#F3F4F6',
                            color: m.role === 'user' ? '#fff' : '#4B5563',
                            border: m.role === 'user' ? '1px solid rgba(255,255,255,0.25)' : '1px solid #E5E7EB',
                          }}
                        >
                          📎 {filePart?.filename || 'fil'}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tool Call Feedback */}
                  {m.toolInvocations?.map((toolInvocation: any) => {
                    const toolCallId = toolInvocation.toolCallId;
                    const invocationSlug =
                      (toolInvocation?.args && typeof toolInvocation.args.slug === 'string' ? toolInvocation.args.slug : undefined) ||
                      (toolInvocation?.input && typeof toolInvocation.input.slug === 'string' ? toolInvocation.input.slug : 'modul')
                    if (toolInvocation.toolName === 'addTool' && 'result' in toolInvocation) {
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, padding: '8px 12px', background: '#F3F4F6', borderRadius: 8, fontSize: 12, color: '#4B5563' }}>
                          ✓ Oprettede {invocationSlug} modul.
                        </div>
                      )
                    }
                    if (toolInvocation.toolName === 'addTool') {
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                          Opretter {invocationSlug}...
                        </div>
                      )
                    }
                    if (toolInvocation.toolName === 'populateAffinityDiagram' && 'result' in toolInvocation) {
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, padding: '8px 12px', background: '#ECFDF5', borderRadius: 8, fontSize: 12, color: '#065F46', border: '1px solid #A7F3D0' }}>
                          ✓ AI har udfyldt Affinity Diagram.
                        </div>
                      )
                    }
                    if (toolInvocation.toolName === 'populateAffinityDiagram') {
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                          Udfylder Affinity Diagram...
                        </div>
                      )
                    }
                    if (toolInvocation.toolName === 'readToolData' && 'result' in toolInvocation) {
                      const slug =
                        (toolInvocation?.args?.toolSlug) ||
                        (toolInvocation?.input?.toolSlug) || 'værktøj'
                      const result = toolInvocation.result as any
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, padding: '8px 12px', background: '#F5F3FF', borderRadius: 8, fontSize: 12, color: '#5B21B6', border: '1px solid #DDD6FE' }}>
                          🔍 Læste {slug}{result?.isEmpty ? ' (tomt — udfylder med nyt indhold)' : ' — analyserer…'}
                        </div>
                      )
                    }
                    if (toolInvocation.toolName === 'readToolData') {
                      const slug = toolInvocation?.args?.toolSlug || toolInvocation?.input?.toolSlug || 'værktøj'
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                          🔍 Læser indhold i {slug}…
                        </div>
                      )
                    }
                    if (toolInvocation.toolName === 'updateToolData' && 'result' in toolInvocation) {
                      const slug =
                        (toolInvocation?.args && typeof toolInvocation.args.toolSlug === 'string' ? toolInvocation.args.toolSlug : undefined) ||
                        (toolInvocation?.input && typeof toolInvocation.input.toolSlug === 'string' ? toolInvocation.input.toolSlug : 'værktøj')
                      const desc =
                        (toolInvocation?.args?.description) ||
                        (toolInvocation?.input?.description)
                      const result = toolInvocation.result as any
                      const ok = result?.ok !== false
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, padding: '8px 12px', background: ok ? '#EFF6FF' : '#FEF2F2', borderRadius: 8, fontSize: 12, color: ok ? '#1E3A8A' : '#991B1B', border: `1px solid ${ok ? '#BFDBFE' : '#FECACA'}` }}>
                          {ok ? `✏️ Redigerede ${slug}${desc ? ` — ${desc}` : ''}` : `❌ Fejl ved opdatering af ${slug}: ${result?.reason || 'ukendt fejl'}`}
                        </div>
                      )
                    }
                    if (toolInvocation.toolName === 'updateToolData') {
                      const slug = toolInvocation?.args?.toolSlug || toolInvocation?.input?.toolSlug || 'værktøj'
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                          ✏️ Skriver indhold til {slug}…
                        </div>
                      )
                    }
                    if (toolInvocation.toolName === 'editProjectDocs' && 'result' in toolInvocation) {
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, padding: '8px 12px', background: '#ECFDF5', borderRadius: 8, fontSize: 12, color: '#065F46', border: '1px solid #A7F3D0' }}>
                          ✓ AI opdaterede docs.
                        </div>
                      )
                    }
                    if (toolInvocation.toolName === 'editProjectDocs') {
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                          Opdaterer docs...
                        </div>
                      )
                    }
                    if (toolInvocation.toolName === 'proposeSlideDeckOutline' && 'result' in toolInvocation) {
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, padding: '8px 12px', background: '#EEF2FF', borderRadius: 8, fontSize: 12, color: '#3730A3', border: '1px solid #C7D2FE' }}>
                          ✓ Slide-outline klar — redigér nedenfor og tryk «Opret slides».
                        </div>
                      )
                    }
                    if (toolInvocation.toolName === 'proposeSlideDeckOutline') {
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                          Udarbejder outline…
                        </div>
                      )
                    }
                    if (toolInvocation.toolName === 'editProjectSlides' && 'result' in toolInvocation) {
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, fontSize: 12, color: '#166534', border: '1px solid #BBF7D0' }}>
                          ✓ Slide opdateret.
                        </div>
                      )
                    }
                    if (toolInvocation.toolName === 'editProjectSlides') {
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                          Opdaterer slide…
                        </div>
                      )
                    }
                    return null;
                  })}
                </div>
              ))}
              {isTyping && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    color: '#6B7280',
                    fontSize: 12.5,
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: '8px 10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  ✨ {loadingMessages[loadingMessageIndex]}
                  <span style={{ display: 'inline-block', minWidth: 14 }}>{'.'.repeat(loadingDotCount)}</span>
                </div>
              )}
              {error && (
                <div style={{ alignSelf: 'flex-start', color: '#B91C1C', fontSize: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '8px 10px' }}>
                  AI-fejl:{' '}
                  {getFriendlyErrorMessage(error.message, kimiOnlyMode ? 'kimi' : selectedProviderRef.current)}
                </div>
              )}
              {uploadError && (
                <div style={{ alignSelf: 'flex-start', color: '#92400E', fontSize: 12, background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, padding: '8px 10px' }}>
                  Fil-upload: {uploadError}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleManualSubmit} style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: 10, background: '#fff' }}>
              {kimiOnlyMode && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB',
                    fontSize: 12,
                    color: '#374151',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Projektkontekst</div>
                  <p style={{ margin: '0 0 8px', fontSize: 11, color: '#6B7280' }}>
                    AI bruger altid docs + værktøjer automatisk. Vælg hvordan konteksten vægtes:
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSlidesContextMode('focused')}
                      disabled={isTyping}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: slidesContextMode === 'focused' ? '1px solid #4F46E5' : '1px solid #D1D5DB',
                        background: slidesContextMode === 'focused' ? '#EEF2FF' : '#fff',
                        color: slidesContextMode === 'focused' ? '#3730A3' : '#374151',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Fokuser på nævnte værktøjer
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlidesContextMode('broad')}
                      disabled={isTyping}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: slidesContextMode === 'broad' ? '1px solid #4F46E5' : '1px solid #D1D5DB',
                        background: slidesContextMode === 'broad' ? '#EEF2FF' : '#fff',
                        color: slidesContextMode === 'broad' ? '#3730A3' : '#374151',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Bred søgning i hele projektet
                    </button>
                  </div>
                </div>
              )}
              {pendingSlideOutline && (
                <div
                  style={{
                    maxHeight: 220,
                    overflowY: 'auto',
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: '#FAFAFA',
                    border: '1px solid #E5E7EB',
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8, color: '#111827' }}>Slide-outline</div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#4B5563' }}>
                    Analyse (valgfri)
                    <textarea
                      value={pendingSlideOutline.analysisSummary}
                      onChange={e =>
                        setPendingSlideOutline(prev =>
                          prev ? { ...prev, analysisSummary: e.target.value } : prev
                        )
                      }
                      rows={2}
                      style={{
                        width: '100%',
                        marginTop: 4,
                        padding: 8,
                        borderRadius: 8,
                        border: '1px solid #D1D5DB',
                        fontSize: 11,
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>
                  {pendingSlideOutline.slides.map((row, idx) => (
                    <div
                      key={`outline-${idx}`}
                      style={{
                        marginBottom: 10,
                        padding: 8,
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        background: '#fff',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#6B7280', minWidth: 22 }}>{String(idx + 1).padStart(2, '0')}</span>
                        <input
                          value={row.title}
                          onChange={e => updatePendingOutlineSlide(idx, { title: e.target.value })}
                          onKeyDown={e => {
                            if (e.key !== 'Backspace' && e.key !== 'Delete') return
                            if (e.metaKey || e.ctrlKey || e.altKey) return
                            if (
                              row.title.trim() !== '' ||
                              row.slideType.trim() !== '' ||
                              row.summary.trim() !== ''
                            )
                              return
                            if (pendingSlideOutline.slides.length <= 1) return
                            e.preventDefault()
                            removePendingOutlineSlide(idx)
                          }}
                          placeholder="Titel"
                          style={{ flex: 1, minWidth: 120, padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12 }}
                        />
                        <input
                          value={row.slideType}
                          onChange={e => updatePendingOutlineSlide(idx, { slideType: e.target.value })}
                          onKeyDown={e => {
                            if (e.key !== 'Backspace' && e.key !== 'Delete') return
                            if (e.metaKey || e.ctrlKey || e.altKey) return
                            if (
                              row.title.trim() !== '' ||
                              row.slideType.trim() !== '' ||
                              row.summary.trim() !== ''
                            )
                              return
                            if (pendingSlideOutline.slides.length <= 1) return
                            e.preventDefault()
                            removePendingOutlineSlide(idx)
                          }}
                          placeholder="Type"
                          style={{ width: 72, padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 11 }}
                        />
                        <button
                          type="button"
                          onClick={() => movePendingOutlineSlide(idx, -1)}
                          disabled={idx === 0 || isTyping || applyingOutline}
                          style={{ padding: '2px 6px', fontSize: 11, borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff' }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => movePendingOutlineSlide(idx, 1)}
                          disabled={idx >= pendingSlideOutline.slides.length - 1 || isTyping || applyingOutline}
                          style={{ padding: '2px 6px', fontSize: 11, borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff' }}
                        >
                          ↓
                        </button>
                      </div>
                      <textarea
                        value={row.summary}
                        onChange={e => updatePendingOutlineSlide(idx, { summary: e.target.value })}
                        onKeyDown={e => {
                          if (e.key !== 'Backspace' && e.key !== 'Delete') return
                          if (e.metaKey || e.ctrlKey || e.altKey) return
                          if (
                            row.title.trim() !== '' ||
                            row.slideType.trim() !== '' ||
                            row.summary.trim() !== ''
                          )
                            return
                          if (pendingSlideOutline.slides.length <= 1) return
                          e.preventDefault()
                          removePendingOutlineSlide(idx)
                        }}
                        rows={3}
                        placeholder="Disposition for denne slide…"
                        style={{
                          width: '100%',
                          padding: 8,
                          borderRadius: 8,
                          border: '1px solid #D1D5DB',
                          fontSize: 11,
                          resize: 'vertical',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={addPendingOutlineSlide}
                      disabled={isTyping || applyingOutline}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid #D1D5DB',
                        background: '#fff',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      + Slide
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingSlideOutline(null)}
                      disabled={applyingOutline}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid #E5E7EB',
                        background: '#F9FAFB',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Kassér outline
                    </button>
                    <button
                      type="button"
                      onClick={() => void applyPendingOutlineToSlides()}
                      disabled={applyingOutline || isTyping}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#4F46E5',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: applyingOutline ? 'wait' : 'pointer',
                        opacity: applyingOutline ? 0.85 : 1,
                      }}
                    >
                      {applyingOutline ? 'Opretter…' : 'Opret slides'}
                    </button>
                  </div>
                </div>
              )}
              {pendingFiles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {pendingFiles.map((file, index) => (
                    <span
                      key={`${file.name}-${index}`}
                      tabIndex={0}
                      role="listitem"
                      onKeyDown={e => {
                        if (e.key !== 'Delete' && e.key !== 'Backspace') return
                        e.preventDefault()
                        removePendingFile(index)
                      }}
                      style={{
                        border: '1px solid #E5E7EB',
                        background: '#F9FAFB',
                        borderRadius: 999,
                        fontSize: 11,
                        color: '#4B5563',
                        padding: '4px 8px',
                        cursor: 'default',
                        outline: 'none',
                      }}
                      title="Fokusér og tryk Delete eller Backspace for at fjerne"
                    >
                      📎 {file.name}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.rtf,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.gif"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping}
                  style={{
                    width: 40,
                    borderRadius: 20,
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    color: '#6B7280',
                    cursor: 'pointer',
                    opacity: isTyping ? 0.6 : 1,
                  }}
                  title={`Vedhæft filer (maks ${MAX_FILES} filer, ${MAX_FILE_SIZE_MB} MB pr. fil)`}
                >
                  📎
                </button>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Spørg om råd, eller vedhæft filer..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: 20, border: '1px solid #D1D5DB', fontSize: 14, outline: 'none' }}
              />
              <button
                type="submit"
                disabled={isTyping || (!input.trim() && pendingFiles.length === 0)}
                style={{
                  background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 20,
                  padding: '0 18px', fontWeight: 600, cursor: 'pointer',
                  opacity: (isTyping || (!input.trim() && pendingFiles.length === 0)) ? 0.5 : 1
                }}
              >
                Send
              </button>
              </div>
            </form>
          </div>
        )}

        <div className={`forge-ai-fab-wrap${isOpen ? ' is-open' : ''}`}>
          {!isOpen && <div className="forge-ai-fab-ring" aria-hidden />}
          <button
            type="button"
            className={`forge-ai-fab-btn${fabPressed ? ' pressing' : ''}`}
            onClick={() => {
              setFabPressed(true)
              window.setTimeout(() => setFabPressed(false), 480)
              setIsOpen(o => !o)
            }}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Luk Forge AI' : 'Åbn Forge AI'}
          >
            <span className="forge-ai-fab-icons" aria-hidden>
              <span className="forge-ai-fab-icon-layer forge-ai-fab-sparkle-layer">
                <Sparkles size={26} strokeWidth={2.2} />
              </span>
              <span className="forge-ai-fab-icon-layer forge-ai-fab-chevron-layer">
                <ChevronDown size={28} strokeWidth={2.5} />
              </span>
            </span>
          </button>
        </div>
      </div>
    </>
  )
}
