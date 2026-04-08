'use client'

// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

interface AiChatCompanionProps {
  projectId: string
  projectTools: { slug: string; tool: any }[]
  availableToolSlugs: string[]
  projectName: string
  framework: string
  role: string
  onAddTool: (slug: string) => void
}

export default function AiChatCompanion({
  projectId,
  projectTools,
  availableToolSlugs,
  projectName,
  framework,
  role,
  onAddTool,
}: AiChatCompanionProps) {
  const MODEL_OPTIONS: Record<string, string[]> = {
    auto: ['auto'],
    max: ['max'],
    google: ['gemini-2.5-flash', 'gemini-2.0-flash'],
    openai: ['gpt-4o-mini', 'gpt-4o'],
    anthropic: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'],
    openrouter: ['google/gemma-4-26b-a4b-it:free', 'openai/gpt-4o-mini'],
    mistral: ['mistral-small-latest', 'mistral-medium-latest'],
  }

  const MAX_FILES = 5
  const MAX_FILE_SIZE_MB = 8
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

  const [isOpen, setIsOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string>('auto')
  const [selectedModel, setSelectedModel] = useState<string>('auto')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

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
  const { messages, sendMessage, isLoading, status, error } = (useChat as any)({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
      body: () => {
        const recentUserMessages = (messages || [])
          .filter((m: any) => m?.role === 'user')
          .slice(-3)
          .map((m: any) => getMessageText(m))
          .filter(Boolean)

        return {
          aiProvider: selectedProvider,
          aiModel: selectedModel,
          context: {
            projectName,
            framework,
            role,
            activeToolSlugs: projectTools.map(t => t.slug),
            activeToolTitles: projectTools.map(t => t.tool?.title || t.slug),
            availableToolSlugs,
            toolCount: projectTools.length,
            recentUserMessages,
          },
        }
      },
    }),
    maxSteps: 3,
    async onToolCall({ toolCall }: { toolCall: any }) {
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
        const payload = toolCall?.args || toolCall?.input || {}
        const toolSlug = typeof payload?.toolSlug === 'string' ? payload.toolSlug : ''
        const data = payload?.data

        if (!toolSlug) return 'Kunne ikke opdatere værktøj: toolSlug mangler.'
        if (data === undefined) return `Kunne ikke opdatere ${toolSlug}: data mangler.`

        const hasTool = projectTools.some(t => t.slug === toolSlug)
        if (!hasTool) {
          if (availableToolSlugs.includes(toolSlug)) {
            await onAddTool(toolSlug)
          } else {
            return `Kunne ikke opdatere ${toolSlug}: værktøjet er ikke aktivt og kan ikke tilføjes lige nu.`
          }
        }

        const existingResponse = await fetch(`/api/projects/${projectId}/tools/${toolSlug}/data`)
        if (!existingResponse.ok) {
          return `Kunne ikke læse eksisterende data for ${toolSlug}.`
        }
        const existingPayload = await existingResponse.json()
        const existingData = existingPayload?.data

        if (existingData === undefined || isEmptyObject(existingData)) {
          return `Kan ikke lave sikker 1:1 opdatering af ${toolSlug} endnu. Åbn værktøjet én gang først, så skabelonen gemmes.`
        }

        const shapeErrors = validateShapeExact(existingData, data)
        if (shapeErrors.length > 0) {
          return `Afvist for ${toolSlug}: data matcher ikke 1:1 skemaet. (${shapeErrors.slice(0, 3).join(' | ')})`
        }

        const response = await fetch(`/api/projects/${projectId}/tools/${toolSlug}/data`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }),
        })

        if (!response.ok) {
          return `Kunne ikke gemme data i ${toolSlug}.`
        }

        return `Opdaterede indhold i ${toolSlug}.`
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
      return 'Ingen ændring udført'
    }
  })

  useEffect(() => {
    const storedProvider = localStorage.getItem('forgelab.aiProvider')
    const storedModel = localStorage.getItem('forgelab.aiModel')
    if (storedProvider && MODEL_OPTIONS[storedProvider]) {
      setSelectedProvider(storedProvider)
      if (storedModel && MODEL_OPTIONS[storedProvider].includes(storedModel)) {
        setSelectedModel(storedModel)
      } else {
        setSelectedModel(MODEL_OPTIONS[storedProvider][0])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('forgelab.aiProvider', selectedProvider)
    localStorage.setItem('forgelab.aiModel', selectedModel)
  }, [selectedProvider, selectedModel])

  // In newer Vercel AI SDKs, loading can be inferred from status or isLoading
  const isTyping = isLoading || status === 'in_progress' || status === 'submitted' || status === 'streaming'
  const loadingMessages = [
    'Tænker kreativt over din idé',
    'Skitserer næste skridt',
    'Bygger forslag til dit board',
    'Forfiner et stærkt svar',
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError(null)
    if ((!input.trim() && pendingFiles.length === 0) || isTyping) return

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

  const getFriendlyErrorMessage = (rawMessage?: string) => {
    if (!rawMessage) return 'Der opstod en ukendt fejl. Prøv igen.'
    const lower = rawMessage.toLowerCase()

    if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('exceeded your current quota')) {
      return 'Din AI-kvote er opbrugt lige nu. Prøv igen om lidt eller skift til en billigere model.'
    }

    if (lower.includes('api key') || lower.includes('google_generative_ai_api_key')) {
      return 'API-nøglen mangler eller er ugyldig. Tjek GOOGLE_GENERATIVE_AI_API_KEY i .env.local.'
    }

    if (lower.includes('failed to fetch') || lower.includes('network')) {
      return 'Netværksfejl ved kontakt til AI-serveren. Tjek forbindelse og prøv igen.'
    }

    return rawMessage
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <>
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          position: 'fixed', bottom: 30, right: 30, zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16
        }}
      >
        {isOpen && (
          <div style={{
            width: 380, height: 500, background: '#fff', borderRadius: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid #E5E7EB',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ background: '#7C3AED', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>✨</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Forge AI</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={selectedProvider}
                  onChange={e => {
                    const provider = e.target.value
                    setSelectedProvider(provider)
                    setSelectedModel(MODEL_OPTIONS[provider]?.[0] || '')
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.16)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    borderRadius: 8,
                    fontSize: 11,
                    padding: '4px 6px',
                  }}
                  disabled={isTyping}
                >
                  {Object.keys(MODEL_OPTIONS).map(provider => (
                    <option key={provider} value={provider} style={{ color: '#111827' }}>
                      {provider}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.16)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    borderRadius: 8,
                    fontSize: 11,
                    padding: '4px 6px',
                    maxWidth: 150,
                  }}
                  disabled={isTyping}
                >
                  {(MODEL_OPTIONS[selectedProvider] || []).map(model => (
                    <option key={model} value={model} style={{ color: '#111827' }}>
                      {model}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20, opacity: 0.8 }}
                >×</button>
              </div>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, background: '#F9FAFB' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#6B7280', fontSize: 14, marginTop: 40 }}>
                  <p>Hej! Jeg er din design-makker.</p>
                  <p>Spørg mig om hjælp til dit projekt, eller bed mig om at oprette nye lærred-værktøjer for dig.</p>
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
                    if (toolInvocation.toolName === 'updateToolData' && 'result' in toolInvocation) {
                      const slug =
                        (toolInvocation?.args && typeof toolInvocation.args.toolSlug === 'string' ? toolInvocation.args.toolSlug : undefined) ||
                        (toolInvocation?.input && typeof toolInvocation.input.toolSlug === 'string' ? toolInvocation.input.toolSlug : 'værktøj')
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, padding: '8px 12px', background: '#EFF6FF', borderRadius: 8, fontSize: 12, color: '#1E3A8A', border: '1px solid #BFDBFE' }}>
                          ✓ AI opdaterede indhold i {slug}.
                        </div>
                      )
                    }
                    if (toolInvocation.toolName === 'updateToolData') {
                      return (
                        <div key={toolCallId} style={{ marginTop: 8, fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                          Opdaterer værktøjsindhold...
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
                  AI-fejl: {getFriendlyErrorMessage(error.message)}
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
              {pendingFiles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {pendingFiles.map((file, index) => (
                    <button
                      key={`${file.name}-${index}`}
                      type="button"
                      onClick={() => removePendingFile(index)}
                      style={{
                        border: '1px solid #E5E7EB',
                        background: '#F9FAFB',
                        borderRadius: 999,
                        fontSize: 11,
                        color: '#4B5563',
                        padding: '4px 8px',
                        cursor: 'pointer',
                      }}
                      title="Klik for at fjerne fil"
                    >
                      📎 {file.name} ×
                    </button>
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

        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: 60, height: 60, borderRadius: '50%', background: '#7C3AED',
            color: '#fff', border: 'none', boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isOpen ? '↓' : '✨'}
        </button>
      </div>
    </>
  )
}
