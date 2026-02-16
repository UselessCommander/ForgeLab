import Link from 'next/link'
import { notFound } from 'next/navigation'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import { ArrowRight, LogIn } from 'lucide-react'
import { getVaerktoejBySlug, getAllSlugs } from '@/lib/vaerktoejer-data'
import { getToolIcon } from '@/lib/vaerktoejer-icons'

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
    <div className="min-h-screen bg-[#fafbfc]">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f1f3_1px,transparent_1px),linear-gradient(to_bottom,#f0f1f3_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none" />
      <div className="relative z-10">
        <nav className="border-b border-gray-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center gap-3">
                <ForgeLabLogo size={28} />
                <span className="font-semibold text-gray-900">ForgeLab</span>
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/vaerktoejer" className="text-gray-600 hover:text-gray-900">
                  Værktøjer
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Log ind
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-6 py-12 max-w-3xl">
          <nav className="text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-gray-900">Forside</Link>
            <span className="mx-2">/</span>
            <Link href="/vaerktoejer" className="hover:text-gray-900">Værktøjer</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{v.title}</span>
          </nav>

          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${bg} ${text} mb-6`}>
            <Icon className="w-7 h-7" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {v.title}
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            {v.shortDescription}
          </p>

          <div className="prose prose-gray max-w-none">
            <div className="whitespace-pre-line text-gray-600 leading-relaxed">
              {v.longSeoContent}
            </div>
          </div>

          <div className="mt-12 p-6 bg-violet-50 border border-violet-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-700">
              Brug {v.title} fra dit dashboard efter login.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-xl font-semibold hover:bg-violet-600 transition-colors shrink-0"
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
      </div>
    </div>
  )
}
