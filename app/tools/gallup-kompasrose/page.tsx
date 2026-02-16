'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function GallupKompasrose() {
  const [values1, setValues1] = useState([70, 55, 60, 45, 50, 65, 80, 75])
  const [values2, setValues2] = useState([70, 55, 60, 45, 50, 65, 80, 75])

  const labels = [
    'Moderne',
    'Moderne-individorienterede',
    'Individorienterede',
    'Traditionelle-individorienterede',
    'Traditionelle',
    'Traditionelle-fællesskabsorienterede',
    'Fællesskabsorienterede',
    'Moderne-fællesskabsorienterede'
  ]

  const size = 380
  const labelContainerSize = 520
  const labelCenter = labelContainerSize / 2
  const labelRadius = 200
  const nLabels = labels.length
  const labelStep = (2 * Math.PI) / nLabels
  const labelAngleOffset = -Math.PI / 2

  useEffect(() => {
    drawRadar('radar1', values1)
    drawRadar('radar2', values2)
    setupRadarLabels('labels1')
    setupRadarLabels('labels2')
  }, [values1, values2])

  function setupRadarLabels(containerId: string) {
    const container = document.getElementById(containerId)
    if (!container) return
    container.innerHTML = ''
    for (let i = 0; i < nLabels; i++) {
      const a = labelAngleOffset + i * labelStep
      const x = labelCenter + labelRadius * Math.cos(a)
      const y = labelCenter + labelRadius * Math.sin(a)
      const el = document.createElement('span')
      el.className = 'radar-label'
      el.textContent = labels[i]
      el.style.left = x + 'px'
      el.style.top = y + 'px'
      container.appendChild(el)
    }
  }

  function drawRadar(canvasId: string, values: number[]) {
    const canvasEl = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvasEl) return
    const ctx = canvasEl.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvasEl.width = size * dpr
    canvasEl.height = size * dpr
    canvasEl.style.width = size + 'px'
    canvasEl.style.height = size + 'px'
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 62
    const n = labels.length
    const step = (2 * Math.PI) / n
    const angleOffset = -Math.PI / 2

    ctx.clearRect(0, 0, size, size)

    // Draw grid circles
    ctx.strokeStyle = '#d0d0d0'
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

    // Draw grid lines
    for (let i = 0; i < n; i++) {
      const a = angleOffset + i * step
      const ax = cx + radius * Math.cos(a)
      const ay = cy + radius * Math.sin(a)
      ctx.strokeStyle = '#b0b0b0'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(ax, ay)
      ctx.stroke()
    }

    // Draw data polygon
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
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    ctx.fill()
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw data points
    for (let i = 0; i < n; i++) {
      const v = values[i] / 100
      const a = angleOffset + i * step
      const r = radius * v
      const x = cx + r * Math.cos(a)
      const y = cy + r * Math.sin(a)
      ctx.fillStyle = '#333'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  const updateValue = (chartIndex: number, index: number, value: number) => {
    const clampedValue = Math.min(100, Math.max(0, value))
    if (chartIndex === 1) {
      const newValues = [...values1]
      newValues[index] = clampedValue
      setValues1(newValues)
    } else {
      const newValues = [...values2]
      newValues[index] = clampedValue
      setValues2(newValues)
    }
  }

  return (
    <>
      <style jsx global>{`
        .chart-container {
          position: relative;
          width: 520px;
          height: 520px;
          overflow: visible;
        }
        .chart-container canvas {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 380px;
          height: 380px;
          display: block;
        }
        .radar-labels {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .radar-label {
          position: absolute;
          font-size: 13px;
          font-weight: 600;
          color: #333;
          text-align: center;
          max-width: 100px;
          line-height: 1.25;
          word-wrap: break-word;
          overflow-wrap: break-word;
          transform: translate(-50%, -50%);
        }
        .sliders {
          margin-top: 1rem;
          width: 100%;
          max-width: 340px;
        }
        .slider-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.4rem;
          min-height: 1.6rem;
        }
        .slider-row label {
          flex-shrink: 0;
          width: 200px;
          font-size: 0.75rem;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }
        .slider-row input[type="range"] {
          flex: 1;
          min-width: 0;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: #e0e0e0;
          border-radius: 3px;
        }
        .slider-row input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #333;
          cursor: pointer;
        }
        .slider-value {
          width: 2.5rem;
          flex-shrink: 0;
          padding: 2px 4px;
          font-size: 0.85rem;
          font-variant-numeric: tabular-nums;
          color: #333;
          text-align: right;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: #fff;
        }
        .slider-value:focus {
          outline: none;
          border-color: #333;
        }
      `}</style>
      
      <div className="min-h-screen px-4 py-8 md:py-12 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8 md:mb-12">
            <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-200">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-2 text-gray-700 font-medium mb-6 hover:text-gray-900 transition-colors"
              >
                <span>←</span>
                <span>Tilbage til Dashboard</span>
              </Link>
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
                Gallup Kompasrose
              </h1>
              <p className="text-gray-600">
                Radardiagram · 8 dimensioner
              </p>
            </div>
          </header>

          {/* Charts */}
          <div className="flex flex-wrap justify-center gap-8 items-start">
            {/* Chart 1 */}
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1</h2>
              <div className="chart-container">
                <canvas id="radar1" width="380" height="380"></canvas>
                <div className="radar-labels" id="labels1" aria-hidden="true"></div>
              </div>
              <div className="sliders">
                {labels.map((label, index) => (
                  <div key={index} className="slider-row">
                    <label>{label}</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={values1[index]}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        updateValue(1, index, val)
                      }}
                    />
                    <input
                      type="number"
                      className="slider-value"
                      min="0"
                      max="100"
                      value={values1[index]}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0
                        updateValue(1, index, val)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2 */}
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2</h2>
              <div className="chart-container">
                <canvas id="radar2" width="380" height="380"></canvas>
                <div className="radar-labels" id="labels2" aria-hidden="true"></div>
              </div>
              <div className="sliders">
                {labels.map((label, index) => (
                  <div key={index} className="slider-row">
                    <label>{label}</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={values2[index]}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        updateValue(2, index, val)
                      }}
                    />
                    <input
                      type="number"
                      className="slider-value"
                      min="0"
                      max="100"
                      value={values2[index]}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0
                        updateValue(2, index, val)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
