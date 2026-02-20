'use client'

import { useState } from 'react'
import Link from 'next/link'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import { useProjectToolData } from '@/lib/useProjectToolData'

interface Task {
  id: string
  name: string
  startDate: string
  endDate: string
  progress: number
}

export default function GanttChart() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      name: 'Projekt Start',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0
    }
  ])

  // Automatically save/load data when in a project
  useProjectToolData('gantt-chart', tasks, setTasks)

  const addTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0
    }
    setTasks([...tasks, newTask])
  }

  const updateTask = (id: string, field: keyof Task, value: any) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, [field]: value } : task
    ))
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const getDaysBetween = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const getProjectStart = () => {
    if (tasks.length === 0) return new Date()
    return new Date(Math.min(...tasks.map(t => new Date(t.startDate).getTime())))
  }

  const getProjectEnd = () => {
    if (tasks.length === 0) return new Date()
    return new Date(Math.max(...tasks.map(t => new Date(t.endDate).getTime())))
  }

  const getDaysFromStart = (date: string) => {
    const projectStart = getProjectStart()
    const taskDate = new Date(date)
    return Math.max(0, Math.ceil((taskDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)))
  }

  const projectStart = getProjectStart()
  const projectEnd = getProjectEnd()
  const totalDays = getDaysBetween(projectStart.toISOString().split('T')[0], projectEnd.toISOString().split('T')[0])
  const displayDays = Math.min(totalDays, 60) // Limit to 60 days for display

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-200">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-gray-700 font-medium mb-6 hover:text-gray-900 transition-colors"
            >
              <span>←</span>
              <span>Tilbage til Dashboard</span>
            </Link>
            <div className="flex items-center gap-4 mb-2">
              <ForgeLabLogo size={48} />
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
                Gantt Chart
              </h1>
            </div>
            <p className="text-gray-600">
              Visualiser projektets tidslinje og opgaver
            </p>
          </div>
        </header>

        {/* Tasks List */}
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-300 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Opgaver</h2>
            <button
              onClick={addTask}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              + Tilføj Opgave
            </button>
          </div>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="border-2 border-gray-300 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Navn</label>
                    <input
                      type="text"
                      value={task.name}
                      onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                      placeholder="Opgave navn..."
                      className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-gray-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start</label>
                    <input
                      type="date"
                      value={task.startDate}
                      onChange={(e) => updateTask(task.id, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-gray-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Slut</label>
                    <input
                      type="date"
                      value={task.endDate}
                      onChange={(e) => updateTask(task.id, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-gray-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fremgang (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={task.progress}
                      onChange={(e) => updateTask(task.id, 'progress', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-gray-900 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                      Slet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Classic Gantt Chart Visualization */}
        {tasks.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-300 overflow-x-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tidslinje</h2>
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="flex border-b-2 border-gray-400 mb-2">
                <div className="w-48 flex-shrink-0 font-bold text-gray-900 py-2 px-2 border-r-2 border-gray-400 bg-gray-100">
                  Opgave
                </div>
                <div className="flex-1 flex">
                  {Array.from({ length: displayDays }, (_, i) => {
                    const date = new Date(projectStart)
                    date.setDate(date.getDate() + i)
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                    return (
                      <div
                        key={i}
                        className={`text-xs text-center py-2 border-r border-gray-300 ${isWeekend ? 'bg-gray-100' : 'bg-white'}`}
                        style={{ minWidth: '20px', flex: '1' }}
                      >
                        {i % 7 === 0 ? date.getDate() : ''}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Task Rows */}
              <div className="space-y-1">
                {tasks.map((task) => {
                  const daysFromStart = getDaysFromStart(task.startDate)
                  const duration = getDaysBetween(task.startDate, task.endDate)
                  const widthPercent = (duration / displayDays) * 100
                  const leftPercent = (daysFromStart / displayDays) * 100
                  
                  return (
                    <div key={task.id} className="flex items-center h-10 border-b border-gray-200">
                      <div className="w-48 flex-shrink-0 text-sm text-gray-700 font-medium px-2 border-r-2 border-gray-300 bg-gray-50 truncate">
                        {task.name || 'Unavngiven opgave'}
                      </div>
                      <div className="flex-1 relative h-8 bg-gray-100">
                        <div
                          className="absolute h-full bg-blue-500 border border-blue-600 flex items-center justify-center text-white text-xs font-medium"
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            minWidth: '20px'
                          }}
                        >
                          {task.progress > 0 && (
                            <div
                              className="absolute left-0 top-0 h-full bg-green-500 border-r border-green-600"
                              style={{ width: `${task.progress}%` }}
                            />
                          )}
                          {duration <= 3 && (
                            <span className="relative z-10 px-1 text-[10px]">{task.progress}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
