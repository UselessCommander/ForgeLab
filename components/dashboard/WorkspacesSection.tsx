'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FolderOpen, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight, FolderPlus, GripVertical } from 'lucide-react'
import type { Workspace } from '@/lib/workspaces'
import { createWorkspace, updateWorkspace, deleteWorkspace, addProjectToWorkspace, removeProjectFromWorkspace } from '@/lib/workspaces'
import type { Project } from '@/lib/projects'

const WORKSPACE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#1e293b',
]

interface WorkspacesSectionProps {
  workspaces: Workspace[]
  projects: Project[]
  onWorkspacesChange: () => void
  /** When true (e.g. no projects yet), de-emphasize workspace vs project creation */
  deEmphasize?: boolean
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'Lige nu'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} t`
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

export default function WorkspacesSection({
  workspaces,
  projects,
  onWorkspacesChange,
  deEmphasize = false,
}: WorkspacesSectionProps) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(WORKSPACE_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [dragOverWorkspace, setDragOverWorkspace] = useState<string | null>(null)
  const [addingProjectTo, setAddingProjectTo] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      await createWorkspace(newName.trim(), newColor)
      setNewName('')
      setNewColor(WORKSPACE_COLORS[0])
      setCreating(false)
      onWorkspacesChange()
    } finally {
      setSaving(false)
    }
  }

  const handleRename = async (ws: Workspace) => {
    if (!editName.trim()) return
    await updateWorkspace(ws.id, { name: editName.trim(), color: editColor })
    setEditingId(null)
    onWorkspacesChange()
  }

  const handleDelete = async (ws: Workspace) => {
    if (!confirm(`Slet workspace "${ws.name}"? Projekterne slettes ikke.`)) return
    await deleteWorkspace(ws.id)
    onWorkspacesChange()
  }

  const handleDrop = async (workspaceId: string, projectId: string) => {
    await addProjectToWorkspace(workspaceId, projectId)
    onWorkspacesChange()
  }

  const handleRemoveProject = async (workspaceId: string, projectId: string) => {
    await removeProjectFromWorkspace(workspaceId, projectId)
    onWorkspacesChange()
  }

  const handleAddProject = async (workspaceId: string, projectId: string) => {
    await addProjectToWorkspace(workspaceId, projectId)
    setAddingProjectTo(null)
    onWorkspacesChange()
  }

  // Projects not yet in a particular workspace
  const unassignedFor = (ws: Workspace) =>
    projects.filter((p) => !ws.projectIds.includes(p.id))

  return (
    <section className={`mb-8 ${deEmphasize ? 'opacity-90' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Workspaces</span>
            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{workspaces.length}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Workspaces samler projekter for et team, fag eller kunde.
          </p>
        </div>
        {!deEmphasize && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Nyt workspace
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div className="mb-4 p-4 rounded-2xl border border-indigo-200 bg-white shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Nyt workspace</p>
          <div className="flex items-center gap-3 mb-3">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
              placeholder="Navn på workspace..."
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex items-center gap-2 mb-4">
            {WORKSPACE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                style={{ background: c }}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${newColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving || !newName.trim()} className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              Opret
            </button>
            <button onClick={() => setCreating(false)} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
              Annuller
            </button>
          </div>
        </div>
      )}

      {workspaces.length === 0 && !creating && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white/60 p-4 text-sm text-gray-500 text-center">
          {deEmphasize ? (
            <>
              <p>Valgfrit: opret et workspace senere for at gruppere projekter.</p>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="mt-2 text-xs font-semibold text-gray-600 hover:text-indigo-600 underline-offset-2 hover:underline"
              >
                Opret workspace
              </button>
            </>
          ) : (
            'Ingen workspaces endnu. Opret et for at organisere dine projekter.'
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {workspaces.map((ws) => {
          const wsProjects = projects.filter((p) => ws.projectIds.includes(p.id))
          const isCollapsed = collapsed[ws.id]
          const isDragOver = dragOverWorkspace === ws.id

          return (
            <div
              key={ws.id}
              className={`rounded-2xl border transition-all duration-150 ${isDragOver ? 'border-2 ring-2' : 'border-gray-200'} bg-white shadow-sm`}
              style={isDragOver ? { borderColor: ws.color, boxShadow: `0 0 0 3px ${ws.color}22` } : {}}
              onDragOver={(e) => { e.preventDefault(); setDragOverWorkspace(ws.id) }}
              onDragLeave={() => setDragOverWorkspace(null)}
              onDrop={async (e) => {
                e.preventDefault()
                setDragOverWorkspace(null)
                const pid = (typeof window !== 'undefined' && (window as any).__dragProjectId) || e.dataTransfer.getData('projectId')
                if (typeof window !== 'undefined') (window as any).__dragProjectId = null
                if (pid) await handleDrop(ws.id, pid)
              }}
            >
              {/* Workspace header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setCollapsed(prev => ({ ...prev, [ws.id]: !isCollapsed }))}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: ws.color }} />

                {editingId === ws.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRename(ws); if (e.key === 'Escape') setEditingId(null) }}
                      className="flex-1 text-sm font-semibold px-2 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <div className="flex gap-1">
                      {WORKSPACE_COLORS.map((c) => (
                        <button key={c} type="button" onClick={() => setEditColor(c)} style={{ background: c }}
                          className={`w-4 h-4 rounded-full border-2 ${editColor === c ? 'border-gray-900' : 'border-transparent'}`} />
                      ))}
                    </div>
                    <button onClick={() => handleRename(ws)} className="text-indigo-600 hover:text-indigo-700"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <span className="flex-1 text-sm font-semibold text-gray-800">{ws.name}</span>
                )}

                <span className="text-[11px] text-gray-400 font-medium">{wsProjects.length} projekt{wsProjects.length !== 1 ? 'er' : ''}</span>

                {editingId !== ws.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setAddingProjectTo(addingProjectTo === ws.id ? null : ws.id) }}
                      className="relative z-10 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Tilføj projekt"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setEditingId(ws.id); setEditName(ws.name); setEditColor(ws.color) }}
                      className="relative z-10 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      title="Omdøb"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ws)}
                      className="relative z-10 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Slet workspace"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Drop hint */}
              {isDragOver && (
                <div className="mx-4 mb-2 rounded-xl border-2 border-dashed py-3 text-center text-xs font-semibold" style={{ borderColor: ws.color, color: ws.color }}>
                  Slip for at tilføje til {ws.name}
                </div>
              )}

              {/* Add project picker */}
              {addingProjectTo === ws.id && (
                <div className="mx-4 mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">Vælg projekt</p>
                  {unassignedFor(ws).length === 0 ? (
                    <p className="text-xs text-gray-400">Alle projekter er allerede i dette workspace.</p>
                  ) : (
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                      {unassignedFor(ws).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleAddProject(ws.id, p.id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-gray-700 hover:bg-white hover:shadow-sm transition-all"
                        >
                          <FolderOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setAddingProjectTo(null)} className="mt-2 text-xs text-gray-400 hover:text-gray-600">Luk</button>
                </div>
              )}

              {/* Projects list */}
              {!isCollapsed && wsProjects.length > 0 && (
                <div className="px-4 pb-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {wsProjects.map((p) => (
                    <div key={p.id} className="group/card relative flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                      <div
                        draggable
                        onDragStart={(e) => { (window as any).__dragProjectId = p.id; e.dataTransfer.setData('projectId', p.id) }}
                        className="cursor-grab text-gray-300 hover:text-gray-400 flex-shrink-0"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${ws.color}18` }}>
                        <FolderOpen className="w-3.5 h-3.5" style={{ color: ws.color }} />
                      </div>
                      <Link href={`/dashboard/projects/${p.id}`} className="flex-1 min-w-0 absolute inset-0 rounded-xl" aria-label={p.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{formatDate(p.updatedAt)}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveProject(ws.id, p.id)}
                        className="relative z-10 opacity-0 group-hover/card:opacity-100 p-1 rounded text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
                        title="Fjern fra workspace"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!isCollapsed && wsProjects.length === 0 && !isDragOver && (
                <div className="px-4 pb-4">
                  <div
                    className="rounded-xl border border-dashed border-gray-200 py-4 text-center text-xs text-gray-400 cursor-pointer hover:border-gray-300 transition-colors"
                    onClick={() => setAddingProjectTo(ws.id)}
                  >
                    Træk projekter hertil eller klik + for at tilføje
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
