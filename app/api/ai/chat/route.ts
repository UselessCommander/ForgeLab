import { generateText, streamText, tool, type ModelMessage } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { mistral } from '@ai-sdk/mistral'
import { z } from 'zod'
import { refreshProjectKnowledgeIndex, retrieveProjectKnowledge } from '@/lib/project-rag'
import { getCurrentUserId } from '@/lib/auth'
import { getUserById } from '@/lib/users'
import { hasAiAccessFromSubscription } from '@/lib/subscription'
import { hasServerEnv as hasEnv, serverEnv as env } from '@/lib/server-env'

/** Max-mode kalder mange modeller parallelt; giv serverless tid nok (Vercel: tjek plan-limits). */
export const maxDuration = 60

const SUPPORTED_AI_PROVIDERS = [
  'auto',
  'max',
  'google',
  'openai',
  'anthropic',
  'openrouter',
  'mistral',
  'groq',
  'kimi',
] as const
type SupportedProvider = (typeof SUPPORTED_AI_PROVIDERS)[number]

const PROVIDER_MODELS: Record<SupportedProvider, string[]> = {
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
const ALLOWED_TOOL_SLUGS = [
  'kanban',
  'swot-generator',
  'brainstorming',
  'empathy-map',
  'persona-canvas',
  'gantt-chart',
  'business-model-canvas',
  'affinity-diagram',
  'tows-matrix',
  'porters-five-forces',
  'value-proposition-canvas',
  'scamper',
  'hmw',
  'five-whys',
  'brugerrejse',
  'dikw-pyramiden',
  'seo-pyramide',
  'strategisk-afvejning',
  'aida-funnel',
  'dvf-venn-model',
  'pestel',
  'pirate-funnel',
  'smuk-model',
  'smp-model',
  'aaker-identity-model',
  'gallup-kompasrose',
  'peso',
  'golden-circle',
  'project-docs',
  'project-slides',
  'ab-test',
  'survey-template',
  'qr-generator',
  'card-sorting',
] as const

const SUPPORTED_MIME_PREFIXES = ['image/', 'text/']
const SUPPORTED_EXACT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]

/** Tillad vilkårlige OpenRouter model-id'er (org/model), ikke kun listen i PROVIDER_MODELS. */
function isValidOpenRouterModelId(model: string): boolean {
  const t = model.trim()
  if (t.length < 3 || t.length > 160 || !t.includes('/')) return false
  return /^[a-zA-Z0-9./:_-]+$/.test(t)
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (userId !== 'admin') {
      const user = await getUserById(userId)
      const hasManualAiAccess = user?.ai_enabled === true
      const hasSubscriptionAiAccess = hasAiAccessFromSubscription(user)

      if (!hasManualAiAccess && !hasSubscriptionAiAccess) {
        console.warn('AI access denied', {
          userId,
          username: user?.username || null,
          email: user?.email || null,
          ai_enabled: user?.ai_enabled ?? null,
          plan_key: user?.plan_key ?? null,
          subscription_status: user?.subscription_status ?? null,
          at: new Date().toISOString(),
        })
        return new Response(
          JSON.stringify({
            error: 'AI er ikke aktiveret for din bruger endnu. Opgrader til Pro eller kontakt os for adgang.',
            code: 'AI_ACCESS_DENIED',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const { messages, context, aiProvider: requestedProvider, aiModel: requestedModel } = await req.json()

    const envProvider = (env('AI_PROVIDER', 'NEXT_PUBLIC_AI_PROVIDER') || 'google').toLowerCase()
    const normalizedRequestedProvider =
      typeof requestedProvider === 'string' ? requestedProvider.toLowerCase() : undefined
    const aiProvider = (
      normalizedRequestedProvider && SUPPORTED_AI_PROVIDERS.includes(normalizedRequestedProvider as SupportedProvider)
        ? normalizedRequestedProvider
        : envProvider
    ) as SupportedProvider
    const googleModel = env('GOOGLE_MODEL', 'NEXT_PUBLIC_GOOGLE_MODEL') || 'gemini-2.5-flash'
    const openaiModel = env('OPENAI_MODEL', 'NEXT_PUBLIC_OPENAI_MODEL') || 'gpt-4o-mini'
    const anthropicModel = env('ANTHROPIC_MODEL', 'NEXT_PUBLIC_ANTHROPIC_MODEL') || 'claude-3-5-sonnet-latest'
    const openrouterModel =
      env('OPENROUTER_MODEL', 'NEXT_PUBLIC_OPENROUTER_MODEL') ||
      'nvidia/nemotron-3-super-120b-a12b:free'
    const mistralModel = env('MISTRAL_MODEL', 'NEXT_PUBLIC_MISTRAL_MODEL') || 'mistral-small-latest'
    const groqModel = env('GROQ_MODEL', 'NEXT_PUBLIC_GROQ_MODEL') || 'llama-3.3-70b-versatile'
    const kimiModel = env('KIMI_MODEL', 'NEXT_PUBLIC_KIMI_MODEL') || 'kimi-k2.5'
    const requestedModelSafe = typeof requestedModel === 'string' ? requestedModel : undefined

    if (aiProvider === 'openai') {
      if (!hasEnv('OPENAI_API_KEY')) {
        return new Response(
          JSON.stringify({ error: 'OpenAI API key mangler. Sæt OPENAI_API_KEY i miljøvariabler (lokalt/Vercel).' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } else if (aiProvider === 'openrouter') {
      if (!hasEnv('OPENROUTER_API_KEY')) {
        return new Response(
          JSON.stringify({ error: 'OpenRouter API key mangler. Sæt OPENROUTER_API_KEY i miljøvariabler (lokalt/Vercel).' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } else if (aiProvider === 'kimi') {
      if (!hasEnv('MOONSHOT_API_KEY', 'KIMI_API_KEY')) {
        return new Response(
          JSON.stringify({
            error:
              'Moonshot API key mangler. Sæt MOONSHOT_API_KEY eller KIMI_API_KEY i miljøvariabler (lokalt/Vercel).',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } else if (aiProvider === 'anthropic') {
      if (!hasEnv('ANTHROPIC_API_KEY')) {
        return new Response(
          JSON.stringify({ error: 'Anthropic API key mangler. Sæt ANTHROPIC_API_KEY i miljøvariabler (lokalt/Vercel).' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } else if (aiProvider === 'mistral') {
      if (!hasEnv('MISTRAL_API_KEY')) {
        return new Response(
          JSON.stringify({ error: 'Mistral API key mangler. Sæt MISTRAL_API_KEY i miljøvariabler (lokalt/Vercel).' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } else if (aiProvider === 'groq') {
      if (!hasEnv('GROQ_API_KEY')) {
        return new Response(
          JSON.stringify({ error: 'Groq API key mangler. Sæt GROQ_API_KEY i miljøvariabler (lokalt/Vercel).' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } else if (aiProvider === 'google') {
      if (!hasEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY')) {
        return new Response(
          JSON.stringify({
            error:
              'Google AI API key mangler. Sæt GOOGLE_GENERATIVE_AI_API_KEY (eller GOOGLE_API_KEY/GEMINI_API_KEY) i miljøvariabler (lokalt/Vercel).',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Ugyldigt chat-format (messages mangler).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const contextObject =
      context && typeof context === 'object' ? context : null
    const projectId = typeof contextObject?.projectId === 'string' ? contextObject.projectId : ''
    const workspaceTab =
      typeof contextObject?.workspaceTab === 'string' ? contextObject.workspaceTab : 'board'

    if (aiProvider === 'kimi' && workspaceTab !== 'slides') {
      return new Response(
        JSON.stringify({ error: 'KIMI er kun tilgængelig i Slides-tab.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const activeToolSlugs = Array.isArray(contextObject?.activeToolSlugs)
      ? contextObject.activeToolSlugs.filter((x: unknown): x is string => typeof x === 'string')
      : []
    const availableToolSlugs = Array.isArray(contextObject?.availableToolSlugs)
      ? contextObject.availableToolSlugs.filter((x: unknown): x is string => typeof x === 'string')
      : []
    const latestUserMessage = [...messages].reverse().find((m: any) => m?.role === 'user')
    const latestUserMessageText =
      typeof latestUserMessage?.content === 'string'
        ? latestUserMessage.content
        : Array.isArray(latestUserMessage?.parts)
          ? latestUserMessage.parts
              .filter((p: any) => p?.type === 'text' && typeof p?.text === 'string')
              .map((p: any) => p.text)
              .join('\n')
          : ''
    const latestUserMessageHasPdf = Array.isArray(latestUserMessage?.parts)
      ? latestUserMessage.parts.some(
          (part: any) => part?.type === 'file' && typeof part?.mediaType === 'string' && part.mediaType.includes('pdf')
        )
      : false
    const safeContext = contextObject
      ? JSON.stringify(contextObject, null, 2)
      : typeof context === 'string'
        ? context
        : 'Ingen ekstra board-kontekst modtaget.'

    let ragContextText = ''
    if (projectId && latestUserMessageText.trim()) {
      try {
        const sourceSlugs =
          workspaceTab === 'slides'
            ? Array.isArray(contextObject?.slidesIncludedToolSlugs)
              ? contextObject.slidesIncludedToolSlugs.filter((x: unknown): x is string => typeof x === 'string')
              : activeToolSlugs
            : activeToolSlugs

        const allowedSources = Array.from(new Set(['project-docs', ...sourceSlugs])).filter(Boolean)
        await refreshProjectKnowledgeIndex(projectId, allowedSources)
        const ragChunks = await retrieveProjectKnowledge({
          projectId,
          query: latestUserMessageText,
          sourceSlugs: allowedSources,
          maxChunks: workspaceTab === 'slides' ? 10 : 8,
        })
        ragContextText = ragChunks
          .map((chunk, i) => `[${i + 1}] (${chunk.sourceSlug}) ${chunk.chunkText}`)
          .join('\n\n')
      } catch (error) {
        console.warn('RAG retrieval failed, continuing without retrieved context', error)
      }
    }

    // Tool data schema reference for the AI
    const TOOL_SCHEMAS = `
## DATASTRUKTURER FOR HVERT VÆRKTØJ (brug readToolData for at se faktisk indhold)

### kanban
{ columns: [{ id, title, cards: [{ id, title, description?, color? }] }] }
Eksempel: { columns: [{ id:"1", title:"To Do", cards:[{ id:"c1", title:"Researche konkurrenter", description:"" }] }, { id:"2", title:"I gang", cards:[] }, { id:"3", title:"Færdig", cards:[] }] }

### swot-generator
{ strengths: string[], weaknesses: string[], opportunities: string[], threats: string[] }
Eksempel: { strengths:["Stærkt brand","Erfaret team"], weaknesses:["Lav kapital"], opportunities:["Voksende marked"], threats:["Stor konkurrence"] }

### brainstorming
{ ideas: [{ id, text, votes?, category? }], categories?: string[] }
Eksempel: { ideas:[{ id:"1", text:"Ny onboarding-flow" }, { id:"2", text:"Loyalty program" }] }

### empathy-map
{ says: string[], thinks: string[], does: string[], feels: string[], pains: string[], gains: string[] }

### persona-canvas
{ name: string, age?: string, occupation?: string, bio?: string, goals: string[], frustrations: string[], motivations: string[], behaviors: string[], quote?: string, demographics?: Record<string,string> }

### gantt-chart
{ tasks: [{ id, title, start: "YYYY-MM-DD", end: "YYYY-MM-DD", progress?: number, color?: string, dependencies?: string[] }] }

### business-model-canvas
{ keyPartners: string[], keyActivities: string[], keyResources: string[], valuePropositions: string[], customerRelationships: string[], channels: string[], customerSegments: string[], costStructure: string[], revenueStreams: string[] }

### tows-matrix
{ so: string[], st: string[], wo: string[], wt: string[] }

### porters-five-forces
{ competitive: { rating: number, notes: string }, newEntrants: { rating: number, notes: string }, substitutes: { rating: number, notes: string }, buyerPower: { rating: number, notes: string }, supplierPower: { rating: number, notes: string } }
(rating er 1-5, 5=høj styrke)

### value-proposition-canvas
{ customerJobs: string[], pains: string[], gains: string[], products: string[], painRelievers: string[], gainCreators: string[] }

### affinity-diagram
{ groups: [{ id, title, notes: [{ id, text }] }], ungrouped: [{ id, text }] }

### scamper
{ subject?: string, substitute: string[], combine: string[], adapt: string[], modify: string[], putToOtherUses: string[], eliminate: string[], reverse: string[] }

### hmw
{ challenge?: string, questions: [{ id, text, votes?: number }] }

### five-whys
{ problem: string, whys: [{ id, question: string, answer: string }], rootCause?: string }

### brugerrejse
{ persona?: string, phases: [{ id, name, actions: string[], thoughts: string[], emotions: string[], touchpoints: string[], opportunities: string[] }] }

### dikw-pyramiden
{ data: string[], information: string[], knowledge: string[], wisdom: string[] }

### pestel
{ political: string[], economic: string[], social: string[], technological: string[], environmental: string[], legal: string[] }

### pirate-funnel
{ acquisition: { description: string, metric: string, value: string }, activation: { description: string, metric: string, value: string }, retention: { description: string, metric: string, value: string }, revenue: { description: string, metric: string, value: string }, referral: { description: string, metric: string, value: string } }

### smuk-model
{ segments: [{ id, name, size: string, growth: string, opportunities: string, costs: string, competition: string, score?: number }] }

### aaker-identity-model
{ brandEssence: string, coreIdentity: string[], extendedIdentity: { asProduct: string[], asOrganization: string[], asPerson: string[], asSymbol: string[] } }

### gallup-kompasrose
{ values: [{ id, label: string, dimension: "modern"|"traditional"|"community"|"individual", score?: number, description?: string }] }
`

    const systemPrompt =
      workspaceTab === 'slides'
        ? [
            'Du er ForgeLabs SUPERCHARGED præsentations-assistent. Du er ekspert i at skabe kraftfulde præsentationer direkte fra projektets data.',
            'Kontekst:',
            safeContext,
            '',
            'Svar altid på dansk.',
            '',
            'KRITISK — INGEN NETSØGNING:',
            '- Brug KUN: (1) brugerens vedhæftede filer, (2) slidesProjectContextDigest og projektkontekst.',
            '- Mangler du kilder, bed brugeren om at vedhæfte dem.',
            ragContextText
              ? `\nRETRIEVED PROJEKTKONTEKST:\n${ragContextText}`
              : '\nRETRIEVED PROJEKTKONTEKST: Ingen snippets fundet.',
            '',
            'WORKFLOW:',
            '1) Kort analyse: emne, målgruppe, visuel stil, antal slides.',
            '2) Kald proposeSlideDeckOutline med analysisSummary + slides-array (order, title, slideType, summary).',
            '3) Afslut med besked om at gennemse outline i UI og trykke "Opret slides".',
            '4) Kald IKKE editProjectSlides til nyt deck — kun til præcise rettelser på ét eksisterende slide.',
          ].join('\n')
        : [
            '# ForgeLab AI-assistent — SUPERCHARGED',
            '',
            'Du er en kraftfuld AI-assistent integreret direkte i ForgeLabs projekt-board.',
            'Din PRIMÆRE styrke er at redigere, udfylde og forbedre værktøjer direkte i boardet via dine tools.',
            'Du SKAL bruge dine tools aktivt og proaktivt — det er det der gør dig værdifuld.',
            '',
            '## Boardkontekst',
            safeContext,
            ragContextText
              ? `\n## Retrieved projektkontekst\n${ragContextText}`
              : '',
            '',
            '## Dine tools og hvornår du bruger dem',
            '',
            '### readProjectFiles — LÆS GEMTE PDF\'ER FRA PROJEKTET',
            '- Kald dette tool når brugeren nævner en PDF/fil de har uploadet til projektet.',
            '- Returnerer en liste med filnavne og signerede downloadUrl\'er.',
            '- Hent PDFen via downloadUrl og analyser indholdet direkte — bed IKKE brugeren om at kopiere teksten.',
            '- Brug indholdet til at udfylde relevante tools med updateToolData.',
            '',
            '### readToolData — LÆS ALTID FØR DU REDIGERER',
            '- Kald dette tool FØRSTE gang du skal redigere et tool, for at se den faktiske datastruktur.',
            '- Brug outputtet som skabelon til updateToolData.',
            '- Fortæl brugeren hvad du finder og hvad du vil gøre.',
            '',
            '### updateToolData — DIN KERNEKRAFT',
            '- Brug dette aktivt og selvsikkert. Du MÅ og SKAL redigere tools direkte.',
            '- Workflow: readToolData → analyser → updateToolData med komplet dataobjekt.',
            '- Send ALTID et komplet dataobjekt (ikke kun ændrede felter) — samme struktur som det du læste.',
            '- Fortæl kort hvad du ændrede efterfølgende.',
            '- Fungerer på: kanban, swot-generator, brainstorming, empathy-map, persona-canvas, gantt-chart, business-model-canvas, tows-matrix, porters-five-forces, value-proposition-canvas, scamper, hmw, five-whys, brugerrejse, dikw-pyramiden, pestel, pirate-funnel, smuk-model, aaker-identity-model, gallup-kompasrose OG ALLE ANDRE aktive tools.',
            '',
            '### editProjectDocs — skriv til projekt-dokumentation',
            '- mode="append": tilføj nyt afsnit til eksisterende side.',
            '- mode="replace": erstat hele siden (kun når brugeren eksplicit beder om det).',
            '- pageTitle: brug en specifik docs-side eller opret en ny.',
            '',
            '### populateAffinityDiagram — strukturer idéer hurtigt',
            '- Brug når brugeren har rå input/noter der skal grupperes i temaer.',
            '',
            '### addTool — tilføj nyt modul',
            `- Brug kun når brugeren eksplicit beder om et nyt modul.`,
            `- Tilgængelige slugs: ${activeToolSlugs.join(', ') || '(se kontekst)'}.`,
            '',
            TOOL_SCHEMAS,
            '',
            '## Adfærdsregler',
            '- Svar ALTID på dansk.',
            '- Vær kort og handlingsorienteret. Undgå lange forklaringer medmindre brugeren beder om det.',
            '- Brug tools proaktivt — foreslå ikke bare, GØR det.',
            '- Hvis du er i tvivl om datastruktur, kald readToolData FØRST.',
            '- Hvis du mangler information for at gøre noget meningsfuldt, stil præcis ÉT spørgsmål.',
            '- Efter at have redigeret et tool: beskriv kort hvad du ændrede og hvad brugeren kan gøre nu.',
            `- PDF vedhæftet: ${latestUserMessageHasPdf ? 'JA — analyser den og udfyld relevante tools proaktivt.' : 'Nej.'}`,
            '',
            `Aktiv fane: ${workspaceTab}. Aktive tools: ${activeToolSlugs.join(', ') || 'ingen endnu'}.`,
          ].join('\n')

    const normalizedMessages: ModelMessage[] = []
    let lastUserMessageIndex = -1
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages?.[i]?.role === 'user') {
        lastUserMessageIndex = i
        break
      }
    }
    let totalFilePayloadChars = 0
    const MAX_FILE_PAYLOAD_CHARS = 2_500_000

    for (let messageIndex = 0; messageIndex < messages.length; messageIndex += 1) {
      const message = messages[messageIndex]
      const role: 'assistant' | 'system' | 'user' =
        message?.role === 'assistant'
          ? 'assistant'
          : message?.role === 'system'
            ? 'system'
            : 'user'

      const textParts: string[] = []
      const userContentParts: Array<{ type: 'text'; text: string } | { type: 'file'; data: string; mediaType: string }> = []

      if (typeof message?.content === 'string' && message.content.trim()) {
        const text = message.content.trim()
        textParts.push(text)
        userContentParts.push({ type: 'text', text })
      }

      if (Array.isArray(message?.parts)) {
        for (const part of message.parts) {
          if (part?.type === 'text' && typeof part?.text === 'string' && part.text.trim()) {
            const text = part.text.trim()
            textParts.push(text)
            userContentParts.push({ type: 'text', text })
            continue
          }

          if (role !== 'user' || part?.type !== 'file') continue
          // Send kun fil-binary fra den seneste user-besked.
          // Ellers vokser payload hurtigt over Vercel-limits på efterfølgende turns.
          if (messageIndex !== lastUserMessageIndex) continue

          const mimeType = typeof part?.mediaType === 'string' ? part.mediaType : ''
          const hasSupportedPrefix = SUPPORTED_MIME_PREFIXES.some(prefix => mimeType.startsWith(prefix))
          const hasSupportedExactType = SUPPORTED_EXACT_MIME_TYPES.includes(mimeType)
          if (!hasSupportedPrefix && !hasSupportedExactType) continue

          if (typeof part?.url === 'string' && part.url.startsWith('data:')) {
            const base64Data = part.url.split(',')[1]
            if (base64Data) {
              totalFilePayloadChars += base64Data.length
              userContentParts.push({
                type: 'file',
                data: base64Data,
                mediaType: mimeType || 'application/octet-stream',
              })
            }
          }
        }
      }

      if (role === 'system') {
        const content = textParts.join('\n').trim()
        if (content) normalizedMessages.push({ role: 'system', content })
        continue
      }

      if (role === 'assistant') {
        const content = textParts.join('\n').trim()
        if (content) normalizedMessages.push({ role: 'assistant', content })
        continue
      }

      if (userContentParts.length > 0) {
        normalizedMessages.push({ role: 'user', content: userContentParts })
      }
    }

    if (totalFilePayloadChars > MAX_FILE_PAYLOAD_CHARS) {
      return new Response(
        JSON.stringify({
          error:
            'Vedhæftede filer er for store til én AI-anmodning. Prøv med færre/mindre filer eller del dokumentet op.',
          code: 'FILE_PAYLOAD_TOO_LARGE',
        }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const openrouter = createOpenAI({
      apiKey: env('OPENROUTER_API_KEY'),
      baseURL: 'https://openrouter.ai/api/v1',
    })
    const googleApiKey = env('GOOGLE_GENERATIVE_AI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY')
    const google = createGoogleGenerativeAI({
      apiKey: googleApiKey,
    })

    const moonshotApiKey = env('MOONSHOT_API_KEY', 'KIMI_API_KEY')
    const moonshotBaseUrl = env('MOONSHOT_BASE_URL') || 'https://api.moonshot.ai/v1'
    const moonshot = moonshotApiKey
      ? createOpenAI({
          apiKey: moonshotApiKey,
          baseURL: moonshotBaseUrl,
        })
      : null

    const groq = createOpenAI({
      apiKey: env('GROQ_API_KEY'),
      baseURL: 'https://api.groq.com/openai/v1',
    })

    const modelForProvider = (() => {
      if (aiProvider === 'google') return googleModel
      if (aiProvider === 'openai') return openaiModel
      if (aiProvider === 'anthropic') return anthropicModel
      if (aiProvider === 'openrouter') return openrouterModel
      if (aiProvider === 'kimi') return kimiModel
      if (aiProvider === 'mistral') return mistralModel
      if (aiProvider === 'groq') return groqModel
      return googleModel
    })()

    const selectedModel = (() => {
      if (!requestedModelSafe) return modelForProvider
      if (PROVIDER_MODELS[aiProvider].includes(requestedModelSafe)) return requestedModelSafe
      if (aiProvider === 'openrouter' && isValidOpenRouterModelId(requestedModelSafe)) {
        return requestedModelSafe.trim()
      }
      return modelForProvider
    })()

    // OpenAI-kompatible proxies (OpenRouter, Groq, Moonshot) understøtter kun Chat Completions.
    // createOpenAI()(id) bruger ellers Responses API — det giver "Invalid Responses API request" der.
    const directModel =
      aiProvider === 'openai'
        ? openai(selectedModel)
        : aiProvider === 'anthropic'
          ? anthropic(selectedModel)
          : aiProvider === 'openrouter'
            ? openrouter.chat(selectedModel)
            : aiProvider === 'mistral'
              ? mistral(selectedModel)
              : aiProvider === 'kimi'
                ? moonshot!.chat(selectedModel)
                : aiProvider === 'groq'
                  ? groq.chat(selectedModel)
                  : google(selectedModel)

    const tools = {
      addTool: tool({
        description: 'Tilføjer et værktøj direkte til projekt-boardet. Brug kun når brugeren eksplicit beder om et nyt modul.',
        inputSchema: z.object({
          slug: z.string().describe('Slug for modulet, fx "kanban", "swot-generator", "brainstorming" osv.'),
        }),
        execute: async ({ slug }) => {
          if (!ALLOWED_TOOL_SLUGS.includes(slug as (typeof ALLOWED_TOOL_SLUGS)[number])) {
            return { ok: false, reason: `Ugyldigt modul-slug: ${slug}` }
          }
          if (activeToolSlugs.includes(slug)) {
            return { ok: false, reason: `Modulet "${slug}" er allerede aktivt.` }
          }
          if (availableToolSlugs.length > 0 && !availableToolSlugs.includes(slug)) {
            return { ok: false, reason: `Modulet "${slug}" er ikke tilgængeligt i dette board.` }
          }
          return { ok: true, slug }
        },
      }),

      readProjectFiles: tool({
        description:
          'Lister alle gemte PDF-filer i projektet og returnerer signerede download-URL\'er. Brug dette når brugeren beder dig om at læse, analysere eller bruge indhold fra projektets gemte PDF-filer. Returnerer URL\'er du kan vedhæfte i din analyse.',
        inputSchema: z.object({}),
        execute: async () => {
          if (!projectId) return { ok: false, reason: 'Intet projektId tilgængeligt.' }
          try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
            const res = await fetch(`${baseUrl}/api/projects/${projectId}/files`, {
              headers: { Cookie: req.headers.get('cookie') || '' },
            })
            if (!res.ok) return { ok: false, reason: `Kunne ikke hente filer (HTTP ${res.status}).` }
            const payload = await res.json()
            const files = payload?.files || []
            if (files.length === 0) return { ok: true, files: [], message: 'Ingen PDF-filer er uploadet til dette projekt endnu.' }
            return {
              ok: true,
              files: files.map((f: any) => ({
                id: f.id,
                filename: f.filename,
                sizeBytes: f.sizeBytes,
                createdAt: f.createdAt,
                downloadUrl: f.downloadUrl,
              })),
              message: `Fandt ${files.length} PDF-fil(er) i projektet. Brug downloadUrl til at hente og analysere indholdet.`,
            }
          } catch (err) {
            return { ok: false, reason: `Fejl ved hentning af filer: ${err instanceof Error ? err.message : 'ukendt'}` }
          }
        },
      }),

      readToolData: tool({
        description:
          'Læser det aktuelle indhold af et værktøj på boardet. Brug dette FØR updateToolData for at forstå eksisterende datastruktur og nuværende indhold, så du kan lave præcise, meningsfulde opdateringer.',
        inputSchema: z.object({
          toolSlug: z.string().min(1).describe('Slug for det værktøj du vil læse, fx "kanban", "swot-generator"'),
        }),
        execute: async ({ toolSlug }) => {
          if (!projectId) return { ok: false, reason: 'Intet projektId tilgængeligt.' }
          try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
            const res = await fetch(`${baseUrl}/api/projects/${projectId}/tools/${toolSlug}/data`, {
              headers: { Cookie: req.headers.get('cookie') || '' },
            })
            if (!res.ok) return { ok: false, reason: `Kunne ikke hente data for ${toolSlug} (HTTP ${res.status}).` }
            const payload = await res.json()
            const data = payload?.data
            return { ok: true, toolSlug, data: data ?? null, isEmpty: !data || (typeof data === 'object' && Object.keys(data).length === 0) }
          } catch (err) {
            return { ok: false, reason: `Fejl ved læsning af ${toolSlug}: ${err instanceof Error ? err.message : 'ukendt'}` }
          }
        },
      }),

      updateToolData: tool({
        description: `Skriver/opdaterer data i et vilkårligt værktøj på boardet. Du KAN og BØR bruge dette tool aktivt til at udfylde, forbedre og redigere tools direkte — det er netop din kernekraft. Kald readToolData først for at se eksisterende struktur, og send derefter et komplet opdateret dataobjekt. Fungerer på alle aktive tools.`,
        inputSchema: z.object({
          toolSlug: z.string().min(1).describe('Slug for det værktøj der skal opdateres'),
          data: z.unknown().describe('Det komplette nye dataobjekt der skal gemmes — samme struktur som eksisterende data'),
          description: z.string().max(200).optional().describe('Kort beskrivelse af hvad du ændrer (vises til brugeren)'),
        }),
        execute: async ({ toolSlug, data, description }) => {
          if (!ALLOWED_TOOL_SLUGS.includes(toolSlug as (typeof ALLOWED_TOOL_SLUGS)[number])) {
            return { ok: false, reason: `Ukendt tool-slug: ${toolSlug}` }
          }
          if (!projectId) return { ok: false, reason: 'Intet projektId.' }
          try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
            const res = await fetch(`${baseUrl}/api/projects/${projectId}/tools/${toolSlug}/data`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') || '' },
              body: JSON.stringify({ data }),
            })
            if (!res.ok) return { ok: false, reason: `Kunne ikke gemme data i ${toolSlug} (HTTP ${res.status}).` }
            return { ok: true, toolSlug, description: description || `Opdaterede ${toolSlug}` }
          } catch (err) {
            return { ok: false, reason: `Fejl ved gemning: ${err instanceof Error ? err.message : 'ukendt'}` }
          }
        },
      }),

      populateAffinityDiagram: tool({
        description: 'Udfylder Affinity Diagram med temaer og noter. Hurtig genvej der auto-strukturerer input i grupper.',
        inputSchema: z.object({
          themes: z.array(z.object({
            title: z.string().min(1).max(80),
            notes: z.array(z.string().min(1).max(280)).max(14),
          })).min(1).max(10),
          ungrouped: z.array(z.string().min(1).max(280)).max(20).optional(),
        }),
        execute: async ({ themes, ungrouped }) => ({ ok: true, themes, ungrouped: ungrouped || [] }),
      }),

      editProjectDocs: tool({
        description: 'Redigerer projektets docs-sider — tilføj, erstat eller opret nye sider med struktureret indhold.',
        inputSchema: z.object({
          mode: z.enum(['append', 'replace']).default('append'),
          content: z.string().min(1).max(16000),
          pageTitle: z.string().min(1).max(120).optional(),
        }),
        execute: async ({ mode, content, pageTitle }) => ({ ok: true, mode, content, pageTitle }),
      }),
      ...(workspaceTab === 'slides'
        ? {
            proposeSlideDeckOutline: tool({
              description:
                'Foreslår en nummereret slide-outline KUN ud fra vedhæftede filer og medsendt projektkontekst (ingen net-søgning). Bruges før brugeren godkender; app viser outline til redigering.',
              inputSchema: z.object({
                analysisSummary: z.string().min(1).max(3000),
                slides: z
                  .array(
                    z.object({
                      order: z.number().int().min(1).max(99),
                      title: z.string().min(1).max(200),
                      slideType: z.string().max(40).optional(),
                      summary: z.string().min(1).max(4000),
                    })
                  )
                  .min(1)
                  .max(30),
              }),
              execute: async input => ({ ok: true, ...input }),
            }),
            editProjectSlides: tool({
              description:
                'Små rettelser på ét slide (HTML). Ikke til at oprette hele præsentationer — brug proposeSlideDeckOutline først.',
              inputSchema: z.object({
                mode: z.enum(['append', 'replace']).default('replace'),
                slideTitle: z.string().min(1).max(120).optional(),
                title: z.string().min(1).max(120).optional(),
                contentHtml: z.string().min(1).max(30000),
              }),
              execute: async ({ mode, slideTitle, title, contentHtml }) => ({
                ok: true,
                mode,
                slideTitle,
                title,
                contentHtml,
              }),
            }),
          }
        : {}),
    }

    const withModelIdentity = (identity: string) =>
      `${systemPrompt}\n\nAI-identitet (aktiv for dette svar): ${identity}\nHvis brugeren spørger hvilken AI/model de taler med, svar direkte med AI-identitet-linjen ovenfor.`

    const streamWithModel = (model: any, identity: string) =>
      streamText({
        model,
        system: withModelIdentity(identity),
        messages: normalizedMessages,
        tools,
      })

    const buildAutoCandidates = () => {
      const candidates: Array<{ provider: string; modelId: string; model: any }> = []
      const hasFiles = normalizedMessages.some(
        msg => Array.isArray(msg.content) && msg.content.some((p: any) => p?.type === 'file')
      )

      if (hasFiles) {
        if (hasEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY')) {
          candidates.push({ provider: 'google', modelId: googleModel, model: google(googleModel) })
        }
        if (hasEnv('ANTHROPIC_API_KEY')) {
          candidates.push({ provider: 'anthropic', modelId: anthropicModel, model: anthropic(anthropicModel) })
        }
        if (hasEnv('OPENAI_API_KEY')) {
          candidates.push({ provider: 'openai', modelId: openaiModel, model: openai(openaiModel) })
        }
      } else {
        if (hasEnv('OPENAI_API_KEY')) {
          candidates.push({ provider: 'openai', modelId: openaiModel, model: openai(openaiModel) })
        }
        if (hasEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY')) {
          candidates.push({ provider: 'google', modelId: googleModel, model: google(googleModel) })
        }
        if (hasEnv('ANTHROPIC_API_KEY')) {
          candidates.push({ provider: 'anthropic', modelId: anthropicModel, model: anthropic(anthropicModel) })
        }
        if (hasEnv('OPENROUTER_API_KEY')) {
          candidates.push({
            provider: 'openrouter',
            modelId: openrouterModel,
            model: openrouter.chat(openrouterModel),
          })
        }
        if (hasEnv('MISTRAL_API_KEY')) {
          candidates.push({ provider: 'mistral', modelId: mistralModel, model: mistral(mistralModel) })
        }
        if (hasEnv('GROQ_API_KEY')) {
          candidates.push({ provider: 'groq', modelId: groqModel, model: groq.chat(groqModel) })
        }
      }

      return candidates
    }

    /** Én entry pr. konkret model-id (alle varianter), til max-ensemble — undtagen kimi-k2. */
    const buildMaxEnsembleCandidates = () => {
      const candidates: Array<{ provider: string; modelId: string; model: any }> = []
      const hasFiles = normalizedMessages.some(
        msg => Array.isArray(msg.content) && msg.content.some((p: any) => p?.type === 'file')
      )

      if (hasFiles) {
        if (hasEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY')) {
          for (const modelId of PROVIDER_MODELS.google) {
            candidates.push({ provider: 'google', modelId, model: google(modelId) })
          }
        }
        if (hasEnv('ANTHROPIC_API_KEY')) {
          for (const modelId of PROVIDER_MODELS.anthropic) {
            candidates.push({ provider: 'anthropic', modelId, model: anthropic(modelId) })
          }
        }
        if (hasEnv('OPENAI_API_KEY')) {
          for (const modelId of PROVIDER_MODELS.openai) {
            candidates.push({ provider: 'openai', modelId, model: openai(modelId) })
          }
        }
        return candidates
      }

      if (hasEnv('OPENAI_API_KEY')) {
        for (const modelId of PROVIDER_MODELS.openai) {
          candidates.push({ provider: 'openai', modelId, model: openai(modelId) })
        }
      }
      if (hasEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY')) {
        for (const modelId of PROVIDER_MODELS.google) {
          candidates.push({ provider: 'google', modelId, model: google(modelId) })
        }
      }
      if (hasEnv('ANTHROPIC_API_KEY')) {
        for (const modelId of PROVIDER_MODELS.anthropic) {
          candidates.push({ provider: 'anthropic', modelId, model: anthropic(modelId) })
        }
      }
      if (hasEnv('OPENROUTER_API_KEY')) {
        for (const modelId of PROVIDER_MODELS.openrouter) {
          candidates.push({
            provider: 'openrouter',
            modelId,
            model: openrouter.chat(modelId),
          })
        }
      }
      if (hasEnv('MISTRAL_API_KEY')) {
        for (const modelId of PROVIDER_MODELS.mistral) {
          candidates.push({ provider: 'mistral', modelId, model: mistral(modelId) })
        }
      }
      if (hasEnv('GROQ_API_KEY')) {
        for (const modelId of PROVIDER_MODELS.groq) {
          candidates.push({ provider: 'groq', modelId, model: groq.chat(modelId) })
        }
      }
      if (moonshot) {
        for (const modelId of PROVIDER_MODELS.kimi.filter(id => id !== 'kimi-k2')) {
          candidates.push({ provider: 'kimi', modelId, model: moonshot.chat(modelId) })
        }
      }

      return candidates
    }

    if (aiProvider !== 'auto' && aiProvider !== 'max') {
      const result = streamWithModel(directModel, `${aiProvider}/${selectedModel}`)
      return result.toUIMessageStreamResponse()
    }

    const autoCandidates = buildAutoCandidates()

    if (autoCandidates.length === 0) {
      return new Response(
        JSON.stringify({ error: `${aiProvider}-mode fandt ingen aktive AI API keys. Tilføj mindst én provider key i .env.local.` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (aiProvider === 'max') {
      const maxCandidates = buildMaxEnsembleCandidates()
      if (maxCandidates.length === 0) {
        return new Response(
          JSON.stringify({
            error:
              'Max-mode fandt ingen aktive API keys. Tilføj mindst én provider-nøgle (fx OpenAI eller Google).',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const candidateResults = await Promise.all(
        maxCandidates.map(async candidate => {
          try {
            const result = await generateText({
              model: candidate.model,
              system: `${systemPrompt}\n\nDu er én model i et ensemble. Giv dit bedste svar kort og konkret.`,
              messages: normalizedMessages,
            })
            return {
              provider: candidate.provider,
              modelId: candidate.modelId,
              text: result.text || '',
              ok: true as const,
            }
          } catch (error) {
            return {
              provider: candidate.provider,
              modelId: candidate.modelId,
              text: '',
              ok: false as const,
              error: error instanceof Error ? error.message : 'Ukendt fejl',
            }
          }
        })
      )

      const successful = candidateResults.filter(r => r.ok && r.text.trim().length > 0)
      if (successful.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Max-mode fejlede: Ingen modeller returnerede et brugbart svar.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const fusionSource = successful
        .map((r, idx) => `Svar ${idx + 1} (${r.provider}/${r.modelId}):\n${r.text}`)
        .join('\n\n')

      const firstOk = successful[0]
      const fusionCandidate =
        maxCandidates.find(c => c.provider === firstOk.provider && c.modelId === firstOk.modelId) ??
        maxCandidates[0]
      const fusionModel = fusionCandidate.model
      const fusionIdentity = `${fusionCandidate.provider}/${fusionCandidate.modelId}`
      const fusionResult = streamText({
        model: fusionModel,
        system: `${withModelIdentity(fusionIdentity)}

Du modtager nu flere modelsvar på samme brugerinput (fra et ensemble af modeller). Din opgave er at fusionere dem til ét bedre svar.
Regler:
- Vælg den bedste substans på tværs af svarene.
- Fjern gentagelser og modsætninger.
- Returnér ét samlet svar i samme format som normalt.
- Nævn ikke at svaret er fusioneret.`,
        messages: [
          ...normalizedMessages,
          {
            role: 'system',
            content: `Kandidatsvar at fusionere:\n\n${fusionSource}`,
          },
        ],
        tools,
      })

      return fusionResult.toUIMessageStreamResponse()
    }

    let lastError: unknown = null
    for (const candidate of autoCandidates) {
      try {
        const result = streamWithModel(candidate.model, `${candidate.provider}/${candidate.modelId}`)
        return result.toUIMessageStreamResponse()
      } catch (error) {
        lastError = error
        console.warn(`Auto AI fallback: ${candidate.provider}/${candidate.modelId} fejlede`, error)
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Alle auto-modelkandidater fejlede.')
  } catch (error) {
    console.error('Error in AI chat route:', error)
    return new Response(JSON.stringify({ error: 'Noget gik galt med AI assistenten.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
