'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

// Fallback demo data for visualizations (used hvis ingen rigtige data endnu)
const demoWeeklyData = [42, 68, 55, 89, 72, 95, 110]
const demoDays = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']
const demoDonutData = [
  { label: 'Mobil', value: 52, color: '#4f46e5' },
  { label: 'Desktop', value: 28, color: '#6366f1' },
  { label: 'Tablet', value: 14, color: '#818cf8' },
  { label: 'Andet', value: 6, color: '#a5b4fc' },
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

function getRefererLabel(referer?: string): string {
  if (!referer?.trim()) return 'Direkte'
  try {
    return new URL(referer).hostname
  } catch {
    return referer.length > 35 ? referer.slice(0, 35) + '…' : referer
  }
}

/** Én forklaret blok ad gangen — kun typografi + indhold, ingen ekstra rammer om indholdet */
function GuidedSection({
  label,
  title,
  description,
  children,
}: {
  label: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-12 border-b border-slate-200 pb-12 last:mb-0 last:border-b-0 last:pb-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">{label}</p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 md:text-xl">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
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
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Scanninger pr. dag{isDemo ? ' (demo)' : ''}
      </p>
      <div className="flex items-end justify-between gap-2 h-[180px]">
        {weeklyData.map((val, i) => {
          const h = (val / max) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center group">
              <div
                className="w-full min-h-[12px] rounded-t-md transition-all duration-200 group-hover:opacity-95"
                style={{
                  height: `${Math.max(h, 8)}%`,
                  background: 'linear-gradient(180deg, #6366f1 0%, #4338ca 100%)',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
                }}
              />
              <span className="mt-2 text-[10px] font-medium text-slate-500">{days[i]}</span>
              <span className="text-xs font-semibold text-indigo-700">{val}</span>
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
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Enheder{isDemo ? ' (demo)' : ''}
      </p>
      <div className="relative h-44 w-44">
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

  const max = Math.max(...trendData, 1)
  const points = trendData
    .map((v, i) => {
      const x = (trendData.length <= 1 ? 50 : (i / (trendData.length - 1))) * 100
      const y = 100 - (v / max) * 100
      return `${x},${y}`
    })
    .join(' ')
  const areaPoints = `0,100 ${points} 100,100`

  // Dage for x-aksen: seneste 7 dage (index 0 = 6 dage siden, index 6 = i dag)
  const dayLabels = trendData.map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (trendData.length - 1 - i))
    return d.toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'numeric' })
  })

  return (
    <div className="relative">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Trend 7 dage{isDemo ? ' (demo)' : ''}
      </p>
      <div className="flex gap-1 items-end">
        <div className="flex flex-col justify-between text-[10px] text-gray-500 font-medium shrink-0 pr-1 h-[140px]">
          <span>{max}</span>
          <span>0</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="relative h-[120px]">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
              <defs>
                <linearGradient id="lineAreaGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <polygon points={areaPoints} fill="url(#lineAreaGrad)" />
              <polyline
                points={points}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex justify-between gap-0.5 mt-1">
            {dayLabels.map((label, i) => (
              <div key={i} className="flex flex-col items-center flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-indigo-700">{trendData[i]}</span>
                <span className="text-[9px] text-gray-500 truncate w-full text-center" title={label}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatsCards3D(props: {
  totalScans: number
  totalQrCodes: number
  lastScanAt: string | null
  uniqueIPs: number
  hasRealData: boolean
}) {
  const { totalScans, totalQrCodes, lastScanAt, uniqueIPs, hasRealData } = props

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
          label: 'Unikke IP-adresser',
          value: String(uniqueIPs),
          sub: 'Estimat på unikke besøgende',
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
  const metricGrid =
    stats.length === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'

  return (
    <div className={`grid gap-4 ${metricGrid}`}>
      {stats.map((s, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-950/[0.02] transition-shadow hover:shadow-md"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>
        </div>
      ))}
    </div>
  )
}

type AnalyticsChartsProps = {
  /** Når sat vises kun analytics for denne QR-kode (hentes fra /api/stats/[qrId]) */
  qrId?: string
  /** guided = hver visualisering forklares for sig; par vises sammen (søjle+donut, kilde+time) */
  presentation?: 'dashboard' | 'guided'
  /** Saneret sti til projekt-board; bevares i links til QR-detaljesider */
  returnPath?: string | null
  /** Når sat (uden qrId): kun QR-koder gemt i projektets qr-generator */
  projectId?: string | null
}

function qrDetailQuery(returnPath?: string | null, projectId?: string | null) {
  const p = new URLSearchParams()
  if (returnPath) p.set('return', returnPath)
  if (projectId) p.set('project', projectId)
  const q = p.toString()
  return q ? `?${q}` : ''
}

function qrAnalyticsHref(qrId: string, returnPath?: string | null, projectId?: string | null) {
  const base = `/analytics/${encodeURIComponent(qrId)}`
  return `${base}${qrDetailQuery(returnPath, projectId)}`
}

export default function AnalyticsCharts({
  qrId,
  presentation = 'dashboard',
  returnPath,
  projectId = null,
}: AnalyticsChartsProps) {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const base = typeof window !== 'undefined' ? window.location.origin : ''
      let url: string
      if (qrId) {
        url = `${base}/api/stats/${encodeURIComponent(qrId)}`
      } else if (projectId) {
        url = `${base}/api/stats?projectId=${encodeURIComponent(projectId)}`
      } else {
        url = `${base}/api/stats`
      }
      const response = await fetch(url, {
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
        } else if (response.status === 403) {
          setError('Ingen adgang til denne QR-kode.')
        } else {
          setError('Kunne ikke hente analytics-data.')
        }
        return
      }

      const data = (await response.json()) as unknown
      if (data && typeof data === 'object' && data !== null) {
        if (qrId) {
          const raw = data as { count?: number; createdAt?: string; originalUrl?: string; scans?: ScanEntry[] }
          setStats({
            [qrId]: {
              userId: '',
              count: raw.count ?? 0,
              createdAt: raw.createdAt ?? '',
              originalUrl: raw.originalUrl ?? '',
              scans: raw.scans ?? [],
            },
          })
        } else {
          setStats(data as StatsResponse)
        }
        setLastUpdated(new Date().toLocaleTimeString('da-DK'))
      } else {
        setError('Uventet dataformat fra serveren.')
      }
    } catch (err) {
      console.error('Fejl ved indlæsning af analytics-data:', err)
      setError('Fejl ved indlæsning af analytics-data.')
    } finally {
      setLoading(false)
    }
  }, [qrId, projectId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Let siden autoopdatere hver 30. sekund, så grafer følger med nye scans
  useEffect(() => {
    const id = setInterval(fetchStats, 30000)
    return () => clearInterval(id)
  }, [fetchStats])

  const { totalScans, totalQrCodes, lastScanAt, uniqueIPs } = useMemo(() => {
    if (!stats) {
      return { totalScans: 0, totalQrCodes: 0, lastScanAt: null as string | null, uniqueIPs: 0 }
    }

    const ids = Object.keys(stats)
    const total = ids.reduce((sum, id) => sum + (stats[id]?.scans?.length ?? 0), 0)
    let latest: string | null = null
    const ipSet = new Set<string>()

    for (const id of ids) {
      const scans = stats[id]?.scans || []
      scans.forEach((s) => {
        if (s.ip) ipSet.add(s.ip)
        if (s.timestamp && (!latest || new Date(s.timestamp) > new Date(latest))) latest = s.timestamp
      })
    }

    return {
      totalScans: total,
      totalQrCodes: ids.length,
      lastScanAt: latest,
      uniqueIPs: ipSet.size,
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
      { label: 'Mobil', value: deviceBuckets.Mobil, color: '#4f46e5' },
      { label: 'Desktop', value: deviceBuckets.Desktop, color: '#6366f1' },
      { label: 'Tablet', value: deviceBuckets.Tablet, color: '#818cf8' },
      { label: 'Andet', value: deviceBuckets.Andet, color: '#a5b4fc' },
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

  // Per-QR oversigt (antal = faktiske scans fra arrayet, ikke qr_codes.count)
  const perQRList = useMemo(() => {
    if (!stats) return []
    return Object.entries(stats)
      .map(([id, qr]) => ({
        id,
        originalUrl: qr.originalUrl || '',
        count: qr.scans?.length ?? 0,
        createdAt: qr.createdAt || '',
      }))
      .sort((a, b) => b.count - a.count)
  }, [stats])

  // Referer / trafikkilde
  const refererData = useMemo(() => {
    if (!hasScanData || !stats) return []
    const map: Record<string, number> = {}
    Object.values(stats).forEach((qr) => {
      qr.scans.forEach((scan) => {
        const label = getRefererLabel(scan.referer)
        map[label] = (map[label] || 0) + 1
      })
    })
    const colors = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }))
  }, [hasScanData, stats])

  // Scanninger per time (0–23)
  const hourlyData = useMemo(() => {
    if (!hasScanData || !stats) return Array(24).fill(0)
    const counts = Array(24).fill(0)
    Object.values(stats).forEach((qr) => {
      qr.scans.forEach((scan) => {
        const h = new Date(scan.timestamp).getHours()
        if (h >= 0 && h < 24) counts[h] += 1
      })
    })
    return counts
  }, [hasScanData, stats])

  // Seneste scanninger (flad liste med qr-info)
  const recentScansList = useMemo(() => {
    if (!stats) return []
    const list: { timestamp: string; ip?: string; userAgent?: string; referer?: string; qrId: string; originalUrl: string }[] = []
    Object.entries(stats).forEach(([qrId, qr]) => {
      (qr.scans || []).forEach((s) => {
        list.push({
          timestamp: s.timestamp,
          ip: s.ip,
          userAgent: s.userAgent,
          referer: s.referer,
          qrId,
          originalUrl: qr.originalUrl || '',
        })
      })
    })
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return list.slice(0, 25)
  }, [stats])

  const chartTile = 'rounded-xl bg-white p-5 shadow-sm sm:p-6'

  const tableScroll = 'overflow-x-auto rounded-lg border border-slate-200 bg-white'

  const analyticsHeader = (
    <header className="mb-5 flex flex-col gap-3 border-b border-slate-200/90 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {qrId ? 'Analytics for denne QR-kode' : 'Dine QR Analytics'}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
          {qrId
            ? 'Grafer og statistik kun for denne QR-kode.'
            : 'Trackede QR-koder samlet ét sted — data er bundet til din bruger og gemt persistent.'}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-1 sm:items-end">
        {lastUpdated ? (
          <p className="text-xs font-medium tabular-nums text-slate-500">Sidst opdateret · {lastUpdated}</p>
        ) : null}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
          {hasScanData ? 'Live data' : 'Demo-data'}
        </p>
      </div>
    </header>
  )

  const alertsBlock = (
    <>
      {loading && <p className="mb-4 text-sm text-slate-500">Indlæser dine analytics-data...</p>}
      {error && !loading && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {!loading && !error && !hasQrData && (
        <p className="mb-4 text-sm text-slate-500">
          Du har endnu ingen trackede QR-koder. Aktiver tracking i QR Code Generator for at se data her.
        </p>
      )}
    </>
  )

  const dashboardGrid = (
    <div className="grid gap-4 md:gap-5 lg:grid-cols-12">
      <div className="lg:col-span-12">
        <StatsCards3D
          totalScans={totalScans}
          totalQrCodes={totalQrCodes}
          lastScanAt={lastScanAt}
          uniqueIPs={uniqueIPs}
          hasRealData={hasQrData}
        />
      </div>

      <div className="lg:col-span-12">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Visuelle grafer · {hasScanData ? 'dine scanninger' : 'demo indtil du har data'}
        </p>
      </div>

      <div className={`${chartTile} lg:col-span-7`}>
        <BarChart3D weeklyData={weeklyData} days={demoDays} isDemo={!hasScanData} />
      </div>
      <div className={`${chartTile} lg:col-span-5`}>
        <DonutChart3D donutData={donutData} isDemo={!hasScanData} />
      </div>
      <div className={`${chartTile} lg:col-span-12`}>
        <LineChart3D trendData={trendData} isDemo={!hasScanData} />
      </div>

      {hasQrData && perQRList.length > 0 && !qrId && (
        <div className="lg:col-span-12">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Statistik per QR-kode</h3>
          <div className={tableScroll}>
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500 uppercase tracking-wider">
                  <th className="pb-2 pr-4">Link / destination</th>
                  <th className="pb-2 pr-4 text-right">Scanninger</th>
                  <th className="pb-2 pr-4">Oprettet</th>
                  <th className="pb-2 text-right">Analytics</th>
                </tr>
              </thead>
              <tbody>
                {perQRList.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pr-4">
                      <span
                        className="inline-block max-w-[200px] truncate font-medium text-gray-900 sm:max-w-xs"
                        title={row.originalUrl}
                      >
                        {row.originalUrl || row.id}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold text-indigo-700">{row.count}</td>
                    <td className="py-3 pr-4 text-gray-500">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString('da-DK') : '–'}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={qrAnalyticsHref(row.id, returnPath, projectId)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Se →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasScanData && (refererData.length > 0 || hourlyData.some((n) => n > 0)) && (
        <>
          <h3 className="mb-3 mt-2 text-sm font-semibold text-slate-800 lg:col-span-12">
            Trafikkilder og tidsfordeling
          </h3>
          {refererData.length > 0 && (
            <div className={`${chartTile} lg:col-span-6`}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Kilde (referer)</p>
              <div className="flex flex-wrap items-center gap-4">
                <div
                  className="h-36 w-36 shrink-0 rounded-full border-4 border-white shadow-inner"
                  style={{
                    background: `conic-gradient(${refererData
                      .map((d, i) => {
                        const total = refererData.reduce((s, x) => s + x.value, 0)
                        const start = (refererData.slice(0, i).reduce((s, x) => s + x.value, 0) / total) * 100
                        const end = (refererData.slice(0, i + 1).reduce((s, x) => s + x.value, 0) / total) * 100
                        return `${d.color} ${start}% ${end}%`
                      })
                      .join(', ')})`,
                  }}
                />
                <div className="flex flex-col gap-1">
                  {refererData.map((d, i) => {
                    const total = refererData.reduce((s, x) => s + x.value, 0)
                    return (
                      <span key={i} className="inline-flex items-center gap-2 text-sm">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.label}: {d.value} ({Math.round((d.value / total) * 100)}%)
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          <div className={`${chartTile} ${refererData.length > 0 ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Scanninger per time (døgn)
            </p>
            <div className="flex h-[120px] items-end justify-between gap-0.5">
              {hourlyData.map((val, i) => {
                const max = Math.max(...hourlyData, 1)
                const h = (val / max) * 100
                const showHourLabel = val > 0 || i % 3 === 0
                return (
                  <div
                    key={i}
                    className="group flex flex-1 flex-col items-center"
                    title={`${i}:00–${i + 1}:00 • ${val} scanninger`}
                  >
                    {val > 0 && (
                      <span className="mb-0.5 text-[9px] font-semibold leading-none text-indigo-700">{val}</span>
                    )}
                    <div
                      className="min-h-[4px] w-full rounded-t bg-indigo-500/90 transition-colors hover:bg-indigo-600"
                      style={{ height: `${Math.max(h, 4)}%` }}
                    />
                    <span className="mt-1 text-[9px] text-gray-400">{showHourLabel ? i : ''}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {hasScanData && recentScansList.length > 0 && (
        <div className="lg:col-span-12">
          <h3 className="mb-3 mt-2 text-sm font-semibold text-slate-800">Seneste scanninger</h3>
          <div className={tableScroll}>
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500 uppercase tracking-wider">
                  <th className="pb-2 pr-4">Tidspunkt</th>
                  <th className="pb-2 pr-4">Enhed</th>
                  <th className="pb-2 pr-4">Kilde (referer)</th>
                  <th className="hidden pb-2 pr-4 sm:table-cell">IP</th>
                  <th className="pb-2">Destination</th>
                </tr>
              </thead>
              <tbody>
                {recentScansList.map((s, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="whitespace-nowrap py-2 pr-4 text-gray-700">
                      {new Date(s.timestamp).toLocaleString('da-DK')}
                    </td>
                    <td className="py-2 pr-4">{detectDevice(s.userAgent)}</td>
                    <td className="max-w-[120px] truncate py-2 pr-4" title={s.referer || 'Direkte'}>
                      {getRefererLabel(s.referer)}
                    </td>
                    <td className="hidden py-2 pr-4 font-mono text-xs text-gray-500 sm:table-cell">{s.ip || '–'}</td>
                    <td className="max-w-[140px] truncate py-2 text-gray-600" title={s.originalUrl}>
                      {s.originalUrl || s.qrId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <section className="mb-6 md:mb-8">
      {presentation === 'guided' ? (
        <>
          <div className="mb-10 space-y-4">
            {analyticsHeader}
            {alertsBlock}
          </div>

          {!loading && !error && (
            <>
              <GuidedSection
                label="Trin 1 · Nøgletal"
                title="De vigtigste tal først"
                description="Antal trackede QR-koder, samlede scanninger, et groft estimat af unikke besøgende og tidspunktet for seneste scan. Brug det som et hurtigt helhedsbillede — før du dykker ned i mønstrene nedenfor."
              >
                <StatsCards3D
                  totalScans={totalScans}
                  totalQrCodes={totalQrCodes}
                  lastScanAt={lastScanAt}
                  uniqueIPs={uniqueIPs}
                  hasRealData={hasQrData}
                />
              </GuidedSection>

              <GuidedSection
                label="Trin 2 · Uge og enhed"
                title="Hvornår scannes der — og på hvilken skærm?"
                description="De to visninger hører sammen: søjlerne viser rytmen over ugen (fx peak efter nyhedsbrev eller event), mens donutten viser om folk primært scanner fra mobil, desktop eller tablet. Det styrer både timing af kampagner og hvordan destinationssiden bør optimeres."
              >
                <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
                  <div className={`${chartTile} lg:col-span-7`}>
                    <BarChart3D weeklyData={weeklyData} days={demoDays} isDemo={!hasScanData} />
                  </div>
                  <div className={`${chartTile} lg:col-span-5`}>
                    <DonutChart3D donutData={donutData} isDemo={!hasScanData} />
                  </div>
                </div>
              </GuidedSection>

              <GuidedSection
                label="Trin 3 · Trend"
                title="Momentum over de seneste syv dage"
                description="Her lægges daglige scanninger i én kurve. Stigende linje efter en kampagne, flad linje i hverdagen eller fald — det giver et fælles sprog om effekt og gør det lettere at reagere tidligt."
              >
                <LineChart3D trendData={trendData} isDemo={!hasScanData} />
              </GuidedSection>

              {hasQrData && perQRList.length > 0 && !qrId && (
                <GuidedSection
                  label="Trin 4 · Per QR-kode"
                  title="Hvilken destination driver mest?"
                  description="Hvert sporret link har sit eget scan-tælleri. Brug tabellen til at sammenligne koder og åbn «Se» for at zoome ind på én QR med fuld detaljegrafik."
                >
                  <div className={tableScroll}>
                    <table className="w-full min-w-[520px] text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-500 uppercase tracking-wider">
                          <th className="pb-2 pr-4">Link / destination</th>
                          <th className="pb-2 pr-4 text-right">Scanninger</th>
                          <th className="pb-2 pr-4">Oprettet</th>
                          <th className="pb-2 text-right">Analytics</th>
                        </tr>
                      </thead>
                      <tbody>
                        {perQRList.map((row) => (
                          <tr key={row.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-3 pr-4">
                              <span
                                className="inline-block max-w-[200px] truncate font-medium text-gray-900 sm:max-w-xs"
                                title={row.originalUrl}
                              >
                                {row.originalUrl || row.id}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right font-semibold text-indigo-700">{row.count}</td>
                            <td className="py-3 pr-4 text-gray-500">
                              {row.createdAt ? new Date(row.createdAt).toLocaleDateString('da-DK') : '–'}
                            </td>
                            <td className="py-3 text-right">
                              <Link
                                href={qrAnalyticsHref(row.id, returnPath, projectId)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                              >
                                Se →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GuidedSection>
              )}

              {hasScanData && (refererData.length > 0 || hourlyData.some((n) => n > 0)) && (
                <GuidedSection
                  label="Trin 5 · Kilde og døgn"
                  title="Hvor kommer trafikken fra — og hvornår på døgnet?"
                  description="Referer-fordelingen viser om folk finder QR’en via direkte åbning, sociale medier eller jeres website. Timefordelingen viser om scanninger samler sig i arbejdstid, aftener eller weekender — nyttigt når I planlægger udsendelser og bemanding."
                >
                  <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
                    {refererData.length > 0 && (
                      <div className={`${chartTile} lg:col-span-6`}>
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Kilde (referer)
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                          <div
                            className="h-36 w-36 shrink-0 rounded-full border-4 border-white shadow-inner"
                            style={{
                              background: `conic-gradient(${refererData
                                .map((d, i) => {
                                  const total = refererData.reduce((s, x) => s + x.value, 0)
                                  const start = (refererData.slice(0, i).reduce((s, x) => s + x.value, 0) / total) * 100
                                  const end = (refererData.slice(0, i + 1).reduce((s, x) => s + x.value, 0) / total) * 100
                                  return `${d.color} ${start}% ${end}%`
                                })
                                .join(', ')})`,
                            }}
                          />
                          <div className="flex flex-col gap-1">
                            {refererData.map((d, i) => {
                              const total = refererData.reduce((s, x) => s + x.value, 0)
                              return (
                                <span key={i} className="inline-flex items-center gap-2 text-sm">
                                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                                  {d.label}: {d.value} ({Math.round((d.value / total) * 100)}%)
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    <div
                      className={`${chartTile} ${refererData.length > 0 ? 'lg:col-span-6' : 'lg:col-span-12'}`}
                    >
                      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Scanninger per time (døgn)
                      </p>
                      <div className="flex h-[120px] items-end justify-between gap-0.5">
                        {hourlyData.map((val, i) => {
                          const max = Math.max(...hourlyData, 1)
                          const h = (val / max) * 100
                          const showHourLabel = val > 0 || i % 3 === 0
                          return (
                            <div
                              key={i}
                              className="group flex flex-1 flex-col items-center"
                              title={`${i}:00–${i + 1}:00 • ${val} scanninger`}
                            >
                              {val > 0 && (
                                <span className="mb-0.5 text-[9px] font-semibold leading-none text-indigo-700">
                                  {val}
                                </span>
                              )}
                              <div
                                className="min-h-[4px] w-full rounded-t bg-indigo-500/90 transition-colors hover:bg-indigo-600"
                                style={{ height: `${Math.max(h, 4)}%` }}
                              />
                              <span className="mt-1 text-[9px] text-gray-400">{showHourLabel ? i : ''}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </GuidedSection>
              )}

              {hasScanData && recentScansList.length > 0 && (
                <GuidedSection
                  label="Trin 6 · Log"
                  title="Seneste scanninger"
                  description="En kompakt log med tidspunkt, enhed, henvisningskilde og destination. Velegnet til fejlsøgning, QA eller når I skal dokumentere konkrete events over for team eller kunde."
                >
                  <div className={tableScroll}>
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-gray-500 uppercase tracking-wider">
                          <th className="pb-2 pr-4">Tidspunkt</th>
                          <th className="pb-2 pr-4">Enhed</th>
                          <th className="pb-2 pr-4">Kilde (referer)</th>
                          <th className="hidden pb-2 pr-4 sm:table-cell">IP</th>
                          <th className="pb-2">Destination</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentScansList.map((s, i) => (
                          <tr key={i} className="border-b border-gray-100 last:border-0">
                            <td className="whitespace-nowrap py-2 pr-4 text-gray-700">
                              {new Date(s.timestamp).toLocaleString('da-DK')}
                            </td>
                            <td className="py-2 pr-4">{detectDevice(s.userAgent)}</td>
                            <td className="max-w-[120px] truncate py-2 pr-4" title={s.referer || 'Direkte'}>
                              {getRefererLabel(s.referer)}
                            </td>
                            <td className="hidden py-2 pr-4 font-mono text-xs text-gray-500 sm:table-cell">{s.ip || '–'}</td>
                            <td className="max-w-[140px] truncate py-2 text-gray-600" title={s.originalUrl}>
                              {s.originalUrl || s.qrId}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GuidedSection>
              )}
            </>
          )}
        </>
      ) : (
        <div className="space-y-6">
          {analyticsHeader}
          {alertsBlock}
          {!loading && !error && dashboardGrid}
        </div>
      )}
    </section>
  )
}
