import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, LogIn } from 'lucide-react'
import PageShell from '@/components/PageShell'
import SiteNav from '@/components/SiteNav'
import { getVaerktoejBySlug, getAllSlugs } from '@/lib/vaerktoejer-data'
import { getToolIcon } from '@/lib/vaerktoejer-icons'
import { ToolIllustration } from '../components/ToolIllustration'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const v = getVaerktoejBySlug(slug)
  if (!v) return { title: 'Værktøj | ForgeLab' }
  return {
    title: `${v.title} | ForgeLab`,
    description: v.shortDescription,
  }
}

export default async function VaerktoejSlugPage({ params }: PageProps) {
  const { slug } = await params
  const v = getVaerktoejBySlug(slug)
  if (!v) notFound()
  const { Icon, bg, text } = getToolIcon(slug)

  return (
    <PageShell>
      <SiteNav
        rightSlot={
          <div className="flex items-center gap-4">
            <Link href="/vaerktoejer" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Værktøjer
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <LogIn className="w-4 h-4" />
              Log ind
            </Link>
          </div>
        }
      />
      <main className="container mx-auto px-6 py-12 max-w-4xl">
          <nav className="text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-gray-900">Forside</Link>
            <span className="mx-2">/</span>
            <Link href="/vaerktoejer" className="hover:text-gray-900">Værktøjer</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{v.title}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-12 mb-12">
            <div className="flex-shrink-0 w-full md:w-[280px]">
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 flex items-center justify-center min-h-[200px]">
                <ToolIllustration slug={slug} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${bg} ${text} mb-4`}>
                <Icon className="w-7 h-7" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {v.title}
              </h1>
              <p className="text-xl text-gray-600">
                {v.shortDescription}
              </p>
            </div>
          </div>

          <div className="prose prose-gray max-w-none">
            <div className="whitespace-pre-line text-gray-600 leading-relaxed">
              {v.longSeoContent}
            </div>
          </div>

          <div className="mt-12 p-6 bg-violet-50 border border-violet-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="hidden sm:block w-20 h-20 flex-shrink-0 rounded-xl bg-white border border-violet-100 p-2 shadow-sm">
                <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-[72px]">
                  <ToolIllustration slug={slug} />
                </div>
              </div>
              <p className="text-gray-700">
                Brug {v.title} fra dit dashboard efter login.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all duration-200 shadow-lg shadow-amber-500/25 shrink-0"
            >
              Log ind
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/vaerktoejer" className="text-gray-500 hover:text-gray-900">
              ← Alle værktøjer
            </Link>
            <Link href="/" className="text-gray-500 hover:text-gray-900">
              Forside
            </Link>
          </div>
        </main>
    </PageShell>
  )
}
