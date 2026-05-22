import { DEMO_AI } from '@/lib/marketing-demo-data'

export default function DemoAiPreview() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Dit spørgsmål</p>
        <p className="mt-2 text-sm text-gray-800">{DEMO_AI.userQuestion}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">AI-sparring</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-800">{DEMO_AI.assistantReply}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DEMO_AI.suggestions.map(chip => (
          <span
            key={chip}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600"
          >
            {chip}
          </span>
        ))}
      </div>

      <p className="text-center text-[11px] text-gray-400">
        Preview — AI hjælper med metodevalg og struktur, ikke som erstatning for metoden.
      </p>
    </div>
  )
}
