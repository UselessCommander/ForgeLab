import { DEMO_BOARD_COLUMNS } from '@/lib/marketing-demo-data'

const TAG_STYLES: Record<string, string> = {
  Research: 'bg-sky-50 text-sky-700 border-sky-100',
  Insight: 'bg-violet-50 text-violet-700 border-violet-100',
  Idea: 'bg-amber-50 text-amber-800 border-amber-100',
  Concept: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Test: 'bg-rose-50 text-rose-700 border-rose-100',
}

export default function DemoBoardPreview() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:gap-3 lg:overflow-x-auto lg:pb-1">
      {DEMO_BOARD_COLUMNS.map(col => (
        <div
          key={col.id}
          className="rounded-xl border border-gray-200 bg-white lg:w-[200px] lg:shrink-0"
        >
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="text-xs font-extrabold text-gray-800">{col.title}</p>
            <p className="text-[10px] text-gray-400">{col.cards.length} kort</p>
          </div>
          <div className="space-y-2 p-2">
            {col.cards.map(card => (
              <div
                key={card.title}
                className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm"
              >
                <span
                  className={`inline-block rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                    TAG_STYLES[card.tag] ?? 'bg-gray-50 text-gray-600 border-gray-100'
                  }`}
                >
                  {card.tag}
                </span>
                <p className="mt-1.5 text-xs font-semibold leading-snug text-gray-800">
                  {card.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
