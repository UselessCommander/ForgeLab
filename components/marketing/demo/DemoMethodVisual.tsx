import type { DemoMethodPreview } from '@/lib/marketing-demo-data'

export default function DemoMethodVisual({ visual }: { visual: DemoMethodPreview['visual'] }) {
  switch (visual) {
    case 'peso':
      return (
        <svg viewBox="0 0 100 72" className="h-14 w-full" aria-hidden>
          <circle cx="50" cy="22" r="16" fill="#7a3ea0" opacity="0.85" />
          <circle cx="28" cy="40" r="16" fill="#dc3f45" opacity="0.85" />
          <circle cx="72" cy="40" r="16" fill="#86cbd4" opacity="0.85" />
          <circle cx="50" cy="54" r="16" fill="#b7d94f" opacity="0.85" />
          <circle cx="50" cy="40" r="8" fill="#111827" />
        </svg>
      )
    case 'golden-circle':
      return (
        <svg viewBox="0 0 80 80" className="mx-auto h-14 w-14" aria-hidden>
          <circle cx="40" cy="40" r="36" fill="#f5f3ff" stroke="#e5e7eb" />
          <circle cx="40" cy="40" r="26" fill="#fffbeb" stroke="#fcd34d" />
          <circle cx="40" cy="40" r="14" fill="#111827" />
        </svg>
      )
    case 'jtbd':
      return (
        <div className="flex gap-0.5" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-10 flex-1 rounded border border-violet-200 bg-violet-50 text-[7px] font-bold text-violet-700 flex items-center justify-center"
            >
              {i + 1}
            </div>
          ))}
        </div>
      )
    case 'funnel':
      return (
        <svg viewBox="0 0 80 72" className="mx-auto h-14 w-20" aria-hidden>
          <polygon points="8,6 72,6 60,22 20,22" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
          <polygon points="20,24 60,24 50,40 30,40" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
          <polygon points="30,42 50,42 44,58 36,58" fill="#fcd34d" stroke="#d97706" strokeWidth="1" />
        </svg>
      )
    case 'diamond':
      return (
        <svg viewBox="0 0 80 48" className="mx-auto h-12 w-full max-w-[120px]" aria-hidden>
          <path d="M40 4 L68 24 L40 44 L12 24 Z" fill="none" stroke="#d97706" strokeWidth="1.5" />
          <line x1="40" y1="4" x2="40" y2="44" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="12" y1="24" x2="68" y2="24" stroke="#e5e7eb" strokeWidth="1" />
        </svg>
      )
    case 'blueprint':
      return (
        <div className="space-y-1" aria-hidden>
          {['Bruger', 'Frontstage', 'Backstage'].map(row => (
            <div key={row} className="rounded border border-cyan-200 bg-cyan-50 px-2 py-1 text-[8px] font-bold text-cyan-800">
              {row}
            </div>
          ))}
        </div>
      )
    case 'vpc':
      return (
        <div className="grid grid-cols-2 gap-1 text-[7px] font-bold" aria-hidden>
          <div className="rounded border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-800">Kunde</div>
          <div className="rounded border border-sky-200 bg-sky-50 p-1.5 text-sky-800">Værdi</div>
        </div>
      )
    case 'swot':
      return (
        <div className="grid grid-cols-2 gap-0.5" aria-hidden>
          {['S', 'W', 'O', 'T'].map(l => (
            <div
              key={l}
              className="flex h-6 items-center justify-center rounded border border-gray-200 bg-gray-50 text-[9px] font-extrabold text-gray-600"
            >
              {l}
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}
