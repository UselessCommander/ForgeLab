'use client'

import { useEffect, useState } from 'react'
import WorkspacesSection from '@/components/dashboard/WorkspacesSection'
import { getProjects, type Project } from '@/lib/projects'
import { getWorkspaces, type Workspace } from '@/lib/workspaces'

export default function WorkspacesPageClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [projs, ws] = await Promise.all([getProjects(), getWorkspaces()])
      setProjects(projs)
      setWorkspaces(ws)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-5">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">Workspaces</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Workspaces samler projekter for et team, fag eller kunde.
        </p>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          Indlæser workspaces…
        </div>
      ) : workspaces.length === 0 ? (
        <div className="mb-8 rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">Du har ingen workspaces endnu.</p>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Opret et workspace for at gruppere projekter — eller start med at oprette et projekt på dashboardet.
          </p>
        </div>
      ) : null}

      <WorkspacesSection workspaces={workspaces} projects={projects} onWorkspacesChange={load} />
    </div>
  )
}
