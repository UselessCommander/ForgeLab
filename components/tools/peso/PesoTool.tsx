'use client'

import { useCallback, useState } from 'react'
import { useToolEmbed } from '@/components/ToolEmbedContext'
import { useProjectToolData } from '@/lib/useProjectToolData'
import PesoFieldEditor from './PesoFieldEditor'
import PesoModelDiagram from './PesoModelDiagram'
import PesoReportCards from './PesoReportCards'
import styles from './peso.module.css'
import {
  createDefaultPesoData,
  normalizePesoData,
  type PesoFieldId,
  type PesoModelData,
} from './peso-data'

function PesoToolInner() {
  const { projectId } = useToolEmbed()
  const [data, setDataState] = useState<PesoModelData>(createDefaultPesoData)
  const [activeFieldId, setActiveFieldId] = useState<PesoFieldId>('paid')

  const setData = useCallback((next: PesoModelData) => {
    setDataState(normalizePesoData(next))
  }, [])

  useProjectToolData('peso', data, setData)

  const activeField = data[activeFieldId]

  const updateField = useCallback(
    (id: PesoFieldId, patch: Partial<{ title: string; description: string }>) => {
      setDataState(prev => {
        const next = normalizePesoData(prev)
        next[id] = { ...next[id], ...patch }
        return next
      })
    },
    []
  )

  return (
    <div className={styles.shell}>
      <div className={styles.editorTopBar}>
        <p>
          Klik på et felt i modellen for at redigere. Resultatet vises på projekt-boardet
          {projectId ? ' når du gemmer' : ''}.
        </p>
      </div>

      <div className={styles.editorLayout}>
        <PesoModelDiagram
          data={data}
          activeFieldId={activeFieldId}
          onSelectField={setActiveFieldId}
        />
        {activeField ? (
          <PesoFieldEditor field={activeField} onChange={updateField} />
        ) : (
          <div className={styles.editorPanelEmpty}>
            Vælg et felt i diagrammet for at begynde.
          </div>
        )}
      </div>

      <section className={styles.toolOutputSection} aria-label="PESO-dokumentation">
        <h2 className={styles.toolOutputHeading}>Dokumentation</h2>
        <PesoReportCards data={data} />
      </section>
    </div>
  )
}

export default function PesoTool() {
  return <PesoToolInner />
}
