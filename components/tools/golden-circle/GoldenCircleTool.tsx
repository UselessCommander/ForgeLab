'use client'

import { useCallback, useState } from 'react'
import { useToolEmbed } from '@/components/ToolEmbedContext'
import { useProjectToolData } from '@/lib/useProjectToolData'
import { GoldenCircleDiagram } from './GoldenCircleDiagram'
import styles from './golden-circle.module.css'
import {
  createDefaultGoldenCircleData,
  GOLDEN_CIRCLE_LAYERS,
  GOLDEN_CIRCLE_LAYER_ORDER,
  normalizeGoldenCircleData,
  type GoldenCircleData,
  type GoldenCircleLayerId,
} from './golden-circle-data'

function GoldenCircleToolInner() {
  const { projectId } = useToolEmbed()
  const [data, setDataState] = useState<GoldenCircleData>(createDefaultGoldenCircleData)
  const [activeLayer, setActiveLayer] = useState<GoldenCircleLayerId>('why')

  const setData = useCallback((next: GoldenCircleData) => {
    setDataState(normalizeGoldenCircleData(next))
  }, [])

  useProjectToolData('golden-circle', data, setData)

  const active = GOLDEN_CIRCLE_LAYERS[activeLayer]

  const updateStatement = (value: string) => {
    setDataState(prev => ({
      ...prev,
      [activeLayer]: value,
    }))
  }

  return (
    <div className={styles.shell}>
      <div className={styles.editorTopBar}>
        <p>
          Klik på et lag i cirklen for at redigere WHY, HOW og WHAT.
          {projectId ? ' Resultatet gemmes i projektet og vises på boardet.' : ''}
        </p>
      </div>

      <div className={styles.diagramCard}>
        <GoldenCircleDiagram activeLayer={activeLayer} onSelectLayer={setActiveLayer} />
      </div>

      <aside className={styles.editorPanel}>
        <p className={styles.panelEyebrow}>The Golden Circle</p>
        <h2 className={styles.panelTitle}>{active.title}</h2>
        <p className={styles.panelQuestion}>{active.question}</p>

        <label className="grid gap-2">
          <span className={styles.fieldLabel}>{active.label}</span>
          <textarea
            className={styles.statementInput}
            rows={7}
            value={data[activeLayer]}
            onChange={e => updateStatement(e.target.value)}
            placeholder={active.placeholder}
            aria-label={active.label}
          />
        </label>

        <div className={styles.layerPills}>
          {GOLDEN_CIRCLE_LAYER_ORDER.map(id => (
            <button
              key={id}
              type="button"
              className={`${styles.layerPill} ${activeLayer === id ? styles.layerPillActive : ''}`}
              onClick={() => setActiveLayer(id)}
            >
              {GOLDEN_CIRCLE_LAYERS[id].title}
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}

export default function GoldenCircleTool() {
  return <GoldenCircleToolInner />
}
