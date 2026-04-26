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
  labels?: string[]
  dueDate?: string
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
    { id: 'todo',        title: 'To do',   tasks: [{ id: createId(), title: 'Definér næste sprintmål',       description: '', labels: [], dueDate: '' }] },
    { id: 'in-progress', title: 'I gang',  tasks: [{ id: createId(), title: 'Lav wireframe til onboarding',  description: '', labels: [], dueDate: '' }] },
    { id: 'done',        title: 'Færdig',  tasks: [{ id: createId(), title: 'Kickoff afholdt',               description: '', labels: [], dueDate: '' }] },
  ],
}

const COL: Record<KanbanColumnId, { dot: string; pill: string; pillTxt: string; border: string }> = {
  'todo':        { dot: '#94A3B8', pill: '#F1F5F9', pillTxt: '#64748B', border: '#E2E8F0' },
  'in-progress': { dot: '#F59E0B', pill: '#FEF3C7', pillTxt: '#92400E', border: '#FCD34D' },
  'done':        { dot: '#10B981', pill: '#D1FAE5', pillTxt: '#065F46', border: '#6EE7B7' },
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  border: '1px solid #E5E7EB', borderRadius: 10, padding: '9px 12px',
  fontSize: 13, color: '#1F2937', background: '#fff',
  outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
  transition: 'border-color 0.15s',
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 5px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {children}
    </p>
  )
}

export default function KanbanPage() {
  const [data, setData] = useState<KanbanData>(DEFAULT_DATA)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragPayload, setDragPayload] = useState<{ fromId: KanbanColumnId; taskId: string } | null>(null)
  const [dropTarget, setDropTarget] = useState<{ toId: KanbanColumnId; index?: number } | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [toolSearch, setToolSearch] = useState('')
  const [toolDropOpen, setToolDropOpen] = useState(false)
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
              tasks: [...col.tasks, { id: createId(), title: '', description: '', labels: [], dueDate: '' }],
            }
          : col
      ),
    }))
  }

  const updateTask = (
    columnId: KanbanColumnId,
    taskId: string,
    patch: Partial<Pick<KanbanTask, 'title' | 'description' | 'assigneeUserId' | 'assigneeName' | 'toolSlug' | 'labels' | 'dueDate'>>
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

  // Find task + column for slide-over
  const expandedCol = expandedTaskId ? data.columns.find(c => c.tasks.some(t => t.id === expandedTaskId)) ?? null : null
  const expandedTask = expandedCol ? expandedCol.tasks.find(t => t.id === expandedTaskId) ?? null : null

  return (
    <ToolLayout
      title="Kanban"
      description="Planlæg og flyt opgaver visuelt."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      {/* Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {data.columns.map((column) => {
          const c = COL[column.id]
          return (
            <section key={column.id} style={{ background: '#F8F9FA', borderRadius: 14, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '0.01em' }}>{column.title}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, background: c.pill, color: c.pillTxt, borderRadius: 99, padding: '1px 6px' }}>{column.tasks.length}</span>
                </div>
                <button
                  type="button"
                  onClick={() => addTask(column.id)}
                  title="Tilføj opgave"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, lineHeight: 1, padding: '2px 4px', borderRadius: 6 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#374151')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
                >+</button>
              </div>

              {/* Task list drop zone */}
              <div
                data-drop-col={column.id}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 5, minHeight: 40, borderRadius: 8,
                  outline: dropTarget?.toId === column.id && typeof dropTarget.index !== 'number' ? `2px dashed ${c.border}` : 'none',
                  outlineOffset: 2,
                }}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                onDragEnter={e => { e.preventDefault(); setDropTarget({ toId: column.id }) }}
                onDrop={e => {
                  e.preventDefault()
                  const payload = getActivePayload(e.dataTransfer.getData('text/plain'))
                  if (!payload) return
                  moveTask(payload.fromId, payload.taskId, column.id)
                  setDropTarget(null); setDraggingTaskId(null); setDragPayload(null)
                }}
              >
                {column.tasks.length === 0 && (
                  <div style={{ borderRadius: 8, border: '1.5px dashed #E5E7EB', padding: '10px', textAlign: 'center', fontSize: 12, color: '#C4C9D4' }}>
                    Ingen opgaver
                  </div>
                )}
                {column.tasks.map((task, taskIndex) => {
                  const isDragging = draggingTaskId === task.id
                  const isDropBefore = dropTarget?.toId === column.id && dropTarget.index === taskIndex
                  const isDropAfter  = dropTarget?.toId === column.id && dropTarget.index === taskIndex + 1
                  const assigneeLabel = task.assigneeName || (task.assigneeUserId ? memberOptions.find(m => m.id === task.assigneeUserId)?.label : null)
                  const toolLabel = task.toolSlug ? toolOptions.find(t => t.slug === task.toolSlug)?.title : null
                  const LABEL_COLORS: Record<string, string> = { red: '#EF4444', orange: '#F97316', yellow: '#EAB308', green: '#22C55E', blue: '#3B82F6', purple: '#A855F7' }
                  const taskLabels = task.labels || []
                  const overdue = task.dueDate && new Date(task.dueDate) < new Date()

                  return (
                    <div key={task.id}>
                      {isDropBefore && <div style={{ height: 2, borderRadius: 99, background: c.border, margin: '0 2px' }} />}
                      <article
                        data-drop-col={column.id}
                        data-drop-index={taskIndex}
                        onDragOver={e => {
                          e.preventDefault()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          const idx = e.clientY > rect.top + rect.height / 2 ? taskIndex + 1 : taskIndex
                          if (dropTarget?.toId !== column.id || dropTarget.index !== idx) setDropTarget({ toId: column.id, index: idx })
                        }}
                        onDragEnter={e => {
                          e.preventDefault()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          setDropTarget({ toId: column.id, index: e.clientY > rect.top + rect.height / 2 ? taskIndex + 1 : taskIndex })
                        }}
                        onDrop={e => {
                          e.preventDefault(); e.stopPropagation()
                          const payload = getActivePayload(e.dataTransfer.getData('text/plain'))
                          if (!payload) return
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          moveTask(payload.fromId, payload.taskId, column.id, e.clientY > rect.top + rect.height / 2 ? taskIndex + 1 : taskIndex)
                          setDropTarget(null); setDraggingTaskId(null); setDragPayload(null)
                        }}
                        style={{
                          background: isDragging ? '#F3F4F6' : '#fff',
                          border: '1px solid #EBEBEB',
                          borderRadius: 10,
                          opacity: isDragging ? 0.45 : 1,
                          cursor: 'pointer',
                          transition: 'box-shadow 0.12s',
                          overflow: 'hidden',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
                          {/* Drag grip */}
                          <div
                            draggable
                            onDragStart={e => {
                              setDraggingTaskId(task.id)
                              const p = { fromId: column.id, taskId: task.id }
                              setDragPayload(p)
                              e.dataTransfer.clearData()
                              e.dataTransfer.setData('text/plain', `${p.fromId}::${p.taskId}`)
                              e.dataTransfer.effectAllowed = 'move'
                            }}
                            onDragEnd={() => { setDropTarget(null); setDraggingTaskId(null); setDragPayload(null) }}
                            style={{ padding: '0 8px 0 10px', cursor: 'grab', color: '#D1D5DB', display: 'flex', alignItems: 'center', alignSelf: 'stretch', flexShrink: 0, userSelect: 'none' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
                              <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
                              <circle cx="2" cy="7" r="1.2"/><circle cx="6" cy="7" r="1.2"/>
                              <circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/>
                            </svg>
                          </div>

                          {/* Title + chips */}
                          <div
                            style={{ flex: 1, padding: '9px 6px 9px 0', minWidth: 0 }}
                            onClick={() => setExpandedTaskId(task.id)}
                          >
                            <span style={{ fontSize: 13, fontWeight: 500, color: task.title ? '#111827' : '#9CA3AF', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {task.title || 'Opgave'}
                            </span>
                            {(assigneeLabel || toolLabel || taskLabels.length > 0 || task.dueDate) && (
                              <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                {taskLabels.map(l => <span key={l} style={{ width: 8, height: 8, borderRadius: '50%', background: LABEL_COLORS[l] ?? '#94A3B8', flexShrink: 0, display: 'inline-block' }} />)}
                                {assigneeLabel && <span style={{ fontSize: 10, background: '#F3F4F6', color: '#6B7280', borderRadius: 5, padding: '1px 5px' }}>{assigneeLabel}</span>}
                                {task.dueDate  && <span style={{ fontSize: 10, background: overdue ? '#FEF2F2' : '#F3F4F6', color: overdue ? '#DC2626' : '#6B7280', borderRadius: 5, padding: '1px 5px' }}>📅 {new Date(task.dueDate).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                      {isDropAfter && <div style={{ height: 2, borderRadius: 99, background: c.border, margin: '0 2px' }} />}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* Centered modal */}
      {expandedTask && expandedCol && (() => {
        const ac = COL[expandedCol.id]
        const labelOptions: { id: string; color: string; label: string }[] = [
          { id: 'red',    color: '#EF4444', label: 'Vigtig' },
          { id: 'orange', color: '#F97316', label: 'Design' },
          { id: 'yellow', color: '#EAB308', label: 'Udvikling' },
          { id: 'green',  color: '#22C55E', label: 'Research' },
          { id: 'blue',   color: '#3B82F6', label: 'Feedback' },
          { id: 'purple', color: '#A855F7', label: 'Bug' },
        ]
        const taskLabels = expandedTask.labels || []
        const toggleLabel = (id: string) => {
          const next = taskLabels.includes(id) ? taskLabels.filter(x => x !== id) : [...taskLabels, id]
          updateTask(expandedCol.id, expandedTask.id, { labels: next })
        }
        return (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setExpandedTaskId(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40, backdropFilter: 'blur(2px)' }}
            />
            {/* Modal */}
            <div style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%', maxWidth: 560,
              maxHeight: '90vh', overflowY: 'auto',
              background: '#fff', borderRadius: 20,
              boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
              zIndex: 50, display: 'flex', flexDirection: 'column',
            }}>
              {/* Modal header */}
              <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: ac.dot, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{expandedCol.title}</span>
                  <button
                    type="button"
                    onClick={() => setExpandedTaskId(null)}
                    style={{ marginLeft: 'auto', border: 'none', background: '#F3F4F6', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', flexShrink: 0 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <input
                  suppressHydrationWarning
                  autoFocus
                  value={expandedTask.title}
                  onChange={e => updateTask(expandedCol.id, expandedTask.id, { title: e.target.value })}
                  onKeyDown={e => deleteEmptyFieldRow(e, expandedTask.title, true, () => { removeTask(expandedCol.id, expandedTask.id); setExpandedTaskId(null) })}
                  placeholder="Opgavetitel"
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 19, fontWeight: 700, color: '#111827', background: 'transparent', padding: 0, fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              {/* Modal body */}
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Description */}
                <div>
                  <FieldLabel>Beskrivelse</FieldLabel>
                  <textarea
                    suppressHydrationWarning
                    value={expandedTask.description}
                    onChange={e => updateTask(expandedCol.id, expandedTask.id, { description: e.target.value })}
                    placeholder="Tilføj beskrivelse…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', background: '#FAFAFA' }}
                    onFocus={e => (e.currentTarget.style.borderColor = ac.border)}
                    onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                  />
                </div>

                {/* Two-col row: Ansvarlig + Deadline */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <FieldLabel>Ansvarlig</FieldLabel>
                    {isInProject ? (
                      <select
                        value={expandedTask.assigneeUserId || ''}
                        onChange={e => {
                          const userId = e.target.value
                          const selected = memberOptions.find(m => m.id === userId)
                          updateTask(expandedCol.id, expandedTask.id, { assigneeUserId: userId || undefined, assigneeName: userId ? selected?.label || '' : undefined })
                        }}
                        style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = ac.border)}
                        onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                      >
                        <option value="">Ikke tildelt</option>
                        {memberOptions.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                      </select>
                    ) : (
                      <input
                        value={expandedTask.assigneeName || ''}
                        onChange={e => updateTask(expandedCol.id, expandedTask.id, { assigneeUserId: undefined, assigneeName: e.target.value })}
                        placeholder="Navn på ansvarlig"
                        style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = ac.border)}
                        onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                      />
                    )}
                  </div>
                  <div>
                    <FieldLabel>Deadline</FieldLabel>
                    <input
                      type="date"
                      value={expandedTask.dueDate || ''}
                      onChange={e => updateTask(expandedCol.id, expandedTask.id, { dueDate: e.target.value })}
                      style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = ac.border)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
                    />
                  </div>
                </div>

                {/* Labels — color circles */}
                <div>
                  <FieldLabel>Labels</FieldLabel>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {labelOptions.map(({ id, color, label }) => {
                      const active = taskLabels.includes(id)
                      return (
                        <button
                          key={id}
                          type="button"
                          title={label}
                          onClick={() => toggleLabel(id)}
                          style={{
                            width: active ? 26 : 22,
                            height: active ? 26 : 22,
                            borderRadius: '50%',
                            background: color,
                            border: active ? `3px solid ${color}` : '3px solid transparent',
                            outline: active ? `2px solid ${color}40` : 'none',
                            outlineOffset: 1,
                            cursor: 'pointer',
                            padding: 0,
                            boxShadow: active ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : 'none',
                            transition: 'all 0.12s',
                            flexShrink: 0,
                          }}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Værktøj — søgbar combobox */}
                <div style={{ position: 'relative' }}>
                  <FieldLabel>Værktøj</FieldLabel>
                  <div style={{ position: 'relative' }}>
                    <input
                      value={toolDropOpen ? toolSearch : (expandedTask.toolSlug ? (toolOptions.find(t => t.slug === expandedTask.toolSlug)?.title ?? '') : '')}
                      onChange={e => { setToolSearch(e.target.value); setToolDropOpen(true) }}
                      onFocus={() => { setToolSearch(''); setToolDropOpen(true) }}
                      onBlur={() => setTimeout(() => setToolDropOpen(false), 150)}
                      placeholder="Søg eller vælg værktøj…"
                      style={{ ...inputStyle, paddingRight: 32 }}
                    />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none', fontSize: 11 }}>▾</span>
                  </div>
                  {toolDropOpen && (() => {
                    const filtered = toolOptions.filter(t =>
                      !toolSearch || t.title.toLowerCase().includes(toolSearch.toLowerCase())
                    )
                    return (
                      <div style={{
                        position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 100,
                        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxHeight: 220, overflowY: 'auto',
                        marginTop: 4,
                      }}>
                        <div
                          onMouseDown={() => { void assignToolToTask(expandedCol.id, expandedTask.id, ''); setToolDropOpen(false); setToolSearch('') }}
                          style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: '#9CA3AF' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}
                        >Ingen</div>
                        {filtered.map(tool => (
                          <div
                            key={tool.slug}
                            onMouseDown={() => { void assignToolToTask(expandedCol.id, expandedTask.id, tool.slug); setToolDropOpen(false); setToolSearch('') }}
                            style={{
                              padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                              background: expandedTask.toolSlug === tool.slug ? ac.pill : '',
                              color: expandedTask.toolSlug === tool.slug ? ac.pillTxt : '#1F2937',
                              fontWeight: expandedTask.toolSlug === tool.slug ? 600 : 400,
                            }}
                            onMouseEnter={e => { if (expandedTask.toolSlug !== tool.slug) e.currentTarget.style.background = '#F9FAFB' }}
                            onMouseLeave={e => { if (expandedTask.toolSlug !== tool.slug) e.currentTarget.style.background = '' }}
                          >{tool.title}</div>
                        ))}
                        {filtered.length === 0 && (
                          <div style={{ padding: '8px 12px', fontSize: 13, color: '#9CA3AF' }}>Ingen resultater</div>
                        )}
                      </div>
                    )
                  })()}
                </div>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => { removeTask(expandedCol.id, expandedTask.id); setExpandedTaskId(null) }}
                  style={{ width: '100%', padding: '10px', border: 'none', borderRadius: 10, background: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#FEF2F2')}
                >
                  Slet opgave
                </button>
              </div>
            </div>
          </>
        )
      })()}
    </ToolLayout>
  )
}
