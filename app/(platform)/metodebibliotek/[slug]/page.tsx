import { notFound, redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import MethodDetailView from '@/components/metoder/MethodDetailView'
import { getMethodPageContent } from '@/lib/method-content'
import {
  getAllMethodSlugs,
  getMethodCatalogEntry,
} from '@/lib/method-catalog'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllMethodSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const method = getMethodCatalogEntry(slug)
  if (!method) return { title: 'Metode | ForgeLab' }
  return {
    title: `${method.title} | Metoder | ForgeLab`,
    description: method.shortDescription,
  }
}

export default async function MetodeDetailPage({ params }: PageProps) {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const { slug } = await params
  const method = getMethodCatalogEntry(slug)
  if (!method) notFound()

  const content = getMethodPageContent(method)

  return <MethodDetailView method={method} content={content} />
}
