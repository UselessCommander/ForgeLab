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

const COLUMN_ACCENT: Record<KanbanColumnId, { dot: string; badge: string; badgeText: string; ring: string }> = {
  'todo':        { dot: '#94A3B8', badge: '#F1F5F9', badgeText: '#475569', ring: '#CBD5E1' },
  'in-progress': { dot: '#F59E0B', badge: '#FEF3C7', badgeText: '#92400E', ring: '#FCD34D' },
  'done':        { dot: '#10B981', badge: '#D1FAE5', badgeText: '#065F46', ring: '#6EE7B7' },
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

  return (
    <ToolLayout
      title="Kanban"
      description="Planlæg og flyt opgaver visuelt gennem workflowet."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {data.columns.map((column) => {
          const accent = COLUMN_ACCENT[column.id]
          return (
            <section
              key={column.id}
              style={{
                background: '#FAFAFA',
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent.dot, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>{column.title}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, background: accent.badge, color: accent.badgeText, borderRadius: 999, padding: '1px 7px' }}>
                    {column.tasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { addTask(column.id); setExpandedTaskId('__new__') }}
                  style={{
                    border: 'none', borderRadius: 8, background: 'transparent',
                    color: '#6B7280', fontSize: 20, lineHeight: 1, cursor: 'pointer',
                    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  title="Tilføj opgave"
                >
                  +
                </button>
              </div>

              {/* Drop zone */}
              <div
                data-drop-col={column.id}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 6, minHeight: 48,
                  borderRadius: 10,
                  outline: dropTarget?.toId === column.id && typeof dropTarget.index !== 'number'
                    ? `2px solid ${accent.ring}` : 'none',
                  outlineOffset: 2,
                }}
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
                  <div style={{ borderRadius: 10, border: '1.5px dashed #E5E7EB', padding: '12px 10px', textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
                    Ingen opgaver endnu
                  </div>
                )}

                {column.tasks.map((task, taskIndex) => {
                  const isExpanded = expandedTaskId === task.id
                  const isDragging = draggingTaskId === task.id
                  const isDropBefore = dropTarget?.toId === column.id && dropTarget.index === taskIndex
                  const isDropAfter = dropTarget?.toId === column.id && dropTarget.index === taskIndex + 1
                  const assigneeLabel = task.assigneeName || (task.assigneeUserId ? memberOptions.find(m => m.id === task.assigneeUserId)?.label : null)
                  const toolLabel = task.toolSlug ? toolOptions.find(t => t.slug === task.toolSlug)?.title : null

                  return (
                    <div key={task.id}>
                      {isDropBefore && <div style={{ height: 3, borderRadius: 99, background: accent.ring, margin: '0 4px' }} />}

                      <article
                        data-drop-col={column.id}
                        data-drop-index={taskIndex}
                        onDragOver={(e) => {
                          e.preventDefault()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          const insertIndex = e.clientY > rect.top + rect.height / 2 ? taskIndex + 1 : taskIndex
                          if (dropTarget?.toId !== column.id || dropTarget.index !== insertIndex) {
                            setDropTarget({ toId: column.id, index: insertIndex })
                          }
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
                          moveTask(payload.fromId, payload.taskId, column.id, e.clientY > rect.top + rect.height / 2 ? taskIndex + 1 : taskIndex)
                          setDropTarget(null); setDraggingTaskId(null); setDragPayload(null)
                        }}
                        style={{
                          background: isDragging ? '#F9FAFB' : '#fff',
                          border: `1px solid ${isExpanded ? accent.ring : '#E5E7EB'}`,
                          borderRadius: 12,
                          overflow: 'hidden',
                          opacity: isDragging ? 0.5 : 1,
                          boxShadow: isExpanded ? `0 0 0 3px ${accent.ring}30` : '0 1px 3px rgba(0,0,0,0.05)',
                          transition: 'box-shadow 0.15s, border-color 0.15s',
                        }}
                      >
                        {/* Collapsed row — drag handle + title + meta */}
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 0, minHeight: 44 }}
                        >
                          {/* Drag handle */}
                          <div
                            draggable
                            onDragStart={(e) => {
                              setDraggingTaskId(task.id)
                              const p = { fromId: column.id, taskId: task.id }
                              setDragPayload(p)
                              e.dataTransfer.clearData()
                              e.dataTransfer.setData('text/plain', `${p.fromId}::${p.taskId}`)
                              e.dataTransfer.effectAllowed = 'move'
                            }}
                            onDragEnd={() => { setDropTarget(null); setDraggingTaskId(null); setDragPayload(null) }}
                            style={{
                              padding: '0 8px 0 10px', cursor: 'grab', color: '#D1D5DB',
                              display: 'flex', alignItems: 'center', alignSelf: 'stretch',
                              flexShrink: 0, userSelect: 'none',
                            }}
                            title="Træk for at flytte"
                          >
                            <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
                              <circle cx="3" cy="3" r="1.5"/><circle cx="7" cy="3" r="1.5"/>
                              <circle cx="3" cy="8" r="1.5"/><circle cx="7" cy="8" r="1.5"/>
                              <circle cx="3" cy="13" r="1.5"/><circle cx="7" cy="13" r="1.5"/>
                            </svg>
                          </div>

                          {/* Title — click to expand */}
                          <div
                            style={{ flex: 1, cursor: 'pointer', padding: '10px 6px 10px 0', minWidth: 0 }}
                            onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          >
                            {isExpanded ? (
                              <input
                                suppressHydrationWarning
                                autoFocus
                                value={task.title}
                                onChange={(e) => updateTask(column.id, task.id, { title: e.target.value })}
                                onKeyDown={(e) => deleteEmptyFieldRow(e, task.title, true, () => removeTask(column.id, task.id))}
                                placeholder="Opgavetitel"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  width: '100%', border: 'none', outline: 'none',
                                  fontSize: 13, fontWeight: 600, color: '#111827',
                                  background: 'transparent', padding: 0,
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: 13, fontWeight: 600, color: task.title ? '#111827' : '#9CA3AF', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {task.title || 'Opgavetitel'}
                              </span>
                            )}
                            {/* Meta chips — only when collapsed */}
                            {!isExpanded && (assigneeLabel || toolLabel) && (
                              <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                                {assigneeLabel && (
                                  <span style={{ fontSize: 10, background: '#F3F4F6', color: '#6B7280', borderRadius: 6, padding: '1px 6px', fontWeight: 500 }}>
                                    {assigneeLabel}
                                  </span>
                                )}
                                {toolLabel && (
                                  <span style={{ fontSize: 10, background: accent.badge, color: accent.badgeText, borderRadius: 6, padding: '1px 6px', fontWeight: 500 }}>
                                    {toolLabel}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Expand chevron + delete */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingRight: 8, flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6, transition: 'color 0.1s' }}
                              title={isExpanded ? 'Luk' : 'Rediger'}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                {isExpanded
                                  ? <><polyline points="18 15 12 9 6 15" /></>
                                  : <><polyline points="6 9 12 15 18 9" /></>
                                }
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => { removeTask(column.id, task.id); if (isExpanded) setExpandedTaskId(null) }}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6, transition: 'color 0.1s' }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                              onMouseLeave={e => (e.currentTarget.style.color = '#D1D5DB')}
                              title="Slet opgave"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Expanded detail panel */}
                        {isExpanded && (
                          <div style={{ borderTop: '1px solid #F3F4F6', padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <textarea
                              suppressHydrationWarning
                              value={task.description}
                              onChange={(e) => updateTask(column.id, task.id, { description: e.target.value })}
                              placeholder="Beskrivelse (valgfri)"
                              rows={2}
                              style={{
                                width: '100%', boxSizing: 'border-box', resize: 'vertical',
                                border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 10px',
                                fontSize: 12, color: '#374151', outline: 'none', fontFamily: 'inherit',
                                background: '#FAFAFA', lineHeight: 1.5,
                              }}
                              onFocus={e => (e.currentTarget.style.borderColor = accent.ring)}
                              onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                            />

                            <div>
                              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Værktøj</label>
                              <select
                                value={task.toolSlug || ''}
                                onChange={(e) => { void assignToolToTask(column.id, task.id, e.target.value) }}
                                style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 10px', fontSize: 12, background: '#fff', color: '#374151', outline: 'none' }}
                                onFocus={e => (e.currentTarget.style.borderColor = accent.ring)}
                                onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                              >
                                <option value="">Ingen</option>
                                {toolOptions.map((tool) => (
                                  <option key={tool.slug} value={tool.slug}>{tool.title}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Ansvarlig</label>
                              {isInProject ? (
                                <select
                                  value={task.assigneeUserId || ''}
                                  onChange={(e) => {
                                    const userId = e.target.value
                                    const selected = memberOptions.find((m) => m.id === userId)
                                    updateTask(column.id, task.id, { assigneeUserId: userId || undefined, assigneeName: userId ? selected?.label || '' : undefined })
                                  }}
                                  style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 10px', fontSize: 12, background: '#fff', color: '#374151', outline: 'none' }}
                                  onFocus={e => (e.currentTarget.style.borderColor = accent.ring)}
                                  onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
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
                                  style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 10px', fontSize: 12, background: '#fff', color: '#374151', outline: 'none' }}
                                  onFocus={e => (e.currentTarget.style.borderColor = accent.ring)}
                                  onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </article>

                      {isDropAfter && <div style={{ height: 3, borderRadius: 99, background: accent.ring, margin: '0 4px' }} />}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </ToolLayout>
  )
}
