'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import type { ActivityItem } from '@/lib/recent-activity'
import { formatActivityTime } from '@/lib/recent-activity'

type RecentActivitySectionProps = {
  items: ActivityItem[]
  scope: 'global' | 'project'
  className?: string
}

export default function RecentActivitySection({ items, scope, className = '' }: RecentActivitySectionProps) {
  const emptyGlobal =
    'Ingen aktivitet endnu. Når du opretter projekter og arbejder med metoder, vises dine seneste handlinger her.'
  const emptyProject =
    'Ingen aktivitet i projektet endnu. Når du redigerer boards, metoder eller dokumenter, vises det her.'

  return (
    <section className={`mb-10 ${className}`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200/80 bg-white">
          <Clock className="h-[18px] w-[18px] text-gray-500" />
        </div>
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-gray-900 md:text-lg">Seneste aktivitet</h2>
          <p className="text-xs text-gray-500">
            {scope === 'global' ? 'På tværs af dine projekter' : 'I dette projekt'}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200/80 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          {scope === 'global' ? emptyGlobal : emptyProject}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          {items.map((item) => {
            const inner = (
              <>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                {scope === 'global' && item.projectName && (
                  <p className="mt-0.5 text-xs text-gray-500">Projekt: {item.projectName}</p>
                )}
                <p className="mt-1 text-[11px] text-gray-400">{formatActivityTime(item.at)}</p>
              </>
            )
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className="block px-4 py-3 transition-colors hover:bg-gray-50">
                    {inner}
                  </Link>
                ) : (
                  <div className="px-4 py-3">{inner}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
