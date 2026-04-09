'use client'

import type { DesignThinkingPhase } from '@/lib/frameworks'

type Props = {
  readOnly?: boolean
  activeSelection?: DesignThinkingPhase
  onSelect?: (selection: DesignThinkingPhase) => void
}

const HOTSPOTS: Array<{ id: DesignThinkingPhase; cx: number; cy: number }> = [
  { id: 'empathize', cx: 200, cy: 220 },
  { id: 'define', cx: 350, cy: 190 },
  { id: 'ideate', cx: 500, cy: 220 },
  { id: 'prototype', cx: 650, cy: 190 },
  { id: 'test', cx: 800, cy: 220 },
]

const DESIGN_THINKING_SVG = `
<svg width="1000" height="400" viewBox="0 0 1000 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .label { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: bold; font-size: 18px; fill: #444; text-anchor: middle; text-transform: uppercase; }
      .icon-stroke { stroke: #333; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .icon-fill { fill: #333; }
      .circle { mix-blend-mode: multiply; opacity: 0.8; }
    </style>
  </defs>

  <circle cx="200" cy="220" r="90" fill="#F9E076" class="circle" />
  <circle cx="350" cy="190" r="90" fill="#B4A7D6" class="circle" />
  <circle cx="500" cy="220" r="90" fill="#F6A2B3" class="circle" />
  <circle cx="650" cy="190" r="90" fill="#76D7C4" class="circle" />
  <circle cx="800" cy="220" r="90" fill="#F9B896" class="circle" />

  <text x="130" y="80" class="label" transform="rotate(-15, 130, 80)">Empathize</text>
  <path d="M150,100 L175,135" stroke="#444" stroke-width="2" fill="none" marker-end="url(#arrowhead)" />
  
  <text x="350" y="330" class="label">Define</text>
  <path d="M350,305 L350,285" stroke="#444" stroke-width="2" fill="none" marker-end="url(#arrowhead)" />

  <text x="500" y="80" class="label">Ideate</text>
  <path d="M500,95 L500,125" stroke="#444" stroke-width="2" fill="none" marker-end="url(#arrowhead)" />

  <text x="650" y="330" class="label">Prototype</text>
  <path d="M650,305 L650,285" stroke="#444" stroke-width="2" fill="none" marker-end="url(#arrowhead)" />

  <text x="870" y="80" class="label" transform="rotate(15, 870, 80)">Test</text>
  <path d="M850,100 L825,135" stroke="#444" stroke-width="2" fill="none" marker-end="url(#arrowhead)" />

  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#444" />
  </marker>

  <g transform="translate(200, 215)">
    <path class="icon-stroke" d="M0,-12 A15,15 0 0,1 30,-12 C30,8 0,28 0,33 C0,28 -30,8 -30,-12 A15,15 0 0,1 0,-12 Z" />
    <circle cx="0" cy="-4" r="5" class="icon-stroke" />
    <path class="icon-stroke" d="M -10,12 C -10,3 10,3 10,12" />
  </g>

  <g transform="translate(325, 165) rotate(-45)">
    <rect x="0" y="0" width="15" height="45" class="icon-stroke" />
    <path d="M0,45 L7.5,55 L15,45 Z" class="icon-fill" />
    <path d="M0,10 L15,10" class="icon-stroke" />
  </g>

  <g transform="translate(500, 215)">
    <path class="icon-stroke" d="M -11,10 C -25,-5 -22,-30 0,-30 C 22,-30 25,-5 11,10 L 8,18 L -8,18 Z" />
    <line x1="-8" y1="23" x2="8" y2="23" class="icon-stroke" />
    <line x1="-5" y1="28" x2="5" y2="28" class="icon-stroke" />
    <path class="icon-stroke" d="M -4,18 C -4,0 8,-5 0,-12 C -8,-5 4,0 4,18" />
    <line x1="-42" y1="-12" x2="-30" y2="-12" class="icon-stroke" />
    <line x1="-30" y1="-35" x2="-22" y2="-26" class="icon-stroke" />
    <line x1="0" y1="-45" x2="0" y2="-35" class="icon-stroke" />
    <line x1="30" y1="-35" x2="22" y2="-26" class="icon-stroke" />
    <line x1="42" y1="-12" x2="30" y2="-12" class="icon-stroke" />
  </g>

  <g transform="translate(625, 165)">
    <rect x="0" y="0" width="50" height="40" rx="2" class="icon-stroke" />
    <line x1="0" y1="10" x2="50" y2="10" class="icon-stroke" />
    <rect x="5" y="15" width="15" height="15" class="icon-stroke" />
    <line x1="5" y1="15" x2="20" y2="30" class="icon-stroke" />
    <line x1="20" y1="15" x2="5" y2="30" class="icon-stroke" />
    <line x1="28" y1="18" x2="42" y2="18" class="icon-stroke" stroke-width="1" />
    <line x1="28" y1="23" x2="42" y2="23" class="icon-stroke" stroke-width="1" />
  </g>

  <g transform="translate(780, 195)">
    <rect x="0" y="0" width="40" height="50" class="icon-stroke" />
    <path d="M10,15 L15,15 M10,25 L15,30 L25,20 M10,40 L15,45 L25,35" class="icon-stroke" />
    <line x1="20" y1="15" x2="30" y2="15" class="icon-stroke" />
  </g>
</svg>
`

export default function DesignThinkingDiagram({
  readOnly = false,
  activeSelection = 'empathize',
  onSelect,
}: Props) {
  return (
    <div className="w-full min-w-[800px]">
      <div className="relative mx-auto w-full max-w-[1000px]">
        <div className="w-full" dangerouslySetInnerHTML={{ __html: DESIGN_THINKING_SVG }} />

        {HOTSPOTS.map((spot) => {
          const isActive = activeSelection === spot.id
          return (
            <button
              key={spot.id}
              type="button"
              aria-label={spot.id}
              onClick={readOnly ? undefined : () => onSelect?.(spot.id)}
              className={readOnly ? 'cursor-default' : 'cursor-pointer'}
              style={{
                position: 'absolute',
                left: `${(spot.cx / 1000) * 100}%`,
                top: `${(spot.cy / 400) * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 180,
                height: 180,
                borderRadius: '50%',
                border: isActive ? '2px solid rgba(20, 184, 166, 0.95)' : '2px solid transparent',
                boxShadow: isActive ? '0 0 0 3px rgba(20, 184, 166, 0.2)' : 'none',
                background: 'transparent',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
