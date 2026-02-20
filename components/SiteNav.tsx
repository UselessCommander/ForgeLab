'use client'

import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'

interface SiteNavProps {
  /** Right-side CTA: "Log ind" vs "Dashboard" etc. */
  rightSlot?: React.ReactNode
  /** Use landing-style CTA (gray-900 Log ind) when true and no rightSlot */
  showLoginCta?: boolean
}

export default function SiteNav({ rightSlot, showLoginCta = true }: SiteNavProps) {
  return (
    <nav className="border-b border-gray-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20 transition-colors">
              <ForgeLabLogo size={28} />
            </div>
            <span className="text-xl font-semibold text-gray-900 tracking-tight">
              ForgeLab
            </span>
          </Link>
          {rightSlot ?? (showLoginCta && (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Log Ind
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
