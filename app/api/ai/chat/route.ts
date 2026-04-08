import { generateText, streamText, tool, type ModelMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { mistral } from '@ai-sdk/mistral'
import { z } from 'zod'

export const maxDuration = 30
const SUPPORTED_AI_PROVIDERS = ['auto', 'max', 'google', 'openai', 'anthropic', 'openrouter', 'mistral'] as const
type SupportedProvider = (typeof SUPPORTED_AI_PROVIDERS)[number]

const PROVIDER_MODELS: Record<SupportedProvider, string[]> = {
  auto: ['auto'],
  max: ['max'],
  google: ['gemini-2.5-flash', 'gemini-2.0-flash'],
  openai: ['gpt-4o-mini', 'gpt-4o'],
  anthropic: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'],
  openrouter: ['google/gemma-4-26b-a4b-it:free', 'openai/gpt-4o-mini'],
  mistral: ['mistral-small-latest', 'mistral-medium-latest'],
}
const ALLOWED_TOOL_SLUGS = [
  'kanban',
  'swot-generator',
  'brainstorming',
  'empathy-map',
  'persona-canvas',
  'gantt-chart',
  'business-model-canvas',
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

export async function POST(req: Request) {
  try {
    const { messages, context, aiProvider: requestedProvider, aiModel: requestedModel } = await req.json()

    const envProvider = (process.env.AI_PROVIDER || 'google').toLowerCase()
    const normalizedRequestedProvider =
      typeof requestedProvider === 'string' ? requestedProvider.toLowerCase() : undefined
    const aiProvider = (
      normalizedRequestedProvider && SUPPORTED_AI_PROVIDERS.includes(normalizedRequestedProvider as SupportedProvider)
        ? normalizedRequestedProvider
        : envProvider
    ) as SupportedProvider
    const googleModel = process.env.GOOGLE_MODEL || 'gemini-2.5-flash'
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const anthropicModel = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest'
    const openrouterModel = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
    const mistralModel = process.env.MISTRAL_MODEL || 'mistral-small-latest'
    const requestedModelSafe = typeof requestedModel === 'string' ? requestedModel : undefined

    if (aiProvider === 'openai') {
      if (!process.env.OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'OpenAI API key mangler. Sæt OPENAI_API_KEY i .env.local.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } else if (aiProvider === 'openrouter') {
      if (!process.env.OPENROUTER_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'OpenRouter API key mangler. Sæt OPENROUTER_API_KEY i .env.local.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } else if (aiProvider === 'anthropic') {
      if (!process.env.ANTHROPIC_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'Anthropic API key mangler. Sæt ANTHROPIC_API_KEY i .env.local.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } else if (aiProvider === 'mistral') {
      if (!process.env.MISTRAL_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'Mistral API key mangler. Sæt MISTRAL_API_KEY i .env.local.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } else if (aiProvider === 'google') {
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'Google AI API key mangler. Sæt GOOGLE_GENERATIVE_AI_API_KEY i .env.local.' }),
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
    const activeToolSlugs = Array.isArray(contextObject?.activeToolSlugs)
      ? contextObject.activeToolSlugs.filter((x: unknown): x is string => typeof x === 'string')
      : []
    const availableToolSlugs = Array.isArray(contextObject?.availableToolSlugs)
      ? contextObject.availableToolSlugs.filter((x: unknown): x is string => typeof x === 'string')
      : []
    const latestUserMessage = [...messages].reverse().find((m: any) => m?.role === 'user')
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

    // Provide context about the current ForgeLab projects/board to the model
    const systemPrompt = [
      'Du er ForgeLabs dedikerede AI-assistent. Din opgave er at hjælpe brugeren med at tænke kreativt og handlingsorienteret med deres projekt.',
      'Kontekst fra brugerens nuværende board:',
      safeContext,
      '',
      'Svar altid på dansk.',
      '',
      'Skriv svar i dette format:',
      '1) Hvad jeg forstår (1 kort linje)',
      '2) Forslag (2-3 konkrete punkter)',
      '3) Næste skridt (1 konkret handling brugeren kan tage nu)',
      '',
      'Vær kort og konkret. Hvis brugerens mål er uklart, så stil præcis ét afklarende spørgsmål.',
      '',
      'Du har evnen til at tilføje værktøjer direkte til projekt-boardet via funktionen "addTool".',
      'Regler for addTool:',
      '- Brug kun addTool når brugeren udtrykkeligt beder om at oprette et modul.',
      `- Brug kun én af disse slugs: ${ALLOWED_TOOL_SLUGS.join(', ')}.`,
      '- Tilføj ikke et modul, der allerede er aktivt i boardet.',
      '- Hvis anmodningen er tvetydig, spørg først i stedet for at kalde addTool.',
      '',
      'Ekstra regler for PDF:',
      `- Hvis seneste brugerbesked indeholder en PDF (${latestUserMessageHasPdf ? 'ja' : 'nej'}), må du proaktivt tilføje maks ét relevant modul, hvis det giver tydelig værdi.`,
      `- Prioritér moduler fra denne aktuelle "mulige værktøjer"-liste: ${availableToolSlugs.length > 0 ? availableToolSlugs.join(', ') : 'ingen liste modtaget'}.`,
      '- Hvis intet relevant modul findes i den mulige liste, så foreslå i stedet et modul uden at kalde addTool.',
      '',
      'Når du arbejder med Affinity Diagram:',
      '- Du må bruge værktøjet "populateAffinityDiagram" til at oprette temaer og noter automatisk.',
      '- Brug det når brugeren beder om at strukturere input, eller når en PDF naturligt kan opsummeres i temaer.',
      '- Hold det kort og konkret: 3-6 temaer, 2-8 noter per tema.',
      '- Skriv stadig en kort forklaring til brugeren efter værktøjskaldet.',
      '',
      'Du må også bruge værktøjet "updateToolData" til at redigere indhold i alle værktøjer:',
      '- Brug det når brugeren beder om at udfylde/rette et værktøj.',
      '- Hvis værktøjet ikke er aktivt endnu, tilføj det først med addTool (hvis muligt).',
      '- Send komplette felter i data-objektet i samme struktur som værktøjets eksisterende data.',
      '- Brug aldrig ekstra/ukendte felter eller "gæt"-nøgler.',
      '- Hvis du mangler input for at udfylde et værktøj meningsfuldt, spørg kort først.',
      '',
      'Du må bruge værktøjet "editProjectDocs" når brugeren vil skrive, omskrive eller udvide projektets docs:',
      '- Brug mode="append" for at tilføje nyt afsnit.',
      '- Brug mode="replace" kun når brugeren tydeligt beder om at erstatte hele siden.',
      '- Brug pageTitle hvis en specifik docs-fane nævnes eller skal oprettes.',
      '- Hold indholdet struktureret og klart i dansk sprog.',
    ].join('\n')

    const normalizedMessages: ModelMessage[] = []
    for (const message of messages) {
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

          const mimeType = typeof part?.mediaType === 'string' ? part.mediaType : ''
          const hasSupportedPrefix = SUPPORTED_MIME_PREFIXES.some(prefix => mimeType.startsWith(prefix))
          const hasSupportedExactType = SUPPORTED_EXACT_MIME_TYPES.includes(mimeType)
          if (!hasSupportedPrefix && !hasSupportedExactType) continue

          if (typeof part?.url === 'string' && part.url.startsWith('data:')) {
            const base64Data = part.url.split(',')[1]
            if (base64Data) {
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

    const openrouter = createOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    })

    const modelForProvider = (() => {
      if (aiProvider === 'google') return googleModel
      if (aiProvider === 'openai') return openaiModel
      if (aiProvider === 'anthropic') return anthropicModel
      if (aiProvider === 'openrouter') return openrouterModel
      return mistralModel
    })()

    const selectedModel =
      requestedModelSafe && PROVIDER_MODELS[aiProvider].includes(requestedModelSafe)
        ? requestedModelSafe
        : modelForProvider

    const directModel =
      aiProvider === 'openai'
        ? openai(selectedModel)
        : aiProvider === 'anthropic'
          ? anthropic(selectedModel)
          : aiProvider === 'openrouter'
            ? openrouter(selectedModel)
            : aiProvider === 'mistral'
              ? mistral(selectedModel)
              : google(selectedModel)

    const tools = {
      addTool: tool({
        description: 'Tilføjer et værktøj direct til projekt-lærredet (boardet).',
        inputSchema: z.object({
          slug: z.string().describe('Kort-ID (slug) for modulet. Fx "kanban", "swot-generator" osv.'),
        }),
        execute: async ({ slug }) => {
          if (!ALLOWED_TOOL_SLUGS.includes(slug as (typeof ALLOWED_TOOL_SLUGS)[number])) {
            return { ok: false, reason: `Ugyldigt modul-slug: ${slug}` }
          }

          if (activeToolSlugs.includes(slug)) {
            return { ok: false, reason: `Modulet "${slug}" er allerede aktivt.` }
          }

          if (availableToolSlugs.length > 0 && !availableToolSlugs.includes(slug)) {
            return { ok: false, reason: `Modulet "${slug}" er ikke blandt mulige værktøjer lige nu.` }
          }

          return { ok: true, slug }
        },
      }),
      populateAffinityDiagram: tool({
        description:
          'Udfylder Affinity Diagram med temaer og noter baseret på brugerens input/PDF. Kræver at affinity-diagram er aktivt eller kan tilføjes.',
        inputSchema: z.object({
          themes: z
            .array(
              z.object({
                title: z.string().min(1).max(80),
                notes: z.array(z.string().min(1).max(280)).max(12),
              })
            )
            .min(1)
            .max(8),
          ungrouped: z.array(z.string().min(1).max(280)).max(20).optional(),
        }),
        execute: async ({ themes, ungrouped }) => {
          return {
            ok: true,
            themes,
            ungrouped: ungrouped || [],
          }
        },
      }),
      updateToolData: tool({
        description:
          'Opdaterer data for et vilkårligt værktøj på boardet. Bruges til at udfylde/rette indhold i værktøjer.',
        inputSchema: z.object({
          toolSlug: z.string().min(1).describe('Slug for værktøjet der skal opdateres'),
          data: z.unknown().describe('Nyt dataobjekt der skal gemmes for værktøjet'),
        }),
        execute: async ({ toolSlug, data }) => {
          if (!ALLOWED_TOOL_SLUGS.includes(toolSlug as (typeof ALLOWED_TOOL_SLUGS)[number])) {
            return { ok: false, reason: `Ugyldigt værktøj: ${toolSlug}` }
          }

          if (availableToolSlugs.length > 0 && !availableToolSlugs.includes(toolSlug) && !activeToolSlugs.includes(toolSlug)) {
            return { ok: false, reason: `Værktøjet "${toolSlug}" er ikke tilgængeligt i dette board lige nu.` }
          }

          return { ok: true, toolSlug, data }
        },
      }),
      editProjectDocs: tool({
        description:
          'Redigerer projektets docs-indhold (append/replace) og kan vælge en specifik docs-fane via pageTitle.',
        inputSchema: z.object({
          mode: z.enum(['append', 'replace']).default('append'),
          content: z.string().min(1).max(12000),
          pageTitle: z.string().min(1).max(120).optional(),
        }),
        execute: async ({ mode, content, pageTitle }) => ({
          ok: true,
          mode,
          content,
          pageTitle,
        }),
      }),
    }

    const streamWithModel = (model: any) =>
      streamText({
        model,
        system: systemPrompt,
        messages: normalizedMessages,
        tools,
      })

    const buildAutoCandidates = () => {
      const candidates: Array<{ provider: string; modelId: string; model: any }> = []
      const hasFiles = normalizedMessages.some(
        msg => Array.isArray(msg.content) && msg.content.some((p: any) => p?.type === 'file')
      )

      if (hasFiles) {
        if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          candidates.push({ provider: 'google', modelId: googleModel, model: google(googleModel) })
        }
        if (process.env.ANTHROPIC_API_KEY) {
          candidates.push({ provider: 'anthropic', modelId: anthropicModel, model: anthropic(anthropicModel) })
        }
        if (process.env.OPENAI_API_KEY) {
          candidates.push({ provider: 'openai', modelId: openaiModel, model: openai(openaiModel) })
        }
      } else {
        if (process.env.OPENAI_API_KEY) {
          candidates.push({ provider: 'openai', modelId: openaiModel, model: openai(openaiModel) })
        }
        if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          candidates.push({ provider: 'google', modelId: googleModel, model: google(googleModel) })
        }
        if (process.env.ANTHROPIC_API_KEY) {
          candidates.push({ provider: 'anthropic', modelId: anthropicModel, model: anthropic(anthropicModel) })
        }
        if (process.env.OPENROUTER_API_KEY) {
          candidates.push({ provider: 'openrouter', modelId: openrouterModel, model: openrouter(openrouterModel) })
        }
        if (process.env.MISTRAL_API_KEY) {
          candidates.push({ provider: 'mistral', modelId: mistralModel, model: mistral(mistralModel) })
        }
      }

      return candidates
    }

    if (aiProvider !== 'auto' && aiProvider !== 'max') {
      const result = streamWithModel(directModel)
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
      const selectedCandidates = autoCandidates.slice(0, 3)
      const candidateResults = await Promise.all(
        selectedCandidates.map(async candidate => {
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

      const fusionModel = selectedCandidates[0].model
      const fusionResult = streamText({
        model: fusionModel,
        system: `${systemPrompt}

Du modtager nu flere modelsvar på samme brugerinput. Din opgave er at fusionere dem til ét bedre svar.
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
        const result = streamWithModel(candidate.model)
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
