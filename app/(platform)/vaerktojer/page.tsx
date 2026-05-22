import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import { VAERKTOEJER } from '@/lib/vaerktoejer-data'
import { NON_METHOD_SLUGS } from '@/lib/method-catalog'
import AvailableToolCard from '@/components/dashboard/AvailableToolCard'

export const metadata = {
  title: 'Værktøjer uden projekt | ForgeLab',
  description: 'Standalone værktøjer du kan bruge uden at oprette et projekt.',
}

export default async function VaerktojerPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const standaloneTools = VAERKTOEJER.filter((tool) => NON_METHOD_SLUGS.has(tool.slug))

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-5">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">
          Værktøjer uden projekt
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Brug hurtige værktøjer uden at oprette et projekt.
        </p>
      </header>

      {standaloneTools.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Ingen standalone-værktøjer er tilgængelige endnu.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {standaloneTools.map((tool) => (
            <AvailableToolCard key={tool.slug} tool={tool} href={`/tools/${tool.slug}`} />
          ))}
        </div>
      )}
    </div>
  )
}
