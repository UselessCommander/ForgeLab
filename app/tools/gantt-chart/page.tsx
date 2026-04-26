'use client'

import { useState } from 'react'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { deleteEmptyFieldRow } from '@/lib/deleteRowKeyboard'
import ToolLayout from '@/components/ToolLayout'

interface Task {
  id: string
  name: string
  startDate: string
  endDate: string
  progress: number
  color?: string
}

const TASK_COLORS = [
  '#6366F1', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6',
]

const today = new Date()
today.setHours(0, 0, 0, 0)
const todayStr = today.toISOString().split('T')[0]

const DAY_W = 28 // px per day column
const ROW_H = 40 // px per task row
const LEFT_W = 200 // px for task name column

function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export default function GanttChart() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', name: 'Projekt Start', startDate: todayStr, endDate: addDays(today, 7).toISOString().split('T')[0], progress: 0, color: TASK_COLORS[0] },
    { id: '2', name: 'Research',      startDate: addDays(today, 2).toISOString().split('T')[0], endDate: addDays(today, 10).toISOString().split('T')[0], progress: 40, color: TASK_COLORS[1] },
  ])
  const [editingId, setEditingId] = useState<string | null>(null)

  useProjectToolData('gantt-chart', tasks, setTasks)

  const addTask = () => {
    const id = Date.now().toString()
    const colorIdx = tasks.length % TASK_COLORS.length
    setTasks(prev => [...prev, {
      id,
      name: '',
      startDate: todayStr,
      endDate: addDays(today, 7).toISOString().split('T')[0],
      progress: 0,
      color: TASK_COLORS[colorIdx],
    }])
    setEditingId(id)
  }

  const updateTask = (id: string, patch: Partial<Task>) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    if (editingId === id) setEditingId(null)
  }

  // Compute timeline bounds (pad 2 days each side)
  const allStarts = tasks.map(t => new Date(t.startDate))
  const allEnds   = tasks.map(t => new Date(t.endDate))
  const gridStart = tasks.length ? addDays(new Date(Math.min(...allStarts.map(d => d.getTime()))), -2) : addDays(today, -2)
  const gridEnd   = tasks.length ? addDays(new Date(Math.max(...allEnds.map(d => d.getTime()))),    3) : addDays(today, 30)
  // Always show at least 30 days
  const totalDays = Math.max(30, diffDays(gridStart, gridEnd))
  const gridWidth = totalDays * DAY_W

  // Today position
  const todayOffset = diffDays(gridStart, today)

  // Generate day columns
  const days = Array.from({ length: totalDays }, (_, i) => addDays(gridStart, i))

  // Group into weeks for header
  const weeks: { label: string; start: number; count: number }[] = []
  let wi = 0
  while (wi < days.length) {
    const d = days[wi]
    const monday = wi
    let count = 0
    while (wi < days.length && count < 7) { wi++; count++ }
    weeks.push({
      label: d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }),
      start: monday,
      count,
    })
  }

  const editing = tasks.find(t => t.id === editingId) ?? null

  return (
    <ToolLayout
      title="Gantt-diagram"
      description="Planlæg projektet med en visuel tidslinje."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{tasks.length} opgave{tasks.length !== 1 ? 'r' : ''}</span>
          <button
            onClick={addTask}
            style={{ border: 'none', borderRadius: 9, background: '#111827', color: '#fff', fontSize: 13, fontWeight: 600, padding: '7px 16px', cursor: 'pointer' }}
          >
            + Tilføj opgave
          </button>
        </div>

        {/* ── Main Gantt grid ── */}
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <div style={{ display: 'flex', minWidth: LEFT_W + gridWidth }}>

            {/* Left panel: task names */}
            <div style={{ width: LEFT_W, flexShrink: 0, borderRight: '1px solid #E5E7EB' }}>
              {/* Header placeholder */}
              <div style={{ height: 52, borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }} />
              {/* Task rows */}
              {tasks.map((task, idx) => (
                <div
                  key={task.id}
                  style={{
                    height: ROW_H, display: 'flex', alignItems: 'center', padding: '0 12px',
                    borderBottom: '1px solid #F3F4F6',
                    background: editingId === task.id ? '#F9FAFB' : idx % 2 === 0 ? '#fff' : '#FAFAFA',
                    cursor: 'pointer', gap: 8,
                  }}
                  onClick={() => setEditingId(task.id === editingId ? null : task.id)}
                >
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: task.color ?? '#6366F1', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: task.name ? '#111827' : '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {task.name || 'Opgave'}
                  </span>
                </div>
              ))}
            </div>

            {/* Right panel: timeline */}
            <div style={{ flex: 1, position: 'relative' }}>
              {/* Week header */}
              <div style={{ display: 'flex', height: 26, borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
                {weeks.map((wk, i) => (
                  <div key={i} style={{ width: wk.count * DAY_W, flexShrink: 0, borderRight: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{wk.label}</span>
                  </div>
                ))}
              </div>
              {/* Day sub-header */}
              <div style={{ display: 'flex', height: 26, borderBottom: '1px solid #E5E7EB', background: '#FAFAFA' }}>
                {days.map((d, i) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6
                  const isToday = i === todayOffset
                  return (
                    <div key={i} style={{
                      width: DAY_W, flexShrink: 0, borderRight: '1px solid #F3F4F6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isWeekend ? '#F9FAFB' : '#FAFAFA',
                    }}>
                      <span style={{ fontSize: 9, fontWeight: isToday ? 800 : 400, color: isToday ? '#111827' : '#C4C9D4' }}>
                        {d.getDate()}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Task bar rows */}
              {tasks.map((task, idx) => {
                const taskStart = diffDays(gridStart, new Date(task.startDate))
                const taskEnd   = diffDays(gridStart, new Date(task.endDate))
                const barLeft   = taskStart * DAY_W
                const barWidth  = Math.max(DAY_W, (taskEnd - taskStart + 1) * DAY_W)
                const color     = task.color ?? '#6366F1'

                return (
                  <div key={task.id} style={{
                    height: ROW_H, position: 'relative',
                    borderBottom: '1px solid #F3F4F6',
                    background: idx % 2 === 0 ? '#fff' : '#FAFAFA',
                  }}>
                    {/* Weekend shading */}
                    {days.map((d, i) => d.getDay() === 0 || d.getDay() === 6
                      ? <div key={i} style={{ position: 'absolute', left: i * DAY_W, top: 0, width: DAY_W, height: '100%', background: 'rgba(0,0,0,0.015)', pointerEvents: 'none' }} />
                      : null
                    )}
                    {/* Today vertical line */}
                    {todayOffset >= 0 && todayOffset < totalDays && (
                      <div style={{ position: 'absolute', left: todayOffset * DAY_W + DAY_W / 2 - 0.5, top: 0, width: 1, height: '100%', background: '#EF4444', opacity: 0.5, pointerEvents: 'none' }} />
                    )}
                    {/* Bar */}
                    <div
                      title={`${task.name}: ${task.progress}% færdig`}
                      style={{
                        position: 'absolute',
                        left: barLeft,
                        top: 8,
                        width: barWidth,
                        height: ROW_H - 16,
                        borderRadius: 6,
                        background: `${color}22`,
                        border: `1.5px solid ${color}66`,
                        overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                      onClick={() => setEditingId(task.id === editingId ? null : task.id)}
                    >
                      {/* Progress fill */}
                      <div style={{ position: 'absolute', left: 0, top: 0, width: `${task.progress}%`, height: '100%', background: color, borderRadius: 4, opacity: 0.9 }} />
                      {/* Label */}
                      <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, fontWeight: 700, color: task.progress > 40 ? '#fff' : color, whiteSpace: 'nowrap', zIndex: 1 }}>
                        {task.name || 'Opgave'}{task.progress > 0 ? ` · ${task.progress}%` : ''}
                      </span>
                    </div>
                  </div>
                )
              })}

              {/* Today line across headers (decorative) */}
              {todayOffset >= 0 && todayOffset < totalDays && (
                <div style={{ position: 'absolute', left: todayOffset * DAY_W + DAY_W / 2 - 0.5, top: 0, width: 1.5, height: 52, background: '#EF4444', opacity: 0.7, pointerEvents: 'none', zIndex: 10 }} />
              )}
            </div>
          </div>
        </div>

        {/* ── Edit drawer (appears when task is selected) ── */}
        {editing && (
          <div style={{ borderTop: '1px solid #E5E7EB', padding: '16px 20px', background: '#FAFAFA', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Name */}
            <div style={{ flex: '2 1 160px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Navn</p>
              <input
                autoFocus
                value={editing.name}
                onChange={e => updateTask(editing.id, { name: e.target.value })}
                onKeyDown={e => deleteEmptyFieldRow(e, editing.name, true, () => deleteTask(editing.id))}
                placeholder="Opgavenavn…"
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
              />
            </div>
            {/* Start */}
            <div style={{ flex: '1 1 120px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Start</p>
              <input type="date" value={editing.startDate} onChange={e => updateTask(editing.id, { startDate: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', background: '#fff' }} />
            </div>
            {/* Slut */}
            <div style={{ flex: '1 1 120px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Slut</p>
              <input type="date" value={editing.endDate} onChange={e => updateTask(editing.id, { endDate: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', background: '#fff' }} />
            </div>
            {/* Progress */}
            <div style={{ flex: '1 1 120px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Fremgang — {editing.progress}%</p>
              <input type="range" min={0} max={100} value={editing.progress} onChange={e => updateTask(editing.id, { progress: Number(e.target.value) })}
                style={{ width: '100%', accentColor: editing.color ?? '#6366F1' }} />
            </div>
            {/* Color */}
            <div style={{ flex: '0 0 auto' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Farve</p>
              <div style={{ display: 'flex', gap: 5 }}>
                {TASK_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => updateTask(editing.id, { color: c })}
                    style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: editing.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2, boxShadow: editing.color === c ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : 'none' }}
                  />
                ))}
              </div>
            </div>
            {/* Delete */}
            <button
              onClick={() => deleteTask(editing.id)}
              style={{ border: 'none', borderRadius: 8, background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 600, padding: '8px 14px', cursor: 'pointer', alignSelf: 'flex-end' }}
            >Slet</button>
            {/* Close */}
            <button
              onClick={() => setEditingId(null)}
              style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 600, padding: '8px 14px', cursor: 'pointer', alignSelf: 'flex-end' }}
            >Luk</button>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
