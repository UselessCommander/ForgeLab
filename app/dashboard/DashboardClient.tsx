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

  return (
    <PageShell>
      <SiteNav
        rightSlot={
          <div className="flex items-center gap-3">
            <Link href="/analytics" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Analytics
            </Link>
            <LogoutButton />
          </div>
        }
      />
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dine projekter</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
            >
              Opret nyt projekt
            </button>
          </div>
          {loading ? (
            <div className="rounded-2xl border border-dashed border-gray-200/80 bg-white p-12 text-center shadow-sm">
              <p className="text-gray-500">Indlæser projekter...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200/80 bg-white p-12 text-center shadow-sm">
              <p className="text-gray-500 mb-4">Du har endnu ingen projekter.</p>
              <button onClick={() => setShowCreateModal(true)} className="text-amber-600 font-medium hover:text-amber-700">
                Opret dit første projekt →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </section>
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tilgængelige værktøjer</h2>
          <p className="text-gray-600 mb-6">Tilføj værktøjer til et projekt via projektets sidebjælke.</p>
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
