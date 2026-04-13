import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'
import PageShell from '@/components/PageShell'
import SiteNav from '@/components/SiteNav'
import VaerktoejerOversigtClient from '@/components/VaerktoejerOversigtClient'
import { getCurrentUserId } from '@/lib/auth'
import { VAERKTOEJER } from '@/lib/vaerktoejer-data'
import { groupVaerktoejerByFirstLetter } from '@/lib/vaerktoejer-wiki'

export const metadata = {
  title: 'Værktøjer (A–Å) | ForgeLab',
  description:
    'Oversigt over ForgeLabs digitale værktøjer fra A til Å. Brug dem frit uden login — data gemmes først i skyen, når du er logget ind og arbejder i et projekt.',
}

export default async function VaerktoejerOversigtPage() {
  const userId = await getCurrentUserId()
  const isLoggedIn = !!userId
  const groups = groupVaerktoejerByFirstLetter(VAERKTOEJER)
  const clientGroups = groups.map(({ letter, items }) => ({
    letter,
    items: items.map(({ slug, title, shortDescription }) => ({ slug, title, shortDescription })),
  }))

  return (
    <PageShell>
      <SiteNav
        rightSlot={
          isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Dashboard
            </Link>
          ) : undefined
        }
      />
      <main className="layout-page py-16">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 mb-5">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Værktøjer (A–Å)</h1>
          <p className="text-lg text-gray-600 mb-2">
            Wiki-oversigt med korte beskrivelser. Klik på et navn for at åbne værktøjet — det virker uden konto, men bliver{' '}
            <span className="font-medium text-gray-800">kun gemt i databasen</span>, når du er logget ind og bruger det i et projekt.
          </p>
          {!isLoggedIn && (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-sm"
            >
              Log ind for at gemme i projekter
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <VaerktoejerOversigtClient groups={clientGroups} />

        <div className="max-w-3xl mx-auto mt-10 text-center">
          <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium inline-flex items-center gap-2 transition-colors">
            ← Tilbage til forsiden
          </Link>
        </div>
      </main>
    </PageShell>
  )
}
