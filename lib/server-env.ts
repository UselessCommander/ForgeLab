/**
 * Next.js erstatter kun `process.env.VAR` statisk ved build. Dynamisk adgang
 * (`process.env[key]`) giver typisk `undefined` i Vercel/produktion.
 * Samler alle server-only nøgler her med eksplicit property-adgang.
 */
const SERVER_ENV = {
  AI_PROVIDER: process.env.AI_PROVIDER,
  NEXT_PUBLIC_AI_PROVIDER: process.env.NEXT_PUBLIC_AI_PROVIDER,
  GOOGLE_MODEL: process.env.GOOGLE_MODEL,
  NEXT_PUBLIC_GOOGLE_MODEL: process.env.NEXT_PUBLIC_GOOGLE_MODEL,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  NEXT_PUBLIC_OPENAI_MODEL: process.env.NEXT_PUBLIC_OPENAI_MODEL,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  NEXT_PUBLIC_ANTHROPIC_MODEL: process.env.NEXT_PUBLIC_ANTHROPIC_MODEL,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
  NEXT_PUBLIC_OPENROUTER_MODEL: process.env.NEXT_PUBLIC_OPENROUTER_MODEL,
  MISTRAL_MODEL: process.env.MISTRAL_MODEL,
  NEXT_PUBLIC_MISTRAL_MODEL: process.env.NEXT_PUBLIC_MISTRAL_MODEL,
  GROQ_MODEL: process.env.GROQ_MODEL,
  NEXT_PUBLIC_GROQ_MODEL: process.env.NEXT_PUBLIC_GROQ_MODEL,
  KIMI_MODEL: process.env.KIMI_MODEL,
  NEXT_PUBLIC_KIMI_MODEL: process.env.NEXT_PUBLIC_KIMI_MODEL,
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  MOONSHOT_API_KEY: process.env.MOONSHOT_API_KEY,
  KIMI_API_KEY: process.env.KIMI_API_KEY,
  MOONSHOT_BASE_URL: process.env.MOONSHOT_BASE_URL,
  KIMI_BASE_URL: process.env.KIMI_BASE_URL,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
  NEXT_PUBLIC_STRIPE_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
} as const

type ServerEnvKey = keyof typeof SERVER_ENV

export function serverEnv(...keys: ServerEnvKey[]): string {
  for (const key of keys) {
    const value = SERVER_ENV[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

export function hasServerEnv(...keys: ServerEnvKey[]): boolean {
  return Boolean(serverEnv(...keys))
}
