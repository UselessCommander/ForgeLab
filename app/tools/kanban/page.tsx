'use client'

import { useEffect, useMemo, useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { deleteEmptyFieldRow } from '@/lib/deleteRowKeyboard'
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
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
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

  const COLUMN_ACCENT: Record<KanbanColumnId, { dot: string; badge: string; badgeText: string; ring: string }> = {
    'todo':        { dot: '#94A3B8', badge: '#F1F5F9', badgeText: '#475569', ring: '#CBD5E1' },
    'in-progress': { dot: '#F59E0B', badge: '#FFFBEB', badgeText: '#92400E', ring: '#FCD34D' },
    'done':        { dot: '#10B981', badge: '#ECFDF5', badgeText: '#065F46', ring: '#6EE7B7' },
  }

  return (
    <ToolLayout
      title="Kanban"
      description="Planlæg og flyt opgaver visuelt gennem workflowet."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>
        {data.columns.map((column) => {
          const accent = COLUMN_ACCENT[column.id]
          return (
            <div
              key={column.id}
              style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #F1F5F9',
                boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
                overflow: 'hidden',
              }}
            >
              {/* Column header */}
              <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent.dot, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>{column.title}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, background: accent.badge, color: accent.badgeText, borderRadius: 999, padding: '1px 7px' }}>
                    {column.tasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { addTask(column.id); setExpandedTaskId('__new__' + column.id) }}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 20, lineHeight: 1, padding: '0 2px', display: 'flex', alignItems: 'center' }}
                  title="Tilføj opgave"
                >
                  +
                </button>
              </div>

              {/* Tasks */}
              <div
                data-drop-col={column.id}
                style={{ padding: '10px 10px 10px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 60 }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                onDragEnter={(e) => { e.preventDefault(); setDropTarget({ toId: column.id }) }}
                onDrop={(e) => {
                  e.preventDefault()
                  const payload = getActivePayload(e.dataTransfer.getData('text/plain'))
                  if (!payload) return
                  moveTask(payload.fromId, payload.taskId, column.id)
                  setDropTarget(null); setDraggingTaskId(null); setDragPayload(null)
                }}
              >
                {column.tasks.length === 0 && (
                  <div style={{ borderRadius: 10, border: '1.5px dashed #E2E8F0', padding: '14px 12px', textAlign: 'center', fontSize: 12, color: '#CBD5E1' }}>
                    Ingen opgaver endnu
                  </div>
                )}

                {column.tasks.map((task, taskIndex) => {
                  const isExpanded = expandedTaskId === task.id
                  const isDragging = draggingTaskId === task.id
                  const isDropHere = dropTarget?.toId === column.id && dropTarget.index === taskIndex
                  const toolLabel = toolOptions.find(t => t.slug === task.toolSlug)?.title
                  const assigneeLabel = isInProject
                    ? memberOptions.find(m => m.id === task.assigneeUserId)?.label
                    : task.assigneeName

                  return (
                    <div key={task.id}>
                      {isDropHere && <div style={{ height: 3, borderRadius: 999, background: accent.ring, marginBottom: 4 }} />}

                      <div
                        data-drop-col={column.id}
                        data-drop-index={taskIndex}
                        onDragOver={(e) => {
                          e.preventDefault()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          const insertIndex = e.clientY > rect.top + rect.height / 2 ? taskIndex + 1 : taskIndex
                          if (dropTarget?.toId !== column.id || dropTarget.index !== insertIndex) setDropTarget({ toId: column.id, index: insertIndex })
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          setDropTarget({ toId: column.id, index: e.clientY > rect.top + rect.height / 2 ? taskIndex + 1 : taskIndex })
                        }}
                        onDrop={(e) => {
                          e.preventDefault(); e.stopPropagation()
                          const payload = getActivePayload(e.dataTransfer.getData('text/plain'))
                          if (!payload) return
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          const insertIndex = e.clientY > rect.top + rect.height / 2 ? taskIndex + 1 : taskIndex
                          moveTask(payload.fromId, payload.taskId, column.id, insertIndex)
                          setDropTarget(null); setDraggingTaskId(null); setDragPayload(null)
                        }}
                        style={{
                          borderRadius: 10,
                          border: `1px solid ${isExpanded ? accent.ring : isDragging ? accent.ring : '#F1F5F9'}`,
                          background: isDragging ? '#F8FAFC' : '#FAFAFA',
                          opacity: isDragging ? 0.5 : 1,
                          transition: 'border-color 0.15s, box-shadow 0.15s',
                          boxShadow: isExpanded ? `0 0 0 3px ${accent.ring}40` : 'none',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Collapsed row */}
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 10px', cursor: 'pointer' }}
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        >
                          {/* Drag handle */}
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation()
                              setDraggingTaskId(task.id)
                              const p = { fromId: column.id, taskId: task.id }
                              setDragPayload(p)
                              e.dataTransfer.clearData()
                              e.dataTransfer.setData('text/plain', `${p.fromId}::${p.taskId}`)
                              e.dataTransfer.effectAllowed = 'move'
                            }}
                            onDragEnd={() => { setDropTarget(null); setDraggingTaskId(null); setDragPayload(null) }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'grab', color: '#CBD5E1', flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 2px' }}
                            title="Træk for at flytte"
                          >
                            <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
                              <circle cx="3.5" cy="2.5" r="1.5"/><circle cx="8.5" cy="2.5" r="1.5"/>
                              <circle cx="3.5" cy="7" r="1.5"/><circle cx="8.5" cy="7" r="1.5"/>
                              <circle cx="3.5" cy="11.5" r="1.5"/><circle cx="8.5" cy="11.5" r="1.5"/>
                            </svg>
                          </div>

                          {/* Title */}
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: task.title ? '#0F172A' : '#CBD5E1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.title || 'Ny opgave'}
                          </span>

                          {/* Badges */}
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                            {toolLabel && (
                              <span style={{ fontSize: 10, background: '#EFF6FF', color: '#1D4ED8', borderRadius: 6, padding: '2px 6px', fontWeight: 600, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {toolLabel}
                              </span>
                            )}
                            {assigneeLabel && (
                              <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#E0E7FF', color: '#4338CA', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {assigneeLabel.charAt(0).toUpperCase()}
                              </span>
                            )}
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#CBD5E1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                              <polyline points="2 4 6 8 10 4" />
                            </svg>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div style={{ padding: '0 10px 12px', borderTop: '1px solid #F1F5F9' }}>
                            <input
                              suppressHydrationWarning
                              autoFocus
                              value={task.title}
                              onChange={(e) => updateTask(column.id, task.id, { title: e.target.value })}
                              onKeyDown={(e) => deleteEmptyFieldRow(e, task.title, true, () => { removeTask(column.id, task.id); setExpandedTaskId(null) })}
                              placeholder="Opgavetitel"
                              style={{ width: '100%', boxSizing: 'border-box', marginTop: 10, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, outline: 'none', background: '#fff' }}
                              onFocus={e => e.currentTarget.style.borderColor = accent.ring}
                              onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                            />
                            <textarea
                              suppressHydrationWarning
                              value={task.description}
                              onChange={(e) => updateTask(column.id, task.id, { description: e.target.value })}
                              placeholder="Beskrivelse (valgfri)"
                              rows={3}
                              style={{ width: '100%', boxSizing: 'border-box', marginTop: 6, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, outline: 'none', background: '#fff', resize: 'vertical', fontFamily: 'inherit', color: '#374151' }}
                              onFocus={e => e.currentTarget.style.borderColor = accent.ring}
                              onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                            />

                            <div style={{ marginTop: 8 }}>
                              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 4 }}>Værktøj</label>
                              <select
                                value={task.toolSlug || ''}
                                onChange={(e) => { void assignToolToTask(column.id, task.id, e.target.value) }}
                                style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, background: '#fff', outline: 'none', color: '#374151' }}
                              >
                                <option value="">Ikke valgt</option>
                                {toolOptions.map((tool) => (
                                  <option key={tool.slug} value={tool.slug}>{tool.title}</option>
                                ))}
                              </select>
                            </div>

                            <div style={{ marginTop: 8 }}>
                              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 4 }}>Ansvarlig</label>
                              {isInProject ? (
                                <select
                                  value={task.assigneeUserId || ''}
                                  onChange={(e) => {
                                    const userId = e.target.value
                                    const selected = memberOptions.find((m) => m.id === userId)
                                    updateTask(column.id, task.id, { assigneeUserId: userId || undefined, assigneeName: userId ? selected?.label || '' : undefined })
                                  }}
                                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, background: '#fff', outline: 'none', color: '#374151' }}
                                >
                                  <option value="">Ikke tildelt</option>
                                  {memberOptions.map((m) => (
                                    <option key={m.id} value={m.id}>{m.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  value={task.assigneeName || ''}
                                  onChange={(e) => updateTask(column.id, task.id, { assigneeUserId: undefined, assigneeName: e.target.value })}
                                  placeholder="Navn på ansvarlig"
                                  style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 12, background: '#fff', outline: 'none', color: '#374151', fontFamily: 'inherit' }}
                                  onFocus={e => e.currentTarget.style.borderColor = accent.ring}
                                  onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                                />
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => { removeTask(column.id, task.id); setExpandedTaskId(null) }}
                              style={{ marginTop: 12, border: 'none', background: 'none', color: '#FDA4AF', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                            >
                              Slet opgave
                            </button>
                          </div>
                        )}
                      </div>

                      {dropTarget?.toId === column.id && dropTarget.index === taskIndex + 1 && (
                        <div style={{ height: 3, borderRadius: 999, background: accent.ring, marginTop: 4 }} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Add task footer */}
              <div style={{ padding: '8px 10px 12px' }}>
                <button
                  type="button"
                  onClick={() => addTask(column.id)}
                  style={{ width: '100%', border: '1.5px dashed #E2E8F0', borderRadius: 10, background: 'none', color: '#94A3B8', fontSize: 12, fontWeight: 600, padding: '8px 0', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = accent.ring; (e.currentTarget as HTMLButtonElement).style.color = accent.badgeText }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8' }}
                >
                  + Ny opgave
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToolLayout>
  )
}
