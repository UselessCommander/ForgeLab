'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'

interface ToolLayoutProps {
  title: string
  description?: string
  children: React.ReactNode
  /** When true, hide back link and use compact padding (for project workspace embed) */
  embed?: boolean
  backHref?: string
  backLabel?: string
}

export default function ToolLayout({
  title,
  description,
  children,
  embed = false,
  backHref = '/dashboard',
  backLabel = 'Tilbage til Dashboard',
}: ToolLayoutProps) {
  const searchParams = useSearchParams()
  const isEmbed = embed || searchParams.get('embed') === '1'

  if (isEmbed) {
    return (
      <div className="min-h-full px-4 py-6 bg-[#fafbfc]">
        <div className="max-w-5xl mx-auto">{children}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 overflow-hidden">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f1f3_1px,transparent_1px),linear-gradient(to_bottom,#f0f1f3_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-white/80 via-transparent to-amber-50/30 pointer-events-none" />
      <div className="relative z-10 px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-200/80">
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 text-gray-700 font-medium mb-6 hover:text-gray-900 transition-colors"
              >
                <span>←</span>
                <span>{backLabel}</span>
              </Link>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <ForgeLabLogo size={32} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">{title}</h1>
              </div>
              {description && <p className="text-gray-600">{description}</p>}
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  )
}
