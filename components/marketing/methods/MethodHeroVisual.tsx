'use client'

const FLOATING = [
  { title: 'SWOT', color: 'bg-emerald-50 border-emerald-200 text-emerald-800', pos: 'top-4 left-6', rotate: '-rotate-3' },
  { title: 'PESO', color: 'bg-amber-50 border-amber-200 text-amber-800', pos: 'top-16 right-4', rotate: 'rotate-2' },
  { title: 'Golden Circle', color: 'bg-gray-900 border-gray-800 text-white', pos: 'bottom-20 left-2', rotate: 'rotate-1' },
  { title: 'JTBD', color: 'bg-violet-50 border-violet-200 text-violet-800', pos: 'bottom-8 right-8', rotate: '-rotate-2' },
  { title: 'Pirate Funnel', color: 'bg-sky-50 border-sky-200 text-sky-800', pos: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', rotate: '' },
]

export default function MethodHeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md" aria-hidden>
      <div className="absolute inset-6 rounded-[2rem] border border-gray-200 bg-white shadow-sm">
        <div className="grid h-full grid-cols-2 gap-2 p-4">
          {['Persona', 'Empathy Map', 'BMC', 'Service Blueprint', 'PESTEL', 'Kanban', 'AIDA', 'VPC'].map(
            label => (
              <div
                key={label}
                className="flex items-center justify-center rounded-xl border border-gray-100 bg-gray-50/80 px-2 text-center text-[10px] font-bold text-gray-600"
              >
                {label}
              </div>
            )
          )}
        </div>
      </div>
      {FLOATING.map(card => (
        <div
          key={card.title}
          className={`absolute ${card.pos} ${card.rotate} rounded-xl border px-3 py-2 text-xs font-extrabold shadow-sm ${card.color}`}
        >
          {card.title}
        </div>
      ))}
    </div>
  )
}
