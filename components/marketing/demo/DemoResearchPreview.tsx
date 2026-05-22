import { DEMO_RESEARCH } from '@/lib/marketing-demo-data'

export default function DemoResearchPreview() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-400">
          Noter & observationer
        </h3>
        <ul className="space-y-2">
          {DEMO_RESEARCH.notes.map(note => (
            <li
              key={note}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
            >
              {note}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Quote</p>
          <p className="mt-2 text-sm italic leading-relaxed text-gray-700">
            &ldquo;{DEMO_RESEARCH.quote}&rdquo;
          </p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700">Insight</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">{DEMO_RESEARCH.insight}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">Opportunity</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-800">{DEMO_RESEARCH.opportunity}</p>
        </div>
      </div>
    </div>
  )
}
