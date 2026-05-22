'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import styles from './gallup-kompasrose.module.css'

const LABELS = [
  'Moderne',
  'Moderne-individorienterede',
  'Individorienterede',
  'Traditionelle-individorienterede',
  'Traditionelle',
  'Traditionelle-fællesskabsorienterede',
  'Fællesskabsorienterede',
  'Moderne-fællesskabsorienterede',
] as const

/** Accent per dimension — rose → violet → amber compass spectrum */
const DIMENSION_LABEL_COLORS = [
  '#e11d48',
  '#f43f5e',
  '#db2777',
  '#a855f7',
  '#7c3aed',
  '#6366f1',
  '#2563eb',
  '#d97706',
] as const

type ChartTheme = {
  gridRing: string
  gridAxis: string
  fill: string
  stroke: string
  point: string
  pointRing: string
}

const CHART_THEMES: Record<1 | 2, ChartTheme> = {
  1: {
    gridRing: '#fecdd3',
    gridAxis: '#fda4af',
    fill: 'rgba(225, 29, 72, 0.2)',
    stroke: '#e11d48',
    point: '#be123c',
    pointRing: '#fff1f2',
  },
  2: {
    gridRing: '#ddd6fe',
    gridAxis: '#c4b5fd',
    fill: 'rgba(124, 58, 237, 0.2)',
    stroke: '#7c3aed',
    point: '#6d28d9',
    pointRing: '#f5f3ff',
  },
}

const SIZE = 380
const LABEL_CONTAINER_SIZE = 520
const LABEL_CENTER = LABEL_CONTAINER_SIZE / 2
const LABEL_RADIUS = 200
const N_LABELS = LABELS.length
const LABEL_STEP = (2 * Math.PI) / N_LABELS
const LABEL_ANGLE_OFFSET = -Math.PI / 2

function drawRadar(canvas: HTMLCanvasElement, values: number[], theme: ChartTheme) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = SIZE * dpr
  canvas.height = SIZE * dpr
  canvas.style.width = `${SIZE}px`
  canvas.style.height = `${SIZE}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const cx = SIZE / 2
  const cy = SIZE / 2
  const radius = SIZE / 2 - 62
  const n = LABELS.length
  const step = (2 * Math.PI) / n
  const angleOffset = -Math.PI / 2

  ctx.clearRect(0, 0, SIZE, SIZE)

  // Soft center glow
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
  glow.addColorStop(0, 'rgba(255, 241, 242, 0.9)')
  glow.addColorStop(0.55, 'rgba(255, 255, 255, 0.35)')
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()

  // Grid rings
  ctx.strokeStyle = theme.gridRing
  ctx.lineWidth = 1
  for (let r = 1; r <= 5; r++) {
    ctx.beginPath()
    const R = (radius / 5) * r
    for (let i = 0; i <= n; i++) {
      const a = angleOffset + i * step
      const x = cx + R * Math.cos(a)
      const y = cy + R * Math.sin(a)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }

  // Spokes
  for (let i = 0; i < n; i++) {
    const a = angleOffset + i * step
    const ax = cx + radius * Math.cos(a)
    const ay = cy + radius * Math.sin(a)
    ctx.strokeStyle = theme.gridAxis
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(ax, ay)
    ctx.stroke()
  }

  // Data polygon
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const v = values[i] / 100
    const a = angleOffset + i * step
    const r = radius * v
    const x = cx + r * Math.cos(a)
    const y = cy + r * Math.sin(a)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = theme.fill
  ctx.fill()
  ctx.strokeStyle = theme.stroke
  ctx.lineWidth = 2.5
  ctx.lineJoin = 'round'
  ctx.stroke()

  // Data points
  for (let i = 0; i < n; i++) {
    const v = values[i] / 100
    const a = angleOffset + i * step
    const r = radius * v
    const x = cx + r * Math.cos(a)
    const y = cy + r * Math.sin(a)
    ctx.fillStyle = theme.point
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = theme.pointRing
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

function setupRadarLabels(container: HTMLElement) {
  container.innerHTML = ''
  for (let i = 0; i < N_LABELS; i++) {
    const a = LABEL_ANGLE_OFFSET + i * LABEL_STEP
    const x = LABEL_CENTER + LABEL_RADIUS * Math.cos(a)
    const y = LABEL_CENTER + LABEL_RADIUS * Math.sin(a)
    const el = document.createElement('span')
    el.className = styles.radarLabel
    el.textContent = LABELS[i]
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    el.style.color = DIMENSION_LABEL_COLORS[i]
    container.appendChild(el)
  }
}

function GallupKompasroseContent() {
  const [values1, setValues1] = useState([70, 55, 60, 45, 50, 65, 80, 75])
  const [values2, setValues2] = useState([70, 55, 60, 45, 50, 65, 80, 75])

  const canvas1Ref = useRef<HTMLCanvasElement>(null)
  const canvas2Ref = useRef<HTMLCanvasElement>(null)
  const labels1Ref = useRef<HTMLDivElement>(null)
  const labels2Ref = useRef<HTMLDivElement>(null)

  const kompasroseData = { values1, values2 }
  const setKompasroseData = (data: typeof kompasroseData) => {
    setValues1(data.values1)
    setValues2(data.values2)
  }

  useProjectToolData('gallup-kompasrose', kompasroseData, setKompasroseData)

  const paintCharts = useCallback(() => {
    const c1 = canvas1Ref.current
    const c2 = canvas2Ref.current
    if (c1) drawRadar(c1, values1, CHART_THEMES[1])
    if (c2) drawRadar(c2, values2, CHART_THEMES[2])
    if (labels1Ref.current) setupRadarLabels(labels1Ref.current)
    if (labels2Ref.current) setupRadarLabels(labels2Ref.current)
  }, [values1, values2])

  useEffect(() => {
    paintCharts()
  }, [paintCharts])

  const updateValue = (chartIndex: 1 | 2, index: number, value: number) => {
    const clampedValue = Math.min(100, Math.max(0, value))
    if (chartIndex === 1) {
      setValues1(prev => {
        const next = [...prev]
        next[index] = clampedValue
        return next
      })
    } else {
      setValues2(prev => {
        const next = [...prev]
        next[index] = clampedValue
        return next
      })
    }
  }

  const renderSliders = (chartIndex: 1 | 2, values: number[]) => {
    const rangeClass = chartIndex === 1 ? styles.rangeRose : styles.rangeViolet
    const wrapClass =
      chartIndex === 1 ? styles.scoreInputWrap : `${styles.scoreInputWrap} ${styles.scoreInputWrapViolet}`
    const btnClass = chartIndex === 1 ? styles.scoreBtn : `${styles.scoreBtn} ${styles.scoreBtnViolet}`

    return (
      <div className={styles.sliders}>
        {LABELS.map((label, index) => (
          <div key={`${chartIndex}-${label}`} className={styles.sliderRow}>
            <label style={{ color: DIMENSION_LABEL_COLORS[index] }}>{label}</label>
            <input
              type="range"
              className={rangeClass}
              min={0}
              max={100}
              value={values[index]}
              onChange={e => updateValue(chartIndex, index, parseInt(e.target.value, 10))}
            />
            <div className={wrapClass}>
              <button
                type="button"
                className={btnClass}
                aria-label={`Sænk ${label}`}
                onClick={() => updateValue(chartIndex, index, values[index] - 1)}
              >
                −
              </button>
              <input
                type="number"
                className={styles.scoreInput}
                min={0}
                max={100}
                value={values[index]}
                aria-label={`Score for ${label}`}
                onChange={e => updateValue(chartIndex, index, parseInt(e.target.value, 10) || 0)}
              />
              <button
                type="button"
                className={btnClass}
                aria-label={`Hæv ${label}`}
                onClick={() => updateValue(chartIndex, index, values[index] + 1)}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.workspace}>
      <div className={styles.chartColumn}>
        <div className={styles.chartCard}>
          <span className={`${styles.chartBadge} ${styles.chartBadgeRose}`}>Profil 1</span>
          <div className={styles.chartContainer}>
            <canvas ref={canvas1Ref} width={SIZE} height={SIZE} aria-label="Kompasrose profil 1" />
            <div ref={labels1Ref} className={styles.radarLabels} aria-hidden />
          </div>
        </div>
        {renderSliders(1, values1)}
      </div>

      <div className={styles.chartColumn}>
        <div className={`${styles.chartCard} ${styles.chartCardViolet}`}>
          <span className={`${styles.chartBadge} ${styles.chartBadgeViolet}`}>Profil 2</span>
          <div className={styles.chartContainer}>
            <canvas ref={canvas2Ref} width={SIZE} height={SIZE} aria-label="Kompasrose profil 2" />
            <div ref={labels2Ref} className={styles.radarLabels} aria-hidden />
          </div>
        </div>
        {renderSliders(2, values2)}
      </div>
    </div>
  )
}

export default function GallupKompasrosePage() {
  return (
    <ToolLayout
      title="Gallup Kompasrose"
      description="Radardiagram · 8 dimensioner — sammenlign to kultur- eller værdiprofiler."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
    >
      <GallupKompasroseContent />
    </ToolLayout>
  )
}
