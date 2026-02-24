'use client'

import { useEffect, useMemo, useState } from 'react'

// Fallback demo data for visualizations (used hvis ingen rigtige data endnu)
const demoWeeklyData = [42, 68, 55, 89, 72, 95, 110]
const demoDays = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']
const demoDonutData = [
  { label: 'Mobil', value: 52, color: '#0ea5e9' },
  { label: 'Desktop', value: 28, color: '#38bdf8' },
  { label: 'Tablet', value: 14, color: '#7dd3fc' },
  { label: 'Andet', value: 6, color: '#bae6fd' },
]
const demoTrendData = [30, 45, 40, 60, 55, 75, 90]

type ScanEntry = {
  timestamp: string
  ip?: string
  userAgent?: string
  referer?: string
}

type QRStats = {
  userId: string
  count: number
  createdAt: string
  originalUrl: string
  scans: ScanEntry[]
}

type StatsResponse = Record<string, QRStats>

function getWeekdayLabel(dateStr: string) {
  const d = new Date(dateStr)
  // JS: 0 = søn ... 6 = lør → vi vil have Man–Søn
  const day = d.getDay() // 0-6
  // Map til index i demoDays
  const mapping = [6, 0, 1, 2, 3, 4, 5] // søn->6, man->0, tir->1 ...
  return mapping[day]
}

function detectDevice(userAgent?: string): 'Mobil' | 'Desktop' | 'Tablet' | 'Andet' {
  if (!userAgent) return 'Andet'
  const ua = userAgent.toLowerCase()
  if (ua.includes('ipad') || ua.includes('tablet')) return 'Tablet'
  if (
    ua.includes('iphone') ||
    ua.includes('android') && ua.includes('mobile') ||
    ua.includes('mobile')
  ) {
    return 'Mobil'
  }
  if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) return 'Desktop'
  return 'Andet'
}

function BarChart3D({ weeklyData, days, isDemo }: { weeklyData: number[]; days: string[]; isDemo: boolean }) {
  if (!weeklyData.length) {
    return (
      <div className="text-sm text-gray-500">
        Ingen scanninger endnu. Generer en QR-kode med tracking for at se grafer her.
      </div>
    )
  }

  const max = Math.max(...weeklyData)
  return (
    <div className="relative">
      <p className="text-xs font-medium text-sky-600/80 uppercase tracking-wider mb-4">
        Scanninger pr. dag{isDemo ? ' (demo)' : ''}
      </p>
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

function DonutChart3D({
  donutData,
  isDemo,
}: {
  donutData: { label: string; value: number; color: string }[]
  isDemo: boolean
}) {
  const total = donutData.reduce((s, d) => s + d.value, 0)

  if (!total) {
    return (
      <div className="text-sm text-gray-500">
        Ingen enhedsdata endnu. Når dine QR-koder bliver scannet, kan du se fordelingen her.
      </div>
    )
  }

  const circumference = 2 * Math.PI * 32
  let offset = 0
  return (
    <div className="relative flex flex-col items-center">
      <p className="text-xs font-medium text-sky-600/80 uppercase tracking-wider mb-4">
        Enheder{isDemo ? ' (demo)' : ''}
      </p>
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

function LineChart3D({ trendData, isDemo }: { trendData: number[]; isDemo: boolean }) {
  if (!trendData.length) {
    return (
      <div className="text-sm text-gray-500">
        Ingen historik endnu. Når dine QR-koder får scanninger over tid, vises trenden her.
      </div>
    )
  }

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
      <p className="text-xs font-medium text-sky-600/80 uppercase tracking-wider mb-4">
        Trend 7 dage{isDemo ? ' (demo)' : ''}
      </p>
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

function StatsCards3D(props: {
  totalScans: number
  totalQrCodes: number
  lastScanAt: string | null
  hasRealData: boolean
}) {
  const { totalScans, totalQrCodes, lastScanAt, hasRealData } = props

  const stats = hasRealData
    ? [
        {
          label: 'Dine QR-koder',
          value: String(totalQrCodes),
          sub: 'Bundet til din bruger',
        },
        {
          label: 'Samlet antal scanninger',
          value: String(totalScans),
          sub: 'Alle trackede QR-koder',
        },
        {
          label: 'Seneste scan',
          value: lastScanAt
            ? new Date(lastScanAt).toLocaleString('da-DK')
            : 'Ingen scanninger endnu',
          sub: '',
        },
      ]
    : [
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
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const base = typeof window !== 'undefined' ? window.location.origin : ''
        const response = await fetch(`${base}/api/stats`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            setError('Log ind for at se dine analytics.')
          } else {
            setError('Kunne ikke hente analytics-data.')
          }
          return
        }

        const data = (await response.json()) as unknown
        if (data && typeof data === 'object') {
          setStats(data as StatsResponse)
        } else {
          setError('Uventet dataformat fra serveren.')
        }
      } catch (err) {
        console.error('Fejl ved indlæsning af analytics-data:', err)
        setError('Fejl ved indlæsning af analytics-data.')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const { totalScans, totalQrCodes, lastScanAt } = useMemo(() => {
    if (!stats) {
      return { totalScans: 0, totalQrCodes: 0, lastScanAt: null as string | null }
    }

    const ids = Object.keys(stats)
    const total = ids.reduce((sum, id) => sum + (stats[id]?.count || 0), 0)
    let latest: string | null = null

    for (const id of ids) {
      const scans = stats[id]?.scans || []
      if (scans.length > 0) {
        const ts = scans[scans.length - 1].timestamp
        if (!latest || new Date(ts) > new Date(latest)) {
          latest = ts
        }
      }
    }

    return {
      totalScans: total,
      totalQrCodes: ids.length,
      lastScanAt: latest,
    }
  }, [stats])

  // Har brugeren overhovedet QR-koder?
  const hasQrData = !!stats && Object.keys(stats).length > 0
  // Har brugeren faktiske scanninger?
  const hasScanData = hasQrData && totalScans > 0

  const weeklyData = useMemo(() => {
    if (!hasScanData || !stats) return demoWeeklyData

    const counts = Array(7).fill(0)
    Object.values(stats).forEach((qr) => {
      qr.scans.forEach((scan) => {
        const idx = getWeekdayLabel(scan.timestamp)
        if (idx >= 0 && idx < 7) {
          counts[idx] += 1
        }
      })
    })

    // Hvis alt er 0 (ingen timestamps), brug demo
    return counts.every((c) => c === 0) ? demoWeeklyData : counts
  }, [hasScanData, stats])

  const donutData = useMemo(() => {
    if (!hasScanData || !stats) return demoDonutData

    const deviceBuckets: Record<'Mobil' | 'Desktop' | 'Tablet' | 'Andet', number> = {
      Mobil: 0,
      Desktop: 0,
      Tablet: 0,
      Andet: 0,
    }

    Object.values(stats).forEach((qr) => {
      qr.scans.forEach((scan) => {
        const device = detectDevice(scan.userAgent)
        deviceBuckets[device] += 1
      })
    })

    const total = Object.values(deviceBuckets).reduce((a, b) => a + b, 0)
    if (!total) return demoDonutData

    // Brug de samme farver som demo, men med rigtige værdier
    return [
      { label: 'Mobil', value: deviceBuckets.Mobil, color: '#0ea5e9' },
      { label: 'Desktop', value: deviceBuckets.Desktop, color: '#38bdf8' },
      { label: 'Tablet', value: deviceBuckets.Tablet, color: '#7dd3fc' },
      { label: 'Andet', value: deviceBuckets.Andet, color: '#bae6fd' },
    ]
  }, [hasScanData, stats])

  const trendData = useMemo(() => {
    if (!hasScanData || !stats) return demoTrendData

    // Trend: scanninger per dag de seneste 7 dage (kronologisk)
    const now = new Date()
    const buckets: number[] = []

    for (let i = 6; i >= 0; i--) {
      const day = new Date(now)
      day.setDate(now.getDate() - i)
      const dayStart = new Date(day)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)

      let countForDay = 0
      Object.values(stats).forEach((qr) => {
        qr.scans.forEach((scan) => {
          const ts = new Date(scan.timestamp)
          if (ts >= dayStart && ts <= dayEnd) {
            countForDay += 1
          }
        })
      })

      buckets.push(countForDay)
    }

    return buckets.every((c) => c === 0) ? demoTrendData : buckets
  }, [hasScanData, stats])

  return (
    <section className="mb-14">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Dine QR Analytics</h2>
      <p className="text-gray-600 mb-4 max-w-xl">
        Oversigt over dine trackede QR-koder. Data er bundet til din bruger og gemt i databasen, så det er
        persistent.
      </p>

      {loading && (
        <p className="text-sm text-gray-500 mb-4">Indlæser dine analytics-data...</p>
      )}
      {error && !loading && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      {!loading && !error && !hasRealData && (
        <p className="text-sm text-gray-500 mb-4">
          Du har endnu ingen trackede QR-koder. Aktiver tracking i QR Code Generator for at se data her.
        </p>
      )}

      <StatsCards3D
        totalScans={totalScans}
        totalQrCodes={totalQrCodes}
        lastScanAt={lastScanAt}
        hasRealData={hasQrData}
      />

      <h3 className="text-sm font-semibold text-gray-700 mt-6 mb-2">
        Visuelle grafer {hasScanData ? '(baseret på dine data)' : '(demo indtil du har scanninger)'}
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="bg-white rounded-2xl p-6 border border-sky-100 shadow-lg shadow-sky-100/50 transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/40 hover:-translate-y-0.5"
          style={{
            transform: 'perspective(800px) rotateY(-2deg) rotateX(1deg)',
            boxShadow: '0 25px 50px -12px rgba(14, 165, 233, 0.15), 0 0 0 1px rgba(14, 165, 233, 0.05)',
          }}
        >
          <BarChart3D weeklyData={weeklyData} days={demoDays} isDemo={!hasScanData} />
        </div>
        <div
          className="bg-white rounded-2xl p-6 border border-sky-100 shadow-lg shadow-sky-100/50 transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/40 hover:-translate-y-0.5"
          style={{
            transform: 'perspective(800px) rotateY(0deg) rotateX(2deg)',
            boxShadow: '0 25px 50px -12px rgba(14, 165, 233, 0.15), 0 0 0 1px rgba(14, 165, 233, 0.05)',
          }}
        >
          <DonutChart3D donutData={donutData} isDemo={!hasScanData} />
        </div>
        <div
          className="bg-white rounded-2xl p-6 border border-sky-100 shadow-lg shadow-sky-100/50 transition-all duration-300 hover:shadow-xl hover:shadow-sky-200/40 hover:-translate-y-0.5 lg:col-span-1"
          style={{
            transform: 'perspective(800px) rotateY(2deg) rotateX(1deg)',
            boxShadow: '0 25px 50px -12px rgba(14, 165, 233, 0.15), 0 0 0 1px rgba(14, 165, 233, 0.05)',
          }}
        >
          <LineChart3D trendData={trendData} isDemo={!hasScanData} />
        </div>
      </div>
    </section>
  )
}
