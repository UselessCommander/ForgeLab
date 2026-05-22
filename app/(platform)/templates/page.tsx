import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import { PROJECT_TEMPLATES } from '@/lib/project-templates'
import { LayoutTemplate, Plus } from 'lucide-react'

export const metadata = {
  title: 'Templates | ForgeLab',
  description: 'Projektstartere og skabeloner til ForgeLab.',
}

export default async function TemplatesPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-5">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">Templates</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Projektstartere med forudvalgte metoder — vælg en skabelon og kom hurtigt i gang.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PROJECT_TEMPLATES.map((template) => (
          <article
            key={template.id}
            className="flex flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <h2 className="mb-1 text-base font-bold text-gray-900">{template.name}</h2>
            <p className="mb-4 flex-1 text-sm text-gray-500">{template.description}</p>
            <p className="mb-4 text-xs text-gray-400">
              <span className="font-semibold text-gray-600">Metoder: </span>
              {template.methods.join(' · ')}
            </p>
            {template.available ? (
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white"
              >
                Brug template
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Opret projekt i stedet
              </Link>
            )}
            {!template.available && (
              <p className="mt-2 text-center text-[11px] text-gray-400">Kommer snart</p>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
