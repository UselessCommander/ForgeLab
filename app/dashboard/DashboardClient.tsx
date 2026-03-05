'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import PageShell from '@/components/PageShell'
import SiteNav from '@/components/SiteNav'
import ProjectCard from '@/components/dashboard/ProjectCard'
import AvailableToolCard from '@/components/dashboard/AvailableToolCard'
import {
  getProjects,
  createProject,
  type Project,
} from '@/lib/projects'
import { VAERKTOEJER } from '@/lib/vaerktoejer-data'

export default function DashboardClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const projs = await getProjects()
      setProjects(projs)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim() || creating) return
    try {
      setCreating(true)
      const p = await createProject(newName.trim(), newDesc.trim())
      await loadProjects()
      setShowCreateModal(false)
      setNewName('')
      setNewDesc('')
      window.location.href = `/dashboard/projects/${p.id}`
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Kunne ikke oprette projekt. Prøv igen.')
    } finally {
      setCreating(false)
    }
  }

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 5) return 'God aften'
    if (hour < 10) return 'Godmorgen'
    if (hour < 18) return 'God eftermiddag'
    return 'God aften'
  })()

  const projectCount = projects.length
  const latestProject =
    projectCount > 0
      ? [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      : null

  return (
    <PageShell>
      <SiteNav
        rightSlot={
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Analytics
            </Link>
            <LogoutButton />
          </div>
        }
      />
      <div className="container mx-auto px-6 py-10 max-w-5xl">
        {/* Hero / topsektion */}
        <section className="mb-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-500/90 to-amber-600 text-white p-6 md:p-8 shadow-[0_20px_45px_rgba(249,115,22,0.35)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/90 mb-1">
                  Dit ForgeLab dashboard
                </p>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mb-2">
                  {greeting}, klar til næste eksperiment?
                </h1>
                <p className="text-sm md:text-base text-amber-50/90 max-w-xl">
                  Opret et nyt projekt på få sekunder, tilføj værktøjer som A/B/N test eller spørgeskemaer – og følg resultaterne direkte i Analytics.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-5">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm md:text-base font-semibold shadow-lg shadow-black/40 hover:bg-black transition-all duration-150"
                  >
                    Opret nyt projekt
                  </button>
                  {latestProject && (
                    <Link
                      href={`/dashboard/projects/${latestProject.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-amber-50 text-sm font-medium hover:bg-white/15 border border-white/20 backdrop-blur"
                    >
                      Fortsæt seneste projekt
                      <span className="hidden sm:inline text-amber-100/80 truncate max-w-[180px]">
                        “{latestProject.name}”
                      </span>
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 grid grid-cols-2 gap-3 text-xs md:text-sm">
                <div className="rounded-2xl bg-black/15 border border-white/15 px-4 py-3">
                  <p className="text-amber-100/80 text-[11px] font-medium uppercase tracking-wide mb-1">
                    Aktive projekter
                  </p>
                  <p className="text-2xl font-semibold leading-tight">{projectCount}</p>
                  <p className="text-amber-100/70 text-[11px] mt-1">
                    Samler alle dine værktøjer ét sted.
                  </p>
                </div>
                <div className="rounded-2xl bg-black/10 border border-white/10 px-4 py-3">
                  <p className="text-amber-100/80 text-[11px] font-medium uppercase tracking-wide mb-1">
                    Tilgængelige værktøjer
                  </p>
                  <p className="text-2xl font-semibold leading-tight">{VAERKTOEJER.length}</p>
                  <p className="text-amber-100/70 text-[11px] mt-1">
                    Klar til at blive tilknyttet dine projekter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Primær indhold: projekter + hurtig adgang */}
        <section className="mb-12 grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-8">
          {/* Projekter */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Dine projekter</h2>
                <p className="text-xs md:text-sm text-gray-500">
                  Saml værktøjer, eksperimenter og resultater i projekter, så du holder overblik.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/50 text-amber-600 text-sm font-medium hover:bg-amber-50/70 transition-colors"
              >
                + Nyt projekt
              </button>
            </div>
            {loading ? (
              <div className="rounded-2xl border border-dashed border-gray-200/80 bg-white p-10 text-center shadow-sm">
                <p className="text-gray-500 text-sm">Indlæser dine projekter…</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-amber-200/70 bg-amber-50/60 p-8 text-center shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Kom i gang på få sekunder</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Opret dit første projekt og tilføj de værktøjer, du vil teste eller analysere.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/30"
                >
                  Opret dit første projekt
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
          </div>

          {/* Hurtig adgang */}
          <aside className="lg:pl-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Hurtig adgang</h2>
            </div>
            <p className="text-xs md:text-sm text-gray-500 mb-4">
              Hop direkte ind i nøgleværktøjer uden først at oprette et projekt.
            </p>
            <div className="space-y-3">
              <Link
                href="/tools/ab-test"
                className="flex items-stretch gap-4 p-5 rounded-2xl border border-gray-200/90 bg-white shadow-sm hover:shadow-lg hover:border-violet-200/70 transition-all duration-200 group"
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <span className="text-xl" aria-hidden>
                    🔀
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 group-hover:text-violet-700">
                    A/B/N Test
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Del et magic link og lad brugere vælge mellem varianter. Ideel til hurtige design- og indholdsvalg.
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between text-right">
                  <span className="text-[11px] font-medium text-violet-600 group-hover:text-violet-700">
                    Åbn værktøj
                  </span>
                  <span className="text-[10px] text-gray-400">2–3 min opsætning</span>
                </div>
              </Link>
            </div>
          </aside>
        </section>

        {/* Tilgængelige værktøjer */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Værktøjsbibliotek</h2>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mb-5 max-w-2xl">
            Udforsk alle værktøjer, der kan tilføjes til dine projekter. Vælg de værktøjer, der passer til dit næste eksperiment, og aktiver dem fra projekt-siden.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VAERKTOEJER.map((tool) => (
              <AvailableToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      </div>
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowCreateModal(false)}>
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-gray-200/80 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Opret nyt projekt</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Navn</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Mit projekt"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beskrivelse (valgfrit)</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Kort beskrivelse"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                Annuller
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/25"
              >
                {creating ? 'Opretter...' : 'Opret'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
