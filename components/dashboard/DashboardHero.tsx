'use client'

import Link from 'next/link'
import type { ForgeTheme } from '@/lib/theme'
import type { Project } from '@/lib/projects'
import { Compass, Clock, ChevronRight, Sparkles, type LucideIcon } from 'lucide-react'

export type DashboardHeroStat = {
  icon: LucideIcon
  label: string
  value: string | number
  sub: string
}

interface DashboardHeroProps {
  heroTheme: ForgeTheme
  hasProjects: boolean
  stats: DashboardHeroStat[]
  latestProject: Project | null
}

/** Theme-aware hero gradient via globals.css accent tokens (set on `html[data-theme]`). */
const HERO_GRADIENT =
  'linear-gradient(135deg, var(--forge-accent-500) 0%, var(--forge-accent-500) 40%, var(--forge-accent-600) 100%)'

const THEME_LABELS: Record<ForgeTheme, string> = {
  default: 'Forge Amber',
  emerald: 'Emerald Green',
  chelsea: 'Chelsea Blue',
  arsenal: 'Arsenal Red',
  sunset: 'Sunset Orange',
  'lightning-purple': 'Lightning Purple',
  'pink-cherry': 'Pink Cherry',
}

export default function DashboardHero({
  heroTheme,
  hasProjects,
  stats,
  latestProject,
}: DashboardHeroProps) {
  return (
    <section className="mb-8">
      <div
        className="relative overflow-hidden rounded-3xl text-white p-5 md:p-8 border border-white/10"
        style={{
          background: HERO_GRADIENT,
          boxShadow: 'var(--forge-hero-shadow)',
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-1/3 w-80 h-40 rounded-full bg-black/15 blur-2xl" />
          <div className="absolute top-6 right-1/4 w-3 h-3 rounded-full bg-white/30" />
          <div className="absolute bottom-8 right-16 w-2 h-2 rounded-full bg-white/25" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1 min-w-0 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/80 mb-3">
              <Sparkles className="w-3 h-3" />
              {THEME_LABELS[heroTheme]}
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight leading-snug mb-2">
              Start dit næste konceptprojekt
            </h1>
            <p className="text-sm text-white/80 max-w-lg leading-relaxed mb-4">
              Saml metoder, boards og analyser ét sted.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/metodebibliotek"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  hasProjects
                    ? 'bg-gray-900 text-white shadow-md hover:bg-black'
                    : 'bg-white/12 text-white border border-white/25 hover:bg-white/20'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Udforsk metoder
              </Link>
              {hasProjects && latestProject && (
                <Link
                  href={`/dashboard/projects/${latestProject.id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/12 text-white/90 text-sm font-medium hover:bg-white/20 border border-white/20 transition-all max-w-full"
                >
                  <Clock className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
                  <span className="truncate">Senest: {latestProject.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                </Link>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex gap-2 overflow-x-auto pb-0.5 lg:pb-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-2 lg:overflow-visible lg:max-w-md">
            {stats.map(({ icon: Icon, label, value, sub }) => (
              <div
                key={label}
                className="min-w-[7.5rem] flex-shrink-0 rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 backdrop-blur-sm lg:min-w-0"
              >
                <div className="flex items-center gap-1 text-white/60 text-[9px] font-semibold uppercase tracking-wide mb-1">
                  <Icon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </div>
                <p className="text-xl font-extrabold leading-none text-white">{value}</p>
                <p className="text-[10px] text-white/50 mt-0.5 line-clamp-2">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
