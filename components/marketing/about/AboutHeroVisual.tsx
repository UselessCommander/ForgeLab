export default function AboutHeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg" aria-hidden>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          {['Research', 'Analyse', 'Koncept', 'Output'].map(label => (
            <span
              key={label}
              className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2">
          {['SWOT', 'Persona', 'PESO'].map(name => (
            <div
              key={name}
              className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-3 text-center text-[10px] font-bold text-gray-700"
            >
              {name}
            </div>
          ))}
        </div>

        <div className="mb-3 rounded-xl border border-dashed border-gray-200 bg-[#fafbfc] p-3">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
            Projekt-board
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-8 rounded-md border border-gray-200 bg-white" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-gray-200 bg-white p-2.5">
            <p className="text-[9px] font-bold text-gray-400">Rapport-output</p>
            <div className="mt-1.5 space-y-1">
              <div className="h-1.5 w-full rounded bg-gray-100" />
              <div className="h-1.5 w-4/5 rounded bg-gray-100" />
              <div className="h-1.5 w-3/5 rounded bg-amber-100" />
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-2.5">
            <p className="text-[9px] font-bold text-gray-400">Workshop</p>
            <div className="mt-1.5 flex gap-1">
              <div className="h-6 flex-1 rounded bg-violet-50 border border-violet-100" />
              <div className="h-6 flex-1 rounded bg-emerald-50 border border-emerald-100" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-2 top-8 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-gray-700 shadow-sm">
        Golden Circle
      </div>
      <div className="absolute -left-3 bottom-16 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-gray-700 shadow-sm">
        Journey Map
      </div>
    </div>
  )
}
