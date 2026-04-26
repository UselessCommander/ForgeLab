'use client'

import { useEffect, useMemo, useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { deleteEmptyFieldRow } from '@/lib/deleteRowKeyboard'
import { addToolToProject, getProjectMembers, type ProjectMember } from '@/lib/projects'
import { VAERKTOEJER } from '@/lib/vaerktoejer-data'

type KanbanColumnId = 'todo' | 'in-progress' | 'done'

type KanbanLabel = { id: string; text: string; color: string }
type ChecklistItem = { id: string; text: string; done: boolean }
type KanbanLink = { id: string; url: string; displayText: string }

type KanbanTask = {
  id: string
  title: string
  description: string
  assigneeUserId?: string
  assigneeName?: string
  toolSlug?: string
  labels?: KanbanLabel[]
  dueDate?: string
  startDate?: string
  checklist?: ChecklistItem[]
  links?: KanbanLink[]
}

const LABEL_COLORS = [
  { bg: '#166534', label: 'Grøn' },
  { bg: '#92400E', label: 'Gul' },
  { bg: '#9A3412', label: 'Orange' },
  { bg: '#991B1B', label: 'Rød' },
  { bg: '#6B21A8', label: 'Lilla' },
  { bg: '#1E40AF', label: 'Blå' },
  { bg: '#0F766E', label: 'Teal' },
  { bg: '#1F2937', label: 'Sort' },
]

const createSmallId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

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

  const [modalTask, setModalTask] = useState<{ task: KanbanTask; columnId: KanbanColumnId } | null>(null)
  const [labelPickerOpen, setLabelPickerOpen] = useState(false)
  const [linkInput, setLinkInput] = useState({ url: '', displayText: '' })
  const [linkPanelOpen, setLinkPanelOpen] = useState(false)
  const [newCheckItem, setNewCheckItem] = useState('')

  const openModal = (task: KanbanTask, columnId: KanbanColumnId) => {
    setModalTask({ task: { ...task }, columnId })
    setLabelPickerOpen(false)
    setLinkPanelOpen(false)
    setLinkInput({ url: '', displayText: '' })
    setNewCheckItem('')
  }

  const closeModal = () => setModalTask(null)

  const patchModal = (patch: Partial<KanbanTask>) => {
    if (!modalTask) return
    const updated = { ...modalTask.task, ...patch }
    setModalTask({ ...modalTask, task: updated })
    updateTask(modalTask.columnId, modalTask.task.id, patch)
  }

  const COLUMN_ACCENT: Record<KanbanColumnId, { dot: string; badge: string; badgeText: string; ring: string }> = {
    'todo':        { dot: '#94A3B8', badge: '#F1F5F9', badgeText: '#475569', ring: '#CBD5E1' },
    'in-progress': { dot: '#F59E0B', badge: '#FFFBEB', badgeText: '#92400E', ring: '#FCD34D' },
    'done':        { dot: '#10B981', badge: '#ECFDF5', badgeText: '#065F46', ring: '#6EE7B7' },
  }

  const S = {
    input: { width: '100%', boxSizing: 'border-box' as const, padding: '8px 11px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, outline: 'none', background: '#F9FAFB', color: '#0F172A', fontFamily: 'inherit' },
    label: { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 5 },
    section: { marginBottom: 18 },
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
            <div key={column.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #F1F5F9', boxShadow: '0 1px 4px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
              {/* Column header */}
              <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent.dot, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{column.title}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, background: accent.badge, color: accent.badgeText, borderRadius: 999, padding: '1px 7px' }}>{column.tasks.length}</span>
                </div>
                <button type="button" onClick={() => addTask(column.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 20, lineHeight: 1, padding: '0 2px' }} title="Tilføj opgave">+</button>
              </div>

              {/* Task list */}
              <div
                data-drop-col={column.id}
                style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 60 }}
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
                  <div style={{ borderRadius: 10, border: '1.5px dashed #E2E8F0', padding: '14px 12px', textAlign: 'center', fontSize: 12, color: '#CBD5E1' }}>Ingen opgaver endnu</div>
                )}
                {column.tasks.map((task, taskIndex) => {
                  const isDragging = draggingTaskId === task.id
                  const isDropHere = dropTarget?.toId === column.id && dropTarget.index === taskIndex
                  const toolLabel = toolOptions.find(t => t.slug === task.toolSlug)?.title
                  const assigneeLabel = isInProject ? memberOptions.find(m => m.id === task.assigneeUserId)?.label : task.assigneeName
                  const doneTasks = (task.checklist || []).filter(c => c.done).length
                  const totalTasks = (task.checklist || []).length
                  const overdue = task.dueDate && new Date(task.dueDate) < new Date()

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
                        style={{ borderRadius: 10, border: `1px solid ${isDragging ? accent.ring : '#F1F5F9'}`, background: isDragging ? '#F8FAFC' : '#FAFAFA', opacity: isDragging ? 0.5 : 1, cursor: 'pointer', overflow: 'hidden' }}
                        onClick={() => openModal(task, column.id)}
                      >
                        {/* Label strip */}
                        {(task.labels || []).length > 0 && (
                          <div style={{ display: 'flex', gap: 3, padding: '6px 10px 0', flexWrap: 'wrap' }}>
                            {(task.labels || []).map(lbl => (
                              <span key={lbl.id} style={{ height: 6, width: 36, borderRadius: 999, background: lbl.color, display: 'inline-block' }} title={lbl.text} />
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 10px' }}>
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
                            style={{ cursor: 'grab', color: '#CBD5E1', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                          >
                            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                              <circle cx="2.5" cy="2.5" r="1.5"/><circle cx="7.5" cy="2.5" r="1.5"/>
                              <circle cx="2.5" cy="7" r="1.5"/><circle cx="7.5" cy="7" r="1.5"/>
                              <circle cx="2.5" cy="11.5" r="1.5"/><circle cx="7.5" cy="11.5" r="1.5"/>
                            </svg>
                          </div>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: task.title ? '#0F172A' : '#CBD5E1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.title || 'Ny opgave'}
                          </span>
                          {assigneeLabel && (
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#E0E7FF', color: '#4338CA', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {assigneeLabel.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {/* Meta badges row */}
                        {(totalTasks > 0 || task.dueDate || toolLabel || (task.links || []).length > 0) && (
                          <div style={{ display: 'flex', gap: 5, padding: '0 10px 8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {task.dueDate && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, background: overdue ? '#FEF2F2' : '#F0FDF4', color: overdue ? '#DC2626' : '#16A34A', borderRadius: 6, padding: '2px 6px' }}>
                                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6" cy="6" r="5"/><path d="M6 3v3l2 1.5"/></svg>
                                {new Date(task.dueDate).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                            {totalTasks > 0 && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, background: '#F8FAFC', color: '#64748B', borderRadius: 6, padding: '2px 6px' }}>
                                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="1" width="10" height="10" rx="2"/><path d="M4 6l2 2 4-3"/></svg>
                                {doneTasks}/{totalTasks}
                              </span>
                            )}
                            {toolLabel && (
                              <span style={{ fontSize: 10, background: '#EFF6FF', color: '#1D4ED8', borderRadius: 6, padding: '2px 6px', fontWeight: 600, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toolLabel}</span>
                            )}
                            {(task.links || []).length > 0 && (
                              <span style={{ fontSize: 10, color: '#94A3B8' }}>🔗 {task.links!.length}</span>
                            )}
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
              <div style={{ padding: '6px 10px 12px' }}>
                <button
                  type="button"
                  onClick={() => addTask(column.id)}
                  style={{ width: '100%', border: '1.5px dashed #E2E8F0', borderRadius: 10, background: 'none', color: '#94A3B8', fontSize: 12, fontWeight: 600, padding: '8px 0', cursor: 'pointer' }}
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

      {/* ── TASK MODAL ─────────────────────────────────────────────── */}
      {modalTask && (() => {
        const { task, columnId } = modalTask
        const accent = COLUMN_ACCENT[columnId]
        const col = data.columns.find(c => c.id === columnId)

        const toggleLabel = (color: string, labelText: string) => {
          const existing = (task.labels || []).find(l => l.color === color)
          if (existing) {
            patchModal({ labels: (task.labels || []).filter(l => l.color !== color) })
          } else {
            patchModal({ labels: [...(task.labels || []), { id: createSmallId(), text: labelText, color }] })
          }
        }

        const addCheckItem = () => {
          if (!newCheckItem.trim()) return
          patchModal({ checklist: [...(task.checklist || []), { id: createSmallId(), text: newCheckItem.trim(), done: false }] })
          setNewCheckItem('')
        }

        const toggleCheck = (itemId: string) => {
          patchModal({ checklist: (task.checklist || []).map(c => c.id === itemId ? { ...c, done: !c.done } : c) })
        }

        const removeCheck = (itemId: string) => {
          patchModal({ checklist: (task.checklist || []).filter(c => c.id !== itemId) })
        }

        const addLink = () => {
          if (!linkInput.url.trim()) return
          patchModal({ links: [...(task.links || []), { id: createSmallId(), url: linkInput.url.trim(), displayText: linkInput.displayText.trim() || linkInput.url.trim() }] })
          setLinkInput({ url: '', displayText: '' })
          setLinkPanelOpen(false)
        }

        const removeLink = (linkId: string) => {
          patchModal({ links: (task.links || []).filter(l => l.id !== linkId) })
        }

        const doneTasks = (task.checklist || []).filter(c => c.done).length
        const totalTasks = (task.checklist || []).length
        const checkPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

        return (
          <div
            onClick={closeModal}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 18, boxShadow: '0 24px 80px rgba(15,23,42,0.22)', width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            >
              {/* Modal header */}
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent.dot, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col?.title}</span>
                  </div>
                  <input
                    value={task.title}
                    onChange={e => patchModal({ title: e.target.value })}
                    placeholder="Opgavetitel"
                    style={{ ...S.input, fontSize: 18, fontWeight: 700, border: 'none', background: 'transparent', padding: '0', color: '#0F172A', width: '100%' }}
                  />
                </div>
                <button onClick={closeModal} style={{ border: 'none', background: '#F1F5F9', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#64748B', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>

              {/* Label strip */}
              {(task.labels || []).length > 0 && (
                <div style={{ padding: '12px 24px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(task.labels || []).map(lbl => (
                    <span key={lbl.id} style={{ background: lbl.color, color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{lbl.text}</span>
                  ))}
                </div>
              )}

              {/* Body */}
              <div style={{ padding: '16px 24px 24px', display: 'flex', gap: 20 }}>
                {/* Left — main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Description */}
                  <div style={S.section}>
                    <label style={S.label}>Beskrivelse</label>
                    <textarea
                      value={task.description}
                      onChange={e => patchModal({ description: e.target.value })}
                      placeholder="Tilføj beskrivelse…"
                      rows={4}
                      style={{ ...S.input, resize: 'vertical', lineHeight: 1.6 }}
                    />
                  </div>

                  {/* Checklist */}
                  <div style={S.section}>
                    <label style={S.label}>Tjekliste {totalTasks > 0 && `${checkPct}%`}</label>
                    {totalTasks > 0 && (
                      <div style={{ height: 4, borderRadius: 999, background: '#F1F5F9', marginBottom: 10, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${checkPct}%`, background: checkPct === 100 ? '#10B981' : '#6366F1', borderRadius: 999, transition: 'width 0.3s' }} />
                      </div>
                    )}
                    {(task.checklist || []).map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <input type="checkbox" checked={item.done} onChange={() => toggleCheck(item.id)} style={{ width: 15, height: 15, accentColor: '#6366F1', cursor: 'pointer', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, color: item.done ? '#94A3B8' : '#0F172A', textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
                        <button onClick={() => removeCheck(item.id)} style={{ border: 'none', background: 'none', color: '#CBD5E1', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <input
                        value={newCheckItem}
                        onChange={e => setNewCheckItem(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCheckItem() } }}
                        placeholder="Tilføj punkt…"
                        style={{ ...S.input, flex: 1, fontSize: 12 }}
                      />
                      <button onClick={addCheckItem} style={{ border: 'none', borderRadius: 8, background: '#6366F1', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '0 12px' }}>+</button>
                    </div>
                  </div>

                  {/* Links */}
                  <div style={S.section}>
                    <label style={S.label}>Links</label>
                    {(task.links || []).map(link => (
                      <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, background: '#F8FAFC', borderRadius: 8, padding: '7px 10px' }}>
                        <span style={{ fontSize: 14 }}>🔗</span>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 13, color: '#4F46E5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none', fontWeight: 500 }}>{link.displayText}</a>
                        <button onClick={() => removeLink(link.id)} style={{ border: 'none', background: 'none', color: '#CBD5E1', cursor: 'pointer', fontSize: 13, padding: 0 }}>✕</button>
                      </div>
                    ))}
                    {linkPanelOpen ? (
                      <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 12, border: '1px solid #E2E8F0' }}>
                        <input value={linkInput.url} onChange={e => setLinkInput(v => ({ ...v, url: e.target.value }))} placeholder="URL (fx https://…)" style={{ ...S.input, marginBottom: 6, fontSize: 12 }} />
                        <input value={linkInput.displayText} onChange={e => setLinkInput(v => ({ ...v, displayText: e.target.value }))} placeholder="Visningstekst (valgfri)" style={{ ...S.input, marginBottom: 8, fontSize: 12 }} />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={addLink} style={{ border: 'none', borderRadius: 8, background: '#6366F1', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '6px 14px' }}>Tilføj</button>
                          <button onClick={() => setLinkPanelOpen(false)} style={{ border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', color: '#64748B', fontSize: 12, cursor: 'pointer', padding: '6px 12px' }}>Annuller</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setLinkPanelOpen(true)} style={{ border: '1.5px dashed #E2E8F0', borderRadius: 8, background: 'none', color: '#94A3B8', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 12px', width: '100%' }}>+ Tilføj link</button>
                    )}
                  </div>
                </div>

                {/* Right sidebar */}
                <div style={{ width: 180, flexShrink: 0 }}>
                  {/* Assignee */}
                  <div style={S.section}>
                    <label style={S.label}>Ansvarlig</label>
                    {isInProject ? (
                      <select
                        value={task.assigneeUserId || ''}
                        onChange={e => {
                          const userId = e.target.value
                          const selected = memberOptions.find(m => m.id === userId)
                          patchModal({ assigneeUserId: userId || undefined, assigneeName: userId ? selected?.label || '' : undefined })
                        }}
                        style={{ ...S.input, fontSize: 12 }}
                      >
                        <option value="">Ikke tildelt</option>
                        {memberOptions.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                      </select>
                    ) : (
                      <input value={task.assigneeName || ''} onChange={e => patchModal({ assigneeName: e.target.value, assigneeUserId: undefined })} placeholder="Navn" style={{ ...S.input, fontSize: 12 }} />
                    )}
                  </div>

                  {/* Dates */}
                  <div style={S.section}>
                    <label style={S.label}>Startdato</label>
                    <input type="date" value={task.startDate || ''} onChange={e => patchModal({ startDate: e.target.value || undefined })} style={{ ...S.input, fontSize: 12 }} />
                  </div>
                  <div style={S.section}>
                    <label style={S.label}>Deadline</label>
                    <input type="date" value={task.dueDate || ''} onChange={e => patchModal({ dueDate: e.target.value || undefined })} style={{ ...S.input, fontSize: 12 }} />
                  </div>

                  {/* Tool */}
                  <div style={S.section}>
                    <label style={S.label}>Værktøj</label>
                    <select
                      value={task.toolSlug || ''}
                      onChange={e => { void assignToolToTask(columnId, task.id, e.target.value); patchModal({ toolSlug: e.target.value || undefined }) }}
                      style={{ ...S.input, fontSize: 12 }}
                    >
                      <option value="">Ikke valgt</option>
                      {toolOptions.map(t => <option key={t.slug} value={t.slug}>{t.title}</option>)}
                    </select>
                  </div>

                  {/* Labels */}
                  <div style={S.section}>
                    <label style={S.label}>Labels</label>
                    <button
                      onClick={() => setLabelPickerOpen(v => !v)}
                      style={{ width: '100%', border: '1.5px dashed #E2E8F0', borderRadius: 8, background: 'none', color: '#94A3B8', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 0' }}
                    >
                      {labelPickerOpen ? 'Luk' : '+ Labels'}
                    </button>
                    {labelPickerOpen && (
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {LABEL_COLORS.map(({ bg, label: lbl }) => {
                          const isActive = (task.labels || []).some(l => l.color === bg)
                          return (
                            <button
                              key={bg}
                              onClick={() => toggleLabel(bg, lbl)}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, border: isActive ? `2px solid ${bg}` : '2px solid transparent', borderRadius: 7, background: bg, color: '#fff', padding: '5px 10px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                            >
                              {isActive && <span>✓</span>}
                              <span style={{ flex: 1, textAlign: 'left' }}>{lbl}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => { removeTask(columnId, task.id); closeModal() }}
                    style={{ width: '100%', border: 'none', borderRadius: 8, background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '8px 0' }}
                  >
                    Slet opgave
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </ToolLayout>
  )
}
