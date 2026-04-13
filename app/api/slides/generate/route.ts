import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import { PDFParse } from 'pdf-parse'
import { getCurrentUserId } from '@/lib/auth'
import { getUserById } from '@/lib/users'
import { hasAiAccessFromSubscription } from '@/lib/subscription'
import { hasServerEnv as hasEnv, serverEnv as env } from '@/lib/server-env'

const requestSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().min(3).max(4000),
  slidesCount: z.number().int().min(3).max(20).default(8),
  boardContext: z.string().max(12000).optional(),
  pdfFiles: z
    .array(
      z.object({
        name: z.string().min(1).max(220),
        base64: z.string().min(20).max(12_000_000),
      })
    )
    .max(4)
    .optional(),
})

type SlideDraft = {
  title: string
  bullets: string[]
  speakerNotes?: string
  imagePrompt?: string
}

function resolveMoonshotKey() {
  const moonshot = env('MOONSHOT_API_KEY')
  const kimi = env('KIMI_API_KEY')
  const looksPlaceholder = (value?: string | null) =>
    !value ||
    value.includes('your_moonshot_api_key_here') ||
    value.includes('your_kimi_api_key_here') ||
    value.startsWith('sk-your_')

  if (moonshot && !looksPlaceholder(moonshot)) return moonshot
  if (kimi && !looksPlaceholder(kimi)) return kimi
  return null
}

function isQuotaOrAuthError(error: unknown) {
  const status =
    typeof (error as any)?.statusCode === 'number'
      ? (error as any).statusCode
      : typeof (error as any)?.response?.status === 'number'
        ? (error as any).response.status
        : undefined
  const message =
    typeof (error as any)?.data?.error?.message === 'string'
      ? (error as any).data.error.message
      : typeof (error as any)?.message === 'string'
        ? (error as any).message
        : ''
  return {
    status,
    message,
    quota:
      status === 429 ||
      /insufficient balance|exceeded_current_quota_error|recharge your account|suspended/i.test(message),
    auth: status === 401 || /invalid authentication/i.test(message),
  }
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    const fenced = raw.match(/```json\s*([\s\S]*?)```/i)?.[1] || raw.match(/```([\s\S]*?)```/i)?.[1]
    if (!fenced) return null
    try {
      return JSON.parse(fenced) as T
    } catch {
      return null
    }
  }
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
      if (!hasAiAccessFromSubscription(user)) {
        return new Response(
          JSON.stringify({ error: 'AI kræver et aktivt Pro-abonnement. Opgrader på profilsiden.' }),
          { status: 402, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const body = requestSchema.parse(await req.json())

    const moonshotApiKey = resolveMoonshotKey()
    if (!moonshotApiKey) {
      return new Response(
        JSON.stringify({
          error: 'Moonshot API key mangler. Sæt MOONSHOT_API_KEY eller KIMI_API_KEY i miljøvariabler.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const moonshot = moonshotApiKey
      ? createOpenAI({
          apiKey: moonshotApiKey,
          baseURL: env('MOONSHOT_BASE_URL', 'KIMI_BASE_URL') || 'https://api.moonshot.ai/v1',
          compatibility: 'strict',
        })
      : null
    const modelId = env('KIMI_MODEL', 'NEXT_PUBLIC_KIMI_MODEL') || 'kimi-k2.5'
    const googleKey = env('GOOGLE_GENERATIVE_AI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY')
    const googlePrimaryModel = env('GOOGLE_MODEL', 'NEXT_PUBLIC_GOOGLE_MODEL') || 'gemini-2.5-flash'
    const googleFallbackModels = [googlePrimaryModel, 'gemini-2.0-flash'].filter(
      (value, index, self) => self.indexOf(value) === index
    )
    const google = googleKey ? createGoogleGenerativeAI({ apiKey: googleKey }) : null
    const openrouterKey = env('OPENROUTER_API_KEY')
    const openrouterModel =
      env('OPENROUTER_MODEL', 'NEXT_PUBLIC_OPENROUTER_MODEL') || 'google/gemma-4-31b-it:free'
    const openrouter = openrouterKey
      ? createOpenAI({ apiKey: openrouterKey, baseURL: 'https://openrouter.ai/api/v1' })
      : null

    const parsedPdfs: Array<{ name: string; text: string }> = []
    if (Array.isArray(body.pdfFiles) && body.pdfFiles.length > 0) {
      for (const file of body.pdfFiles) {
        try {
          const rawBase64 = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64
          const buffer = Buffer.from(rawBase64, 'base64')
          const parser = new PDFParse({ data: buffer })
          const parsed = await parser.getText()
          await parser.destroy()
          const text = (parsed.text || '').replace(/\s+/g, ' ').trim()
          if (text) parsedPdfs.push({ name: file.name, text: text.slice(0, 12000) })
        } catch {
          // Ignore single PDF parse failures.
        }
      }
    }

    const pdfContext = parsedPdfs.length
      ? parsedPdfs.map((file, idx) => `PDF ${idx + 1} (${file.name}):\n${file.text}`).join('\n\n')
      : ''

    const systemPrompt = `Du genererer slide-decks i STRICT JSON uden markdown.
Returnér præcis denne struktur:
{
  "deckTitle": "string",
  "slides": [
    {
      "title": "string",
      "bullets": ["string", "string"],
      "speakerNotes": "string",
      "imagePrompt": "string"
    }
  ]
}
Regler:
- Max 6 bullets per slide
- Hver bullet max 140 tegn
- Strukturér progression: intro -> kerne -> konklusion
- Brug board-kontekst hvis den er relevant.
- Brug PDF-kontekst hvis den er relevant.
- Ingen tekst uden for JSON.`
    const userPrompt = `Projekt: ${body.projectId}
Brugerprompt: ${body.prompt}
Antal slides: ${body.slidesCount}
Board-kontekst:
${body.boardContext || 'Ingen board-kontekst sendt.'}

PDF-kontekst:
${pdfContext || 'Ingen PDF vedhæftet.'}

Generér et præcist deck.`

    const candidates: Array<{ label: string; model: any }> = []
    if (moonshot) candidates.push({ label: `kimi/${modelId}`, model: moonshot.chat(modelId) })
    if (google) {
      for (const model of googleFallbackModels) {
        candidates.push({ label: `google/${model}`, model: google(model) })
      }
    }
    if (openrouter) candidates.push({ label: `openrouter/${openrouterModel}`, model: openrouter.chat(openrouterModel) })

    let resultText = ''
    let lastError: unknown = null
    const failureDetails: string[] = []
    for (const candidate of candidates) {
      try {
        const result = await generateText({
          model: candidate.model,
          system: systemPrompt,
          prompt: userPrompt,
          maxRetries: 1,
        })
        if (result.text?.trim()) {
          resultText = result.text
          break
        }
      } catch (error) {
        lastError = error
        const details = isQuotaOrAuthError(error)
        const compactMessage = (details.message || 'Ukendt fejl').slice(0, 220)
        failureDetails.push(`${candidate.label}: ${compactMessage}`)
        console.warn(`Slides generation failed on ${candidate.label}`, {
          status: details.status,
          message: details.message,
        })
      }
    }

    if (!resultText) {
      const msg = failureDetails.join(' | ')
      throw new Error(msg || (lastError instanceof Error ? lastError.message : 'Ingen AI-provider returnerede et resultat.'))
    }

    const parsed = safeJsonParse<{ deckTitle?: string; slides?: SlideDraft[] }>(resultText)
    const slides = Array.isArray(parsed?.slides)
      ? parsed!.slides
          .map(slide => ({
            title: typeof slide?.title === 'string' ? slide.title.trim() : '',
            bullets: Array.isArray(slide?.bullets)
              ? slide.bullets.filter(b => typeof b === 'string' && b.trim()).slice(0, 6)
              : [],
            speakerNotes: typeof slide?.speakerNotes === 'string' ? slide.speakerNotes.trim() : '',
            imagePrompt: typeof slide?.imagePrompt === 'string' ? slide.imagePrompt.trim() : '',
          }))
          .filter(slide => slide.title || slide.bullets.length > 0)
      : []

    if (slides.length === 0) {
      return new Response(JSON.stringify({ error: 'Kimi returnerede ikke et gyldigt slide-format.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        deckTitle: parsed?.deckTitle || 'Generated Deck',
        slides,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Ugyldigt input', details: error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const maybeStatus =
      typeof (error as any)?.statusCode === 'number'
        ? (error as any).statusCode
        : typeof (error as any)?.response?.status === 'number'
          ? (error as any).response.status
          : undefined
    const maybeMessage =
      typeof (error as any)?.data?.error?.message === 'string'
        ? (error as any).data.error.message
        : typeof (error as any)?.message === 'string'
          ? (error as any).message
          : ''

    if (maybeStatus === 401 || /invalid authentication/i.test(maybeMessage)) {
      return new Response(
        JSON.stringify({
          error:
            'Kimi authentication fejlede (401). Tjek at MOONSHOT_API_KEY/KIMI_API_KEY i .env.local er gyldig og aktiv.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (
      maybeStatus === 429 ||
      /insufficient balance|exceeded_current_quota_error|recharge your account|suspended/i.test(maybeMessage)
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Kimi-kontoen har ingen tilgængelig kredit lige nu (quota/balance). Top op i Moonshot, eller skift til en anden AI-provider.',
        }),
        {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (/high demand|temporarily rate-limited|provider returned error|max retries/i.test(maybeMessage)) {
      return new Response(
        JSON.stringify({
          error:
            'Alle AI-kilder er midlertidigt rate-limited/high-demand lige nu. Prøv igen om lidt, eller skift model/provider i .env.local.',
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    console.error('Slides generate route failed:', error)
    return new Response(JSON.stringify({ error: 'Kunne ikke generere slides lige nu.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
