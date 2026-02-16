'use client'

const ILLUSTRATION_COLORS: Record<string, { fill: string; stroke: string; accent: string }> = {
  'qr-generator': { fill: '#fef3c7', stroke: '#f59e0b', accent: '#d97706' },
  'swot-generator': { fill: '#d1fae5', stroke: '#059669', accent: '#047857' },
  'business-model-canvas': { fill: '#e0f2fe', stroke: '#0284c7', accent: '#0369a1' },
  'gantt-chart': { fill: '#ede9fe', stroke: '#7c3aed', accent: '#5b21b6' },
  'gallup-kompasrose': { fill: '#ffe4e6', stroke: '#e11d48', accent: '#be123c' },
  'tows-matrix': { fill: '#ffedd5', stroke: '#ea580c', accent: '#c2410c' },
  'porters-five-forces': { fill: '#e0e7ff', stroke: '#4f46e5', accent: '#3730a3' },
  'value-proposition-canvas': { fill: '#ccfbf1', stroke: '#0d9488', accent: '#0f766e' },
  'empathy-map': { fill: '#fce7f3', stroke: '#db2777', accent: '#be185d' },
  'card-sorting': { fill: '#cffafe', stroke: '#0891b2', accent: '#0e7490' },
  'maslow-model': { fill: '#fef3c7', stroke: '#b45309', accent: '#92400e' },
}

function getColors(slug: string) {
  return ILLUSTRATION_COLORS[slug] ?? { fill: '#f5f3ff', stroke: '#7c3aed', accent: '#5b21b6' }
}

export function ToolIllustration({ slug }: { slug: string }) {
  const c = getColors(slug)

  switch (slug) {
    case 'qr-generator': {
      const qrPattern = (i: number, j: number) => ((i + j) % 3 === 0 || (i * 7 + j) % 5 === 0) && !((i < 3 && j < 3) || (i < 3 && j > 9) || (i > 9 && j < 3))
      return (
        <svg viewBox="0 0 160 160" className="w-full h-auto max-h-[280px]" aria-hidden>
          <rect width="160" height="160" rx="16" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) =>
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((j) =>
              qrPattern(i, j) ? (
                <rect key={`${i}-${j}`} x={20 + i * 10} y={20 + j * 10} width="8" height="8" rx="1" fill={c.accent} />
              ) : null
            )
          )}
          <rect x="24" y="24" width="32" height="32" rx="4" fill="none" stroke={c.stroke} strokeWidth="3" />
          <rect x="28" y="28" width="24" height="24" fill={c.accent} />
          <rect x="104" y="24" width="32" height="32" rx="4" fill="none" stroke={c.stroke} strokeWidth="3" />
          <rect x="108" y="28" width="24" height="24" fill={c.accent} />
          <rect x="24" y="104" width="32" height="32" rx="4" fill="none" stroke={c.stroke} strokeWidth="3" />
          <rect x="28" y="108" width="24" height="24" fill={c.accent} />
        </svg>
      )
    }

    case 'swot-generator':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-auto max-h-[280px]" aria-hidden>
          <rect width="200" height="200" rx="16" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
          <line x1="100" y1="0" x2="100" y2="200" stroke={c.stroke} strokeWidth="2" />
          <line x1="0" y1="100" x2="200" y2="100" stroke={c.stroke} strokeWidth="2" />
          <text x="50" y="55" textAnchor="middle" fill={c.accent} fontWeight="bold" fontSize="14" fontFamily="system-ui">S</text>
          <text x="50" y="75" textAnchor="middle" fill={c.stroke} fontSize="10" fontFamily="system-ui">Styrker</text>
          <text x="150" y="55" textAnchor="middle" fill={c.accent} fontWeight="bold" fontSize="14" fontFamily="system-ui">W</text>
          <text x="150" y="75" textAnchor="middle" fill={c.stroke} fontSize="10" fontFamily="system-ui">Svagheder</text>
          <text x="50" y="155" textAnchor="middle" fill={c.accent} fontWeight="bold" fontSize="14" fontFamily="system-ui">O</text>
          <text x="50" y="175" textAnchor="middle" fill={c.stroke} fontSize="10" fontFamily="system-ui">Muligheder</text>
          <text x="150" y="155" textAnchor="middle" fill={c.accent} fontWeight="bold" fontSize="14" fontFamily="system-ui">T</text>
          <text x="150" y="175" textAnchor="middle" fill={c.stroke} fontSize="10" fontFamily="system-ui">Trusler</text>
        </svg>
      )

    case 'business-model-canvas':
      return (
        <svg viewBox="0 0 200 140" className="w-full h-auto max-h-[280px]" aria-hidden>
          <rect width="200" height="140" rx="12" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={8 + col * 64}
                y={8 + row * 42}
                width="60"
                height="38"
                rx="6"
                fill="white"
                stroke={c.stroke}
                strokeWidth="1.5"
              />
            ))
          )}
        </svg>
      )

    case 'gantt-chart':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-auto max-h-[280px]" aria-hidden>
          <rect width="200" height="120" rx="12" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
          <line x1="50" y1="0" x2="50" y2="120" stroke={c.stroke} strokeWidth="1" strokeDasharray="4" />
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={55 + i * 45}
              y={25 + i * 28}
              width={35 + i * 15}
              height="18"
              rx="4"
              fill={c.accent}
            />
          ))}
          <text x="25" y="40" fill={c.stroke} fontSize="9" fontFamily="system-ui">Opg 1</text>
          <text x="25" y="68" fill={c.stroke} fontSize="9" fontFamily="system-ui">Opg 2</text>
          <text x="25" y="96" fill={c.stroke} fontSize="9" fontFamily="system-ui">Opg 3</text>
        </svg>
      )

    case 'gallup-kompasrose':
      return (
        <svg viewBox="0 0 160 160" className="w-full h-auto max-h-[280px]" aria-hidden>
          <circle cx="80" cy="80" r="70" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i / 8) * Math.PI * 2 - Math.PI / 2
            const x1 = 80 + 65 * Math.cos(a)
            const y1 = 80 + 65 * Math.sin(a)
            return <line key={i} x1="80" y1="80" x2={x1} y2={y1} stroke={c.stroke} strokeWidth="1.5" />
          })}
          <circle cx="80" cy="80" r="25" fill="white" stroke={c.accent} strokeWidth="2" />
          <path d="M 80 60 L 84 78 L 80 75 L 76 78 Z" fill={c.accent} />
        </svg>
      )

    case 'tows-matrix':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-auto max-h-[280px]" aria-hidden>
          <rect width="200" height="200" rx="16" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
          <line x1="100" y1="0" x2="100" y2="200" stroke={c.stroke} strokeWidth="2" />
          <line x1="0" y1="100" x2="200" y2="100" stroke={c.stroke} strokeWidth="2" />
          <text x="50" y="55" textAnchor="middle" fill={c.accent} fontWeight="bold" fontSize="12" fontFamily="system-ui">SO</text>
          <text x="150" y="55" textAnchor="middle" fill={c.accent} fontWeight="bold" fontSize="12" fontFamily="system-ui">WO</text>
          <text x="50" y="155" textAnchor="middle" fill={c.accent} fontWeight="bold" fontSize="12" fontFamily="system-ui">ST</text>
          <text x="150" y="155" textAnchor="middle" fill={c.accent} fontWeight="bold" fontSize="12" fontFamily="system-ui">WT</text>
        </svg>
      )

    case 'porters-five-forces':
      return (
        <svg viewBox="0 0 180 180" className="w-full h-auto max-h-[280px]" aria-hidden>
          <circle cx="90" cy="90" r="70" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
          <circle cx="90" cy="90" r="28" fill="white" stroke={c.accent} strokeWidth="2" />
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2
            const x = 90 + 50 * Math.cos(a)
            const y = 90 + 50 * Math.sin(a)
            return (
              <g key={i}>
                <line x1="90" y1="90" x2={x} y2={y} stroke={c.stroke} strokeWidth="2" />
                <circle cx={x} cy={y} r="12" fill={c.accent} />
              </g>
            )
          })}
        </svg>
      )

    case 'value-proposition-canvas':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-auto max-h-[280px]" aria-hidden>
          <rect width="200" height="120" rx="12" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
          <ellipse cx="70" cy="60" rx="45" ry="45" fill="white" stroke={c.stroke} strokeWidth="2" />
          <ellipse cx="130" cy="60" rx="45" ry="45" fill="white" stroke={c.accent} strokeWidth="2" />
          <text x="70" y="55" textAnchor="middle" fill={c.stroke} fontSize="10" fontFamily="system-ui">Kunde</text>
          <text x="70" y="68" textAnchor="middle" fill={c.stroke} fontSize="9" fontFamily="system-ui">profil</text>
          <text x="130" y="55" textAnchor="middle" fill={c.stroke} fontSize="10" fontFamily="system-ui">Værdi</text>
          <text x="130" y="68" textAnchor="middle" fill={c.stroke} fontSize="9" fontFamily="system-ui">tilbud</text>
        </svg>
      )

    case 'empathy-map':
      return (
        <svg viewBox="0 0 160 160" className="w-full h-auto max-h-[280px]" aria-hidden>
          <circle cx="80" cy="80" r="70" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
          <ellipse cx="80" cy="65" rx="20" ry="18" fill="white" stroke={c.stroke} strokeWidth="1.5" />
          <path d="M 65 85 Q 80 100 95 85" stroke={c.accent} strokeWidth="2" fill="none" strokeLinecap="round" />
          <line x1="80" y1="0" x2="80" y2="160" stroke={c.stroke} strokeWidth="1" strokeDasharray="3" />
          <line x1="0" y1="80" x2="160" y2="80" stroke={c.stroke} strokeWidth="1" strokeDasharray="3" />
          <text x="40" y="35" textAnchor="middle" fill={c.stroke} fontSize="8" fontFamily="system-ui">Ser</text>
          <text x="120" y="35" textAnchor="middle" fill={c.stroke} fontSize="8" fontFamily="system-ui">Tænker</text>
          <text x="40" y="145" textAnchor="middle" fill={c.stroke} fontSize="8" fontFamily="system-ui">Gør</text>
          <text x="120" y="145" textAnchor="middle" fill={c.stroke} fontSize="8" fontFamily="system-ui">Føler</text>
        </svg>
      )

    case 'card-sorting':
      return (
        <svg viewBox="0 0 180 120" className="w-full h-auto max-h-[280px]" aria-hidden>
          <rect width="180" height="120" rx="12" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={20 + i * 8}
              y={25 + i * 25}
              width="100"
              height="22"
              rx="6"
              fill="white"
              stroke={c.stroke}
              strokeWidth="1.5"
            />
          ))}
          <circle cx="140" cy="56" r="20" fill={c.accent} opacity="0.3" />
          <text x="140" y="61" textAnchor="middle" fill={c.accent} fontSize="12" fontFamily="system-ui">?</text>
        </svg>
      )

    case 'maslow-model':
      return (
        <svg viewBox="0 0 140 180" className="w-full h-auto max-h-[280px]" aria-hidden>
          <rect width="140" height="180" rx="12" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
          {/* Pyramid tiers */}
          <path d="M 70 20 L 120 170 L 20 170 Z" fill="none" stroke={c.stroke} strokeWidth="2" />
          <path d="M 70 20 L 105 120 L 35 120 Z" fill="white" stroke={c.stroke} strokeWidth="1.5" opacity="0.9" />
          <path d="M 70 20 L 92 85 L 48 85 Z" fill="white" stroke={c.stroke} strokeWidth="1.5" opacity="0.95" />
          <path d="M 70 20 L 82 55 L 58 55 Z" fill={c.accent} opacity="0.5" stroke={c.stroke} strokeWidth="1.5" />
          <text x="70" y="42" textAnchor="middle" fill={c.accent} fontSize="8" fontFamily="system-ui">Selvreal.</text>
          <text x="70" y="72" textAnchor="middle" fill={c.stroke} fontSize="8" fontFamily="system-ui">Anerkendelse</text>
          <text x="70" y="102" textAnchor="middle" fill={c.stroke} fontSize="8" fontFamily="system-ui">Socialt</text>
          <text x="70" y="155" textAnchor="middle" fill={c.stroke} fontSize="8" fontFamily="system-ui">Behov</text>
        </svg>
      )

    default:
      return (
        <svg viewBox="0 0 160 160" className="w-full h-auto max-h-[280px]" aria-hidden>
          <rect width="160" height="160" rx="16" fill={c.fill} stroke={c.stroke} strokeWidth="2" />
          <rect x="40" y="40" width="80" height="80" rx="8" fill="white" stroke={c.accent} strokeWidth="2" />
        </svg>
      )
  }
}
