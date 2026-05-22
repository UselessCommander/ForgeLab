import type { KeyboardEvent } from 'react'
import type { PesoZoneShape as PesoZoneShapeType } from './peso-data'

type SvgShapeProps = {
  zone: PesoZoneShapeType
  className?: string
  onClick?: () => void
  onKeyDown?: (e: KeyboardEvent) => void
  role?: string
  tabIndex?: number
  'aria-label'?: string
}

export function PesoZoneShapeSvg({
  zone,
  className,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  'aria-label': ariaLabel,
}: SvgShapeProps) {
  if (zone.kind === 'circle') {
    return (
      <circle
        cx={zone.cx}
        cy={zone.cy}
        r={zone.r}
        className={className}
        onClick={onClick}
        onKeyDown={onKeyDown}
        role={role}
        tabIndex={tabIndex}
        aria-label={ariaLabel}
      />
    )
  }

  return (
    <ellipse
      cx={zone.cx}
      cy={zone.cy}
      rx={zone.rx}
      ry={zone.ry}
      transform={`rotate(${zone.rotate} ${zone.cx} ${zone.cy})`}
      className={className}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
    />
  )
}
