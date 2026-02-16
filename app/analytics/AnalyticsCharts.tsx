'use client'

// Mock data for demo visualizations
const weeklyData = [42, 68, 55, 89, 72, 95, 110]
const days = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']
const donutData = [
  { label: 'Mobil', value: 52, color: '#0ea5e9' },
  { label: 'Desktop', value: 28, color: '#38bdf8' },
  { label: 'Tablet', value: 14, color: '#7dd3fc' },
  { label: 'Andet', value: 6, color: '#bae6fd' },
]
const trendData = [30, 45, 40, 60, 55, 75, 90]

function BarChart3D() {
  const max = Math.max(...weeklyData)
  return (
    <div className="relative">
      <p className="text-xs font-medium text-sky-600/80 uppercase tracking-wider mb-4">Scanninger pr. dag (demo)</p>
      <div className="flex items-end justify-between gap-2 h-[180px]">
        {weeklyData.map((val, i) => {
          const h = (val / max) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center group">
              <div
                className="w-full rounded-t-lg min-h-[12px] transition-all duration-300 group-hover:brightness-110"
                style={{
                  height: `${Math.max(h, 8)}%`,
                  background: 'linear-gradient(180deg, #0ea5e9 0%, #0369a1 100%)',
                  boxShadow: '0 4px 0 rgba(2, 132, 199, 0.4), 0 6px 12px rgba(14, 165, 233, 0.3)',
                  transform: 'perspective(120px) rotateX(8deg)',
                }}
              />
              <span className="text-[10px] font-medium text-gray-500 mt-2">{days[i]}</span>
              <span className="text-xs font-semibold text-sky-700">{val}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DonutChart3D() {
  const total = donutData.reduce((s, d) => s + d.value, 0)
  const circumference = 2 * Math.PI * 32
  let offset = 0
  return (
    <div className="relative flex flex-col items-center">
      <p className="text-xs font-medium text-sky-600/80 uppercase tracking-wider mb-4">Enheder (demo)</p>
      <div className="relative w-44 h-44" style={{ perspective: '200px' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <defs>
            <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
            </filter>
            {donutData.map((d, i) => (
              <linearGradient key={i} id={`donutGrad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={d.color} stopOpacity="1" />
                <stop offset="100%" stopColor={d.color} stopOpacity="0.75" />
              </linearGradient>
            ))}
          </defs>
          {donutData.map((d, i) => {
            const pct = d.value / total
            const dash = pct * circumference
            const strokeDasharray = `${dash} ${circumference - dash}`
            const strokeDashoffset = -offset * circumference
            offset += pct
            return (
              <circle
                key={i}
                cx="50"
                cy="50"
                r="32"
                fill="none"
                stroke={`url(#donutGrad${i})`}
                strokeWidth="14"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                filter="url(#donutShadow)"
                className="transition-all duration-500"
              />
            )
          })}
          <circle cx="50" cy="50" r="20" fill="#f8fafc" />
        </svg>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-3">
        {donutData.map((d, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            {d.label} {Math.round((d.value / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  )
}

function LineChart3D() {
  const max = Math.max(...trendData)
  const points = trendData
    .map((v, i) => {
      const x = (i / (trendData.length - 1)) * 100
      const y = 100 - (v / max) * 100
      return `${x},${y}`
    })
    .join(' ')
  const areaPoints = `0,100 ${points} 100,100`
  return (
    <div className="relative">
      <p className="text-xs font-medium text-sky-600/80 uppercase tracking-wider mb-4">Trend 7 dage (demo)</p>
      <div className="h-[140px] relative" style={{ perspective: '120px' }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="lineAreaGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#lineAreaGrad)" />
          <polyline
            points={points}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}

function StatsCards3D() {
  const stats = [
    { label: 'Scanninger (uge)', value: '531', sub: 'demo' },
    { label: 'Peak dag', value: 'Søndag', sub: '110 scans' },
    { label: 'Top enhed', value: 'Mobil', sub: '52%' },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
      {stats.map((s, i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-5 border border-sky-100 shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          style={{
            transform: `perspective(600px) rotateY(${-1 + i}deg) rotateX(1deg)`,
            boxShadow: '0 10px 30px -10px rgba(14, 165, 233, 0.2), 0 0 0 1px rgba(14, 165, 233, 0.06)',
          }}
        >
          <p className="text-xs font-medium text-sky-600/80 uppercase tracking-wider">{s.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsCharts() {
  return (
    <section className="mb-14">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Sådan kan det se ud</h2>
      <p className="text-gray-600 mb-6 max-w-xl">
        Når du er logget ind, får du grafer og tal som disse — med dine egne data.
      </p>
      <StatsCards3D />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="bg-white rounded-2xl p-6 border border-sky-100 shadow-lg shadow-sky-100/50 transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/40 hover:-translate-y-0.5"
          style={{
            transform: 'perspective(800px) rotateY(-2deg) rotateX(1deg)',
            boxShadow: '0 25px 50px -12px rgba(14, 165, 233, 0.15), 0 0 0 1px rgba(14, 165, 233, 0.05)',
          }}
        >
          <BarChart3D />
        </div>
        <div
          className="bg-white rounded-2xl p-6 border border-sky-100 shadow-lg shadow-sky-100/50 transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/40 hover:-translate-y-0.5"
          style={{
            transform: 'perspective(800px) rotateY(0deg) rotateX(2deg)',
            boxShadow: '0 25px 50px -12px rgba(14, 165, 233, 0.15), 0 0 0 1px rgba(14, 165, 233, 0.05)',
          }}
        >
          <DonutChart3D />
        </div>
        <div
          className="bg-white rounded-2xl p-6 border border-sky-100 shadow-lg shadow-sky-100/50 transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/40 hover:-translate-y-0.5 lg:col-span-1"
          style={{
            transform: 'perspective(800px) rotateY(2deg) rotateX(1deg)',
            boxShadow: '0 25px 50px -12px rgba(14, 165, 233, 0.15), 0 0 0 1px rgba(14, 165, 233, 0.05)',
          }}
        >
          <LineChart3D />
        </div>
      </div>
    </section>
  )
}
