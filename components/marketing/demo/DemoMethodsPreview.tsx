import { DEMO_METHODS } from '@/lib/marketing-demo-data'
import DemoMethodVisual from './DemoMethodVisual'

export default function DemoMethodsPreview() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {DEMO_METHODS.map(method => (
        <div
          key={method.id}
          className="flex flex-col rounded-xl border border-gray-200 bg-white p-4"
        >
          <div className="mb-3 min-h-[56px] rounded-lg border border-gray-100 bg-[#fafbfc] p-2">
            <DemoMethodVisual visual={method.visual} />
          </div>
          <div className="mb-2 flex flex-wrap gap-1">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-600">
              {method.category}
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
              {method.phase}
            </span>
          </div>
          <h3 className="text-sm font-extrabold text-gray-900">{method.title}</h3>
          <p className="mt-1 flex-1 text-xs leading-relaxed text-gray-500">{method.description}</p>
        </div>
      ))}
    </div>
  )
}
