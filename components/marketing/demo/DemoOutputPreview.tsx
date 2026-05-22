import { DEMO_OUTPUT } from '@/lib/marketing-demo-data'

export default function DemoOutputPreview() {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-4 text-center text-sm text-gray-500">{DEMO_OUTPUT.intro}</p>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 border-b border-gray-100 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Projekt-output · Preview
          </p>
          <h3 className="mt-1 text-lg font-extrabold text-gray-900">
            Ny digital service — konceptdokumentation
          </h3>
        </div>
        <div className="space-y-5">
          {DEMO_OUTPUT.sections.map(section => (
            <div key={section.title}>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-amber-700">
                {section.title}
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
