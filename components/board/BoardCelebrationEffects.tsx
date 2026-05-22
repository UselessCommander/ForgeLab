'use client'

import { memo } from 'react'

type PointEffect = { id: string; x: number; y: number; createdAt: number }
type NightEffect = PointEffect & { userId: string; expiresAt: number; emoji: '🦉' | '🦇' | '✨' }
type HighFiveEffect = PointEffect & { users: [string, string] }

type BoardCelebrationEffectsProps = {
  orbitPortalEffects: PointEffect[]
  highFiveEffects: HighFiveEffect[]
  soloSparkEffects: PointEffect[]
  soloOrbitEffects: PointEffect[]
  nightCreatureEffects: NightEffect[]
  fridayCelebrationEffects: PointEffect[]
  fridayCelebrationMs: number
  nightCreatureDurationMs: number
}

function BoardCelebrationEffectsInner({
  orbitPortalEffects,
  highFiveEffects,
  soloSparkEffects,
  soloOrbitEffects,
  nightCreatureEffects,
  fridayCelebrationEffects,
  fridayCelebrationMs,
  nightCreatureDurationMs,
}: BoardCelebrationEffectsProps) {
  const hasAny =
    orbitPortalEffects.length > 0 ||
    highFiveEffects.length > 0 ||
    soloSparkEffects.length > 0 ||
    soloOrbitEffects.length > 0 ||
    nightCreatureEffects.length > 0 ||
    fridayCelebrationEffects.length > 0

  if (!hasAny) return null

  return (
    <>
      {orbitPortalEffects.map(effect => {
        const age = Date.now() - effect.createdAt
        const progress = Math.max(0, Math.min(1, age / 1200))
        const scale = 0.4 + progress * 1.5
        const opacity = 1 - progress
        return (
          <div
            key={effect.id}
            style={{
              position: 'absolute',
              left: effect.x,
              top: effect.y,
              width: 92,
              height: 92,
              borderRadius: '50%',
              border: '3px solid rgba(99,102,241,0.92)',
              boxShadow: '0 0 24px rgba(99,102,241,0.55), inset 0 0 18px rgba(59,130,246,0.45)',
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              pointerEvents: 'none',
              zIndex: 22,
            }}
          />
        )
      })}

      {highFiveEffects.map(effect => {
        const age = Date.now() - effect.createdAt
        const progress = Math.max(0, Math.min(1, age / 1100))
        const riseY = 16 * progress
        const opacity = 1 - progress
        const handOffset = Math.max(0, 22 - progress * 42)
        const clapPop = progress < 0.5 ? progress * 2 : (1 - progress) * 2
        return (
          <div
            key={effect.id}
            style={{
              position: 'absolute',
              left: effect.x,
              top: effect.y - riseY,
              transform: 'translate(-50%, -50%) scale(1)',
              pointerEvents: 'none',
              zIndex: 23,
              opacity,
              filter: 'drop-shadow(0 5px 14px rgba(15,23,42,0.28))',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 22,
            }}
          >
            <span style={{ transform: `translateX(${handOffset}px)` }}>✋</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 0.4,
                color: '#0F172A',
                background: 'rgba(255,255,255,0.94)',
                borderRadius: 999,
                padding: '2px 8px',
                transform: `scale(${1 + clapPop * 0.4})`,
                boxShadow: `0 0 ${8 + clapPop * 16}px rgba(250,204,21,0.55)`,
              }}
            >
              CLAP!
            </span>
            <span style={{ transform: `translateX(${-handOffset}px)` }}>🤚</span>
          </div>
        )
      })}

      {soloSparkEffects.map(effect => {
        const age = Date.now() - effect.createdAt
        const progress = Math.max(0, Math.min(1, age / 1000))
        const opacity = 1 - progress
        const scale = 0.45 + progress * 1.2
        return (
          <div
            key={effect.id}
            style={{
              position: 'absolute',
              left: effect.x,
              top: effect.y,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              pointerEvents: 'none',
              zIndex: 22,
              fontSize: 22,
              filter: 'drop-shadow(0 0 12px rgba(250,204,21,0.65))',
            }}
          >
            ✨
          </div>
        )
      })}

      {soloOrbitEffects.map(effect => {
        const age = Date.now() - effect.createdAt
        const progress = Math.max(0, Math.min(1, age / 1200))
        const opacity = 1 - progress
        const rot = progress * 270
        return (
          <div
            key={effect.id}
            style={{
              position: 'absolute',
              left: effect.x,
              top: effect.y,
              width: 72,
              height: 72,
              borderRadius: '50%',
              border: '2px dashed rgba(14,165,233,0.9)',
              boxShadow: '0 0 16px rgba(14,165,233,0.45)',
              transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${0.7 + progress * 0.6})`,
              opacity,
              pointerEvents: 'none',
              zIndex: 22,
            }}
          />
        )
      })}

      {nightCreatureEffects.map(effect => {
        const age = Date.now() - effect.createdAt
        const phase = age / 220
        const driftX = Math.sin(phase) * 14
        const driftY = -16 + Math.cos(phase * 1.4) * 8
        const opacity = Math.max(
          0,
          Math.min(1, (effect.expiresAt - Date.now()) / nightCreatureDurationMs + 0.15)
        )
        return (
          <div
            key={effect.id}
            style={{
              position: 'absolute',
              left: effect.x + driftX,
              top: effect.y + driftY,
              transform: 'translate(-50%, -50%)',
              fontSize: 20,
              filter: 'drop-shadow(0 4px 10px rgba(15,23,42,0.45))',
              opacity,
              pointerEvents: 'none',
              zIndex: 21,
            }}
          >
            {effect.emoji}
          </div>
        )
      })}

      {fridayCelebrationEffects.map(effect => {
        const age = Date.now() - effect.createdAt
        const progress = Math.max(0, Math.min(1, age / fridayCelebrationMs))
        const opacity = 1 - progress
        return (
          <div
            key={effect.id}
            style={{
              position: 'absolute',
              left: effect.x,
              top: effect.y,
              width: 0,
              height: 0,
              pointerEvents: 'none',
              zIndex: 23,
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (Math.PI * 2 * i) / 12
              const radius = 16 + progress * 72
              const x = Math.cos(angle) * radius
              const y = Math.sin(angle) * radius - progress * 22
              const color = ['#F59E0B', '#EAB308', '#F97316', '#A855F7'][i % 4]
              return (
                <span
                  key={`c-${i}`}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: color,
                    opacity,
                    boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                  }}
                />
              )
            })}
            {Array.from({ length: 4 }).map((_, i) => {
              const x = (i - 1.5) * 12
              const y = -10 - progress * (34 + i * 8)
              return (
                <span
                  key={`s-${i}`}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    width: 18 + i * 4,
                    height: 18 + i * 4,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(148,163,184,0.32), rgba(148,163,184,0))',
                    opacity: opacity * 0.8,
                  }}
                />
              )
            })}
          </div>
        )
      })}
    </>
  )
}

const BoardCelebrationEffects = memo(BoardCelebrationEffectsInner)
export default BoardCelebrationEffects
