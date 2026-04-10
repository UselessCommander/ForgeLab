import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'

const env = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

const hasEnv = (...keys: string[]) => Boolean(env(...keys))

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const aiProvider = (env('AI_PROVIDER', 'NEXT_PUBLIC_AI_PROVIDER') || 'google').toLowerCase()

  return NextResponse.json({
    activeProvider: aiProvider,
    models: {
      google: env('GOOGLE_MODEL', 'NEXT_PUBLIC_GOOGLE_MODEL') || 'gemini-2.5-flash',
      openai: env('OPENAI_MODEL', 'NEXT_PUBLIC_OPENAI_MODEL') || 'gpt-4o-mini',
      anthropic: env('ANTHROPIC_MODEL', 'NEXT_PUBLIC_ANTHROPIC_MODEL') || 'claude-3-5-sonnet-latest',
      openrouter: env('OPENROUTER_MODEL', 'NEXT_PUBLIC_OPENROUTER_MODEL') || 'google/gemma-4-31b-it:free',
      mistral: env('MISTRAL_MODEL', 'NEXT_PUBLIC_MISTRAL_MODEL') || 'mistral-small-latest',
      groq: env('GROQ_MODEL', 'NEXT_PUBLIC_GROQ_MODEL') || 'llama-3.3-70b-versatile',
      kimi: env('KIMI_MODEL', 'NEXT_PUBLIC_KIMI_MODEL') || 'kimi-k2.5',
    },
    providers: {
      google: {
        configured: hasEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY'),
        keySource:
          env('GOOGLE_GENERATIVE_AI_API_KEY')
            ? 'GOOGLE_GENERATIVE_AI_API_KEY'
            : env('GOOGLE_API_KEY')
              ? 'GOOGLE_API_KEY'
              : env('GEMINI_API_KEY')
                ? 'GEMINI_API_KEY'
                : null,
      },
      openai: {
        configured: hasEnv('OPENAI_API_KEY'),
      },
      anthropic: {
        configured: hasEnv('ANTHROPIC_API_KEY'),
      },
      openrouter: {
        configured: hasEnv('OPENROUTER_API_KEY'),
      },
      mistral: {
        configured: hasEnv('MISTRAL_API_KEY'),
      },
      groq: {
        configured: hasEnv('GROQ_API_KEY'),
      },
      kimi: {
        configured: hasEnv('MOONSHOT_API_KEY', 'KIMI_API_KEY'),
        keySource: env('MOONSHOT_API_KEY') ? 'MOONSHOT_API_KEY' : env('KIMI_API_KEY') ? 'KIMI_API_KEY' : null,
      },
    },
    generatedAt: new Date().toISOString(),
    note: 'API keys returneres aldrig; kun status og hvilke env-navne der er sat.',
  })
}

