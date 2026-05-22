'use client'

import type { ReactElement } from 'react'
import type { GoogleDesignSprintPhase } from '@/lib/frameworks'
import { getGvDesignSprintDays } from '@/lib/gv-design-sprint-framework'
import styles from '@/components/metoder/DesignSprintRedesign.module.css'

type StageConfig = {
  phaseId: GoogleDesignSprintPhase
  stageClass: string
  badge: string
  day: string
  title: string
  description: string
  chips: string[]
}

const STAGE_CLASS: Record<GoogleDesignSprintPhase, string> = {
  understand: '',
  sketch: styles.stageBlue,
  decide: styles.stagePurple,
  prototype: styles.stageGreen,
  test: styles.stagePink,
}

/** Visuelle kort — data fra GV Design Sprint playbook. */
const STAGES: StageConfig[] = getGvDesignSprintDays().map((day, index) => ({
  phaseId: day.id,
  stageClass: STAGE_CLASS[day.id],
  badge: String(index + 1).padStart(2, '0'),
  day: day.dayLabel,
  title: day.title,
  description: day.goal,
  chips: day.activities.slice(0, 3).map((a) => a.title),
}))

type DesignSprintRedesignProps = {
  selectedPhase?: GoogleDesignSprintPhase
  onPhaseSelect?: (phase: GoogleDesignSprintPhase) => void
}

function MapVisual() {
  return (
    <div className={`${styles.artifact} ${styles.mapArtifact}`}>
      <span className={styles.mapLine} />
      <span className={styles.mapLine} />
      <span className={styles.mapLine} />
      <span className={styles.mapDot} />
      <span className={styles.lens} />
    </div>
  )
}

function SketchVisual() {
  return (
    <div className={`${styles.artifact} ${styles.sketchArtifact}`}>
      <div className={styles.rings}>
        <span />
        <span />
        <span />
      </div>
      <span className={styles.wirebox} />
      <span className={styles.sketchLines} />
      <span className={styles.pen2} />
    </div>
  )
}

function DecideVisual() {
  return (
    <div className={`${styles.artifact} ${styles.decideArtifact}`}>
      <span className={styles.pointer} />
      <span className={styles.choice} />
    </div>
  )
}

function PrototypeVisual() {
  return (
    <div className={`${styles.artifact} ${styles.prototypeArtifact}`}>
      <div className={styles.windowDots}>
        <span />
        <span />
        <span />
      </div>
      <span className={styles.imageBox} />
      <span className={styles.ghostBox} />
      <span className={styles.protoLines} />
      <span className={styles.tool} />
    </div>
  )
}

function TestVisual() {
  return (
    <div className={`${styles.artifact} ${styles.testArtifact}`}>
      <span className={styles.bubble2} />
      <span className={`${styles.avatar} ${styles.avatarLeft}`} />
      <span className={`${styles.avatar} ${styles.avatarCenter}`} />
      <span className={`${styles.avatar} ${styles.avatarRight}`} />
    </div>
  )
}

const VISUALS: Record<GoogleDesignSprintPhase, () => ReactElement> = {
  understand: MapVisual,
  sketch: SketchVisual,
  decide: DecideVisual,
  prototype: PrototypeVisual,
  test: TestVisual,
}

/** Femdages sprint-board — hero/footer tilhører ForgeLab-sektionen omkring. */
export default function DesignSprintRedesign({
  selectedPhase,
  onPhaseSelect,
}: DesignSprintRedesignProps) {
  return (
    <div className={styles.root}>
      <section className={styles.board} aria-label="Design Sprint femdages proces">
        {STAGES.map((stage) => {
          const Visual = VISUALS[stage.phaseId]
          const isSelected = selectedPhase === stage.phaseId
          return (
            <article
              key={stage.phaseId}
              className={`${styles.stage} ${stage.stageClass} ${isSelected ? styles.stageSelected : ''}`}
              role={onPhaseSelect ? 'button' : undefined}
              tabIndex={onPhaseSelect ? 0 : undefined}
              onClick={onPhaseSelect ? () => onPhaseSelect(stage.phaseId) : undefined}
              onKeyDown={
                onPhaseSelect
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onPhaseSelect(stage.phaseId)
                      }
                    }
                  : undefined
              }
              aria-pressed={onPhaseSelect ? isSelected : undefined}
            >
              <div className={styles.topline}>
                <span className={styles.badge}>{stage.badge}</span>
                <span className={styles.day}>{stage.day}</span>
              </div>

              <div
                className={`${styles.visual} ${
                  stage.phaseId === 'sketch' || stage.phaseId === 'test'
                    ? styles.visualTall
                    : ''
                }`}
                aria-hidden
              >
                <span className={styles.orb} />
                <Visual />
              </div>

              <h3 className={styles.stageTitle}>{stage.title}</h3>
              <p className={styles.description}>{stage.description}</p>
              <div className={styles.chips}>
                {stage.chips.map((chip) => (
                  <span key={chip} className={styles.chip}>
                    {chip}
                  </span>
                ))}
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
