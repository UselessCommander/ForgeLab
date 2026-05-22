'use client'

import type { MutableRefObject } from 'react'
import Link from 'next/link'
import { BookOpen, ExternalLink, Wrench } from 'lucide-react'
import type { GoogleDesignSprintPhase } from '@/lib/frameworks'
import {
  GV_DESIGN_SPRINT_FRAMEWORK,
  getFrameworkActivityTypeLabel,
  getGvDesignSprintDay,
  getGvDesignSprintDays,
  resolveLinkedTools,
  type FrameworkActivity,
  type FrameworkDay,
} from '@/lib/gv-design-sprint-framework'

type GvDesignSprintPlaybookProps = {
  selectedDayId?: GoogleDesignSprintPhase
  onDaySelect?: (dayId: GoogleDesignSprintPhase) => void
  compact?: boolean
  dayRefs?: MutableRefObject<Partial<Record<string, HTMLDivElement | null>>>
}

function ActivityTypeBadge({ type }: { type: FrameworkActivity['activityType'] }) {
  const styles: Record<FrameworkActivity['activityType'], string> = {
    guide: 'border-sky-200 bg-sky-50 text-sky-800',
    tool: 'border-violet-200 bg-violet-50 text-violet-800',
    decision: 'border-rose-200 bg-rose-50 text-rose-800',
    workshop: 'border-amber-200 bg-amber-50 text-amber-800',
    test: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  }
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[type]}`}
    >
      {getFrameworkActivityTypeLabel(type)}
    </span>
  )
}

function ActivityRow({ activity }: { activity: FrameworkActivity }) {
  const linked = resolveLinkedTools(activity.linkedToolIds)
  const isGuideOnly = !activity.isInteractiveTool && linked.length === 0

  return (
    <li className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <h4 className="text-xs font-bold text-gray-900">{activity.title}</h4>
        <ActivityTypeBadge type={activity.activityType} />
        {isGuideOnly && (
          <span className="inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-500">
            <BookOpen className="h-3 w-3" />
            Guide / øvelse
          </span>
        )}
        {activity.isInteractiveTool && linked.some((l) => l.exists) && (
          <span className="inline-flex items-center gap-0.5 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-800">
            <Wrench className="h-3 w-3" />
            ForgeLab-værktøj
          </span>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-gray-600">{activity.description}</p>
      {linked.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {linked.map((tool) =>
            tool.exists ? (
              <Link
                key={tool.id}
                href={tool.href}
                className="inline-flex items-center gap-1 rounded-lg border border-violet-200/80 bg-white px-2 py-1 text-[11px] font-semibold text-violet-900 transition-colors hover:border-violet-300 hover:bg-violet-50"
              >
                {tool.title}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </Link>
            ) : (
              <span
                key={tool.id}
                className="inline-flex items-center rounded-lg border border-dashed border-gray-200 px-2 py-1 text-[11px] text-gray-400"
              >
                {tool.title}
              </span>
            )
          )}
        </div>
      )}
    </li>
  )
}

function DayPanel({
  day,
  isSelected,
  onSelect,
  panelRef,
}: {
  day: FrameworkDay
  isSelected: boolean
  onSelect?: () => void
  panelRef?: (el: HTMLDivElement | null) => void
}) {
  return (
    <div
      ref={panelRef}
      className={`rounded-2xl border bg-white p-4 shadow-sm transition-all ${
        isSelected
          ? 'border-amber-400 ring-2 ring-amber-200/80'
          : 'border-gray-200/80 hover:border-amber-200/60'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="mb-3 w-full text-left"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">{day.dayLabel}</p>
        <h3 className="text-sm font-extrabold text-gray-900">{day.title}</h3>
        <p className="mt-1 text-[11px] leading-snug text-gray-500">
          <span className="font-semibold text-gray-600">Mål: </span>
          {day.goal}
        </p>
      </button>
      <ol className="space-y-2">
        {day.activities.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}
      </ol>
    </div>
  )
}

export default function GvDesignSprintPlaybook({
  selectedDayId,
  onDaySelect,
  compact = false,
  dayRefs,
}: GvDesignSprintPlaybookProps) {
  const days = getGvDesignSprintDays()
  const followUp = GV_DESIGN_SPRINT_FRAMEWORK.followUp

  if (compact && selectedDayId) {
    const day = getGvDesignSprintDay(selectedDayId)
    if (!day) return null
    return (
      <div>
        <DayPanel day={day} isSelected />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200/50 bg-amber-50/40 px-4 py-3">
        <p className="text-xs font-bold text-amber-900">{GV_DESIGN_SPRINT_FRAMEWORK.title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-amber-900/90">
          {GV_DESIGN_SPRINT_FRAMEWORK.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {days.map((day) => (
          <DayPanel
            key={day.id}
            day={day}
            isSelected={selectedDayId === day.id}
            onSelect={onDaySelect ? () => onDaySelect(day.id) : undefined}
            panelRef={
              dayRefs
                ? (el) => {
                    dayRefs.current[day.id] = el
                  }
                : undefined
            }
          />
        ))}
      </div>

      {followUp && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/80 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {followUp.title}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-600">{followUp.description}</p>
          <p className="mt-2 text-[11px] italic text-gray-500">{followUp.note}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {resolveLinkedTools(followUp.optionalToolIds).map((tool) =>
              tool.exists ? (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-800 hover:border-amber-200/60"
                >
                  {tool.title}
                  <span className="text-[10px] font-normal text-gray-400">(opfølgning)</span>
                </Link>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  )
}
