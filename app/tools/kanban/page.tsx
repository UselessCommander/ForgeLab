'use client'

import { useEffect, useMemo, useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { addToolToProject, getProjectMembers, type ProjectMember } from '@/lib/projects'
import { VAERKTOEJER } from '@/lib/vaerktoejer-data'

type KanbanColumnId = 'todo' | 'in-progress' | 'done'

type KanbanTask = {
  id: string
  title: string
  description: string
  assigneeUserId?: string
  assigneeName?: string
  toolSlug?: string
}

type KanbanColumn = {
  id: KanbanColumnId
  title: string
  tasks: KanbanTask[]
}

type KanbanData = {
  columns: KanbanColumn[]
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const DEFAULT_DATA: KanbanData = {
  columns: [
    {
      id: 'todo',
      title: 'To do',
      tasks: [{ id: createId(), title: 'Definér næste sprintmål', description: '' }],
    },
    {
      id: 'in-progress',
      title: 'I gang',
      tasks: [{ id: createId(), title: 'Lav wireframe til onboarding', description: '' }],
    },
    {
      id: 'done',
      title: 'Færdig',
      tasks: [{ id: createId(), title: 'Kickoff afholdt', description: '' }],
    },
  ],
}

export default function KanbanPage() {
  const [data, setData] = useState<KanbanData>(DEFAULT_DATA)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragPayload, setDragPayload] = useState<{ fromId: KanbanColumnId; taskId: string } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ toId: KanbanColumnId; index?: number } | null>(null)
  const { projectId, isInProject } = useProjectToolData<KanbanData>('kanban', data, setData)

  useEffect(() => {
    let cancelled = false
    const loadMembers = async () => {
      if (!projectId) {
        setMembers([])
        return
      }
      try {
        const nextMembers = await getProjectMembers(projectId)
        if (!cancelled) setMembers(nextMembers)
      } catch {
        if (!cancelled) setMembers([])
      }
    }
    loadMembers()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const memberOptions = useMemo(
    () =>
      members.map((m) => ({
        id: m.user_id,
        label:
          (typeof m.username === 'string' && m.username.trim()) ||
          (typeof m.email === 'string' && m.email.trim()) ||
          m.user_id,
      })),
    [members]
  )

  const toolOptions = useMemo(
    () =>
      [...VAERKTOEJER]
        .sort((a, b) => a.title.localeCompare(b.title, 'da'))
        .map((tool) => ({ slug: tool.slug, title: tool.title })),
    []
  )

  const addTask = (columnId: KanbanColumnId) => {
    setData((prev) => ({
      columns: prev.columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              tasks: [...col.tasks, { id: createId(), title: '', description: '' }],
            }
          : col
      ),
    }))
  }

  const updateTask = (
    columnId: KanbanColumnId,
    taskId: string,
    patch: Partial<Pick<KanbanTask, 'title' | 'description' | 'assigneeUserId' | 'assigneeName' | 'toolSlug'>>
  ) => {
    setData((prev) => ({
      columns: prev.columns.map((col) =>
        col.id === columnId
          ? {
              ...col,
              tasks: col.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
            }
          : col
      ),
    }))
  }

  const removeTask = (columnId: KanbanColumnId, taskId: string) => {
    setData((prev) => ({
      columns: prev.columns.map((col) =>
        col.id === columnId ? { ...col, tasks: col.tasks.filter((task) => task.id !== taskId) } : col
      ),
    }))
  }

  const moveTask = (
    fromId: KanbanColumnId,
    taskId: string,
    toId: KanbanColumnId,
    insertAtIndex?: number
  ) => {
    setData((prev) => {
      const source = prev.columns.find((col) => col.id === fromId)
      const task = source?.tasks.find((t) => t.id === taskId)
      if (!task) return prev

      // Same-column reorder must remove + reinsert in one pass.
      if (fromId === toId) {
        return {
          columns: prev.columns.map((col) => {
            if (col.id !== fromId) return col
            const nextTasks = col.tasks.filter((t) => t.id !== taskId)
            const safeIndex =
              typeof insertAtIndex === 'number'
                ? Math.max(0, Math.min(insertAtIndex, nextTasks.length))
                : nextTasks.length
            nextTasks.splice(safeIndex, 0, task)
            return { ...col, tasks: nextTasks }
          }),
        }
      }

      return {
        columns: prev.columns.map((col) => {
          if (col.id === fromId) {
            return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
          }
          if (col.id === toId) {
            const withoutMovedTask = col.tasks.filter((t) => t.id !== taskId)
            const nextTasks = [...withoutMovedTask]
            const safeIndex =
              typeof insertAtIndex === 'number'
                ? Math.max(0, Math.min(insertAtIndex, nextTasks.length))
                : nextTasks.length
            nextTasks.splice(safeIndex, 0, task)
            return { ...col, tasks: nextTasks }
          }
          return col
        }),
      }
    })
  }

  const parseDragPayload = (
    raw: string
  ): { fromId: KanbanColumnId; taskId: string } | null => {
    const [fromId, taskId] = raw.split('::')
    if (
      (fromId === 'todo' || fromId === 'in-progress' || fromId === 'done') &&
      typeof taskId === 'string' &&
      taskId.length > 0
    ) {
      return { fromId, taskId }
    }
    return null
  }

  const getActivePayload = (raw: string): { fromId: KanbanColumnId; taskId: string } | null => {
    return parseDragPayload(raw) ?? dragPayload
  }

  const assignToolToTask = async (
    columnId: KanbanColumnId,
    taskId: string,
    toolSlug: string
  ) => {
    updateTask(columnId, taskId, { toolSlug: toolSlug || undefined })
    if (!projectId || !toolSlug) return
    try {
      const added = await addToolToProject(projectId, toolSlug)
      if (added) {
        window.dispatchEvent(new CustomEvent('forgelab-reload-project-tools'))
      }
    } catch (error) {
      console.error('Kunne ikke tilføje værktøj fra Kanban:', error)
    }
  }

  return (
    <ToolLayout
      title="Kanban Board"
      description="Planlæg og flyt opgaver visuelt gennem workflowet."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {data.columns.map((column) => (
          <section key={column.id} className="rounded-2xl border border-amber-200/70 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                {column.title}
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                  {column.tasks.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => addTask(column.id)}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
              >
                + Opgave
              </button>
            </div>

            <div
              data-drop-col={column.id}
              className={`space-y-3 min-h-24 rounded-xl ${
                dropTarget?.toId === column.id && typeof dropTarget.index !== 'number'
                  ? 'ring-2 ring-amber-300/80 ring-offset-2'
                  : ''
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                setDropTarget({ toId: column.id })
              }}
              onDrop={(e) => {
                e.preventDefault()
                const payload = getActivePayload(e.dataTransfer.getData('text/plain'))
                if (!payload) return
                moveTask(payload.fromId, payload.taskId, column.id)
                setDropTarget(null)
                setDraggingTaskId(null)
                setDragPayload(null)
              }}
            >
              {column.tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-800">
                  Ingen opgaver endnu.
                </div>
              ) : null}

              {column.tasks.map((task, taskIndex) => (
                <article
                  key={task.id}
                  data-drop-col={column.id}
                  data-drop-index={taskIndex}
                  onDragOver={(e) => {
                    e.preventDefault()
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    const isBottomHalf = e.clientY > rect.top + rect.height / 2
                    const insertIndex = isBottomHalf ? taskIndex + 1 : taskIndex
                    if (dropTarget?.toId !== column.id || dropTarget.index !== insertIndex) {
                      setDropTarget({ toId: column.id, index: insertIndex })
                    }
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault()
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    const isBottomHalf = e.clientY > rect.top + rect.height / 2
                    setDropTarget({ toId: column.id, index: isBottomHalf ? taskIndex + 1 : taskIndex })
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const payload = getActivePayload(e.dataTransfer.getData('text/plain'))
                    if (!payload) return
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    const isBottomHalf = e.clientY > rect.top + rect.height / 2
                    const insertIndex = isBottomHalf ? taskIndex + 1 : taskIndex
                    moveTask(payload.fromId, payload.taskId, column.id, insertIndex)
                    setDropTarget(null)
                    setDraggingTaskId(null)
                    setDragPayload(null)
                  }}
                  className={`rounded-xl border p-3 ${
                    draggingTaskId === task.id
                      ? 'border-amber-300 bg-amber-50/80 opacity-70'
                      : dropTarget?.toId === column.id && dropTarget.index === taskIndex
                        ? 'border-amber-300 bg-amber-50/60'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {dropTarget?.toId === column.id && dropTarget.index === taskIndex ? (
                    <div className="mb-2 h-1 w-full rounded-full bg-amber-400/90" />
                  ) : null}
                  <div
                    draggable
                    onDragStart={(e) => {
                      setDraggingTaskId(task.id)
                      const payload = { fromId: column.id, taskId: task.id }
                      setDragPayload(payload)
                      e.dataTransfer.clearData()
                      e.dataTransfer.setData('text/plain', `${payload.fromId}::${payload.taskId}`)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragEnd={() => {
                      setDropTarget(null)
                      setDraggingTaskId(null)
                      setDragPayload(null)
                    }}
                    className="mb-2 cursor-grab select-none rounded-md bg-amber-100/70 px-2 py-1 text-[11px] font-medium text-amber-900 active:cursor-grabbing"
                  >
                    Træk kort (hold her)
                  </div>
                  <input
                    suppressHydrationWarning
                    value={task.title}
                    onChange={(e) => updateTask(column.id, task.id, { title: e.target.value })}
                    placeholder="Opgavetitel"
                    className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <textarea
                    suppressHydrationWarning
                    value={task.description}
                    onChange={(e) => updateTask(column.id, task.id, { description: e.target.value })}
                    placeholder="Beskrivelse (valgfri)"
                    rows={3}
                    className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />

                  <div className="mb-2">
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Værktøj
                    </label>
                    <select
                      value={task.toolSlug || ''}
                      onChange={(e) => {
                        void assignToolToTask(column.id, task.id, e.target.value)
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    >
                      <option value="">Ikke valgt</option>
                      {toolOptions.map((tool) => (
                        <option key={tool.slug} value={tool.slug}>
                          {tool.title}
                        </option>
                      ))}
                    </select>
                    {isInProject ? (
                      <p className="mt-1 text-[11px] text-gray-500">
                        Når du vælger et værktøj, bliver det automatisk tilføjet til projektets Board.
                      </p>
                    ) : null}
                  </div>

                  {isInProject ? (
                    <div className="mb-2">
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Ansvarlig
                      </label>
                      <select
                        value={task.assigneeUserId || ''}
                        onChange={(e) => {
                          const userId = e.target.value
                          const selected = memberOptions.find((m) => m.id === userId)
                          updateTask(column.id, task.id, {
                            assigneeUserId: userId || undefined,
                            assigneeName: userId ? selected?.label || '' : undefined,
                          })
                        }}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      >
                        <option value="">Ikke tildelt</option>
                        {memberOptions.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Ansvarlig
                      </label>
                      <input
                        value={task.assigneeName || ''}
                        onChange={(e) =>
                          updateTask(column.id, task.id, {
                            assigneeUserId: undefined,
                            assigneeName: e.target.value,
                          })
                        }
                        placeholder="Navn på ansvarlig"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => removeTask(column.id, task.id)}
                      className="rounded-lg border border-red-200 px-2 py-2 text-xs text-red-600 hover:bg-red-50"
                    >
                      Slet
                    </button>
                  </div>
                  {dropTarget?.toId === column.id && dropTarget.index === taskIndex + 1 ? (
                    <div className="mt-2 h-1 w-full rounded-full bg-amber-400/90" />
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ToolLayout>
  )
}
