'use client'

import { memo } from 'react'
import styles from './peso.module.css'
import type { PesoField, PesoFieldId } from './peso-data'

type PesoFieldEditorProps = {
  field: PesoField
  onChange: (id: PesoFieldId, patch: Partial<Pick<PesoField, 'title' | 'description'>>) => void
}

function PesoFieldEditorInner({ field, onChange }: PesoFieldEditorProps) {
  return (
    <div className={styles.editorPanel}>
      <span className={styles.fieldBadge} style={{ background: field.color }}>
        {field.label}
      </span>
      <input
        type="text"
        className={styles.fieldTitle}
        value={field.title}
        onChange={e => onChange(field.id, { title: e.target.value })}
        aria-label="Titel for felt"
      />
      <p className={styles.fieldHint}>
        Beskriv strategi, kanaler og konkrete tiltag for denne del af modellen.
      </p>
      <textarea
        className={styles.fieldDescription}
        value={field.description}
        onChange={e => onChange(field.id, { description: e.target.value })}
        placeholder="Skriv din analyse her…"
        aria-label="Beskrivelse"
      />
      <div>
        <p className={styles.fieldHint} style={{ marginBottom: '0.5rem', fontWeight: 600, color: '#9ca3af' }}>
          Inspiration
        </p>
        <ul className={styles.examplesList}>
          {field.examples.map(example => (
            <li key={example}>{example}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const PesoFieldEditor = memo(PesoFieldEditorInner)
export default PesoFieldEditor
