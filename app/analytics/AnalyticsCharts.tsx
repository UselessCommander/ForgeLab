'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

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

function getRefererLabel(referer?: string): string {
  if (!referer?.trim()) return 'Direkte'
  try {
    return new URL(referer).hostname
  } catch {
    return referer.length > 35 ? referer.slice(0, 35) + '…' : referer
  }
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
      <p className="text-xs font-medium text-sky-600/80 uppercase tracking-wider mb-4">
        Trend 7 dage{isDemo ? ' (demo)' : ''}
      </p>
      <div className="flex gap-1 items-end">
        <div className="flex flex-col justify-between text-[10px] text-gray-500 font-medium shrink-0 pr-1 h-[140px]">
          <span>{max}</span>
          <span>0</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-[120px] relative" style={{ perspective: '120px' }}>
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
          <div className="flex justify-between gap-0.5 mt-1">
            {dayLabels.map((label, i) => (
              <div key={i} className="flex flex-col items-center flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-sky-700">{trendData[i]}</span>
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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
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

type AnalyticsChartsProps = {
  /** Når sat vises kun analytics for denne QR-kode (hentes fra /api/stats/[qrId]) */
  qrId?: string
}

export default function AnalyticsCharts({ qrId }: AnalyticsChartsProps = {}) {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const base = typeof window !== 'undefined' ? window.location.origin : ''
        const url = qrId ? `${base}/api/stats/${encodeURIComponent(qrId)}` : `${base}/api/stats`
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
  }, [qrId])

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
    const colors = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#f0f9ff']
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

  return (
    <section className="mb-14">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {qrId ? 'Analytics for denne QR-kode' : 'Dine QR Analytics'}
      </h2>
      <p className="text-gray-600 mb-4 max-w-xl">
        {qrId
          ? 'Grafer og statistik kun for denne QR-kode.'
          : 'Oversigt over dine trackede QR-koder. Data er bundet til din bruger og gemt i databasen, så det er persistent.'}
      </p>

      {loading && (
        <p className="text-sm text-gray-500 mb-4">Indlæser dine analytics-data...</p>
      )}
      {error && !loading && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      {!loading && !error && !hasQrData && (
        <p className="text-sm text-gray-500 mb-4">
          Du har endnu ingen trackede QR-koder. Aktiver tracking i QR Code Generator for at se data her.
        </p>
      )}

      <StatsCards3D
        totalScans={totalScans}
        totalQrCodes={totalQrCodes}
        lastScanAt={lastScanAt}
        uniqueIPs={uniqueIPs}
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

      {hasQrData && perQRList.length > 0 && !qrId && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 mt-10 mb-2">Statistik per QR-kode</h3>
          <div className="bg-white rounded-2xl p-6 border border-sky-100 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
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
                        <span className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-xs inline-block" title={row.originalUrl}>
                          {row.originalUrl || row.id}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold text-sky-700">{row.count}</td>
                      <td className="py-3 pr-4 text-gray-500">{row.createdAt ? new Date(row.createdAt).toLocaleDateString('da-DK') : '–'}</td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/analytics/${row.id}`}
                          className="text-sky-600 hover:text-sky-700 font-medium text-sm"
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
        </>
      )}

      {hasScanData && (refererData.length > 0 || hourlyData.some((n) => n > 0)) && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 mt-10 mb-2">Trafikkilder og tidsfordeling</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {refererData.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-sky-100 shadow-lg">
                <p className="text-xs font-medium text-sky-600/80 uppercase tracking-wider mb-4">Kilde (referer)</p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-36 h-36 rounded-full border-4 border-white shadow-inner flex-shrink-0" style={{
                    background: `conic-gradient(${refererData
                      .map((d, i) => {
                        const total = refererData.reduce((s, x) => s + x.value, 0)
                        const start = (refererData.slice(0, i).reduce((s, x) => s + x.value, 0) / total) * 100
                        const end = (refererData.slice(0, i + 1).reduce((s, x) => s + x.value, 0) / total) * 100
                        return `${d.color} ${start}% ${end}%`
                      })
                      .join(', ')})`,
                  }} />
                  <div className="flex flex-col gap-1">
                    {refererData.map((d, i) => {
                      const total = refererData.reduce((s, x) => s + x.value, 0)
                      return (
                        <span key={i} className="inline-flex items-center gap-2 text-sm">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          {d.label}: {d.value} ({Math.round((d.value / total) * 100)}%)
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl p-6 border border-sky-100 shadow-lg">
              <p className="text-xs font-medium text-sky-600/80 uppercase tracking-wider mb-4">Scanninger per time (døgn)</p>
              <div className="flex items-end justify-between gap-0.5 h-[120px]">
                {hourlyData.map((val, i) => {
                  const max = Math.max(...hourlyData, 1)
                  const h = (val / max) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group" title={`${i}-${i + 1}: ${val} scans`}>
                      <div
                        className="w-full rounded-t min-h-[4px] bg-sky-500/80 hover:bg-sky-500 transition-all"
                        style={{ height: `${Math.max(h, 4)}%` }}
                      />
                      {i % 4 === 0 && <span className="text-[9px] text-gray-400 mt-1">{i}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {hasScanData && recentScansList.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 mt-10 mb-2">Seneste scanninger</h3>
          <div className="bg-white rounded-2xl p-6 border border-sky-100 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500 uppercase tracking-wider">
                    <th className="pb-2 pr-4">Tidspunkt</th>
                    <th className="pb-2 pr-4">Enhed</th>
                    <th className="pb-2 pr-4">Kilde (referer)</th>
                    <th className="pb-2 pr-4 hidden sm:table-cell">IP</th>
                    <th className="pb-2">Destination</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScansList.map((s, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap text-gray-700">{new Date(s.timestamp).toLocaleString('da-DK')}</td>
                      <td className="py-2 pr-4">{detectDevice(s.userAgent)}</td>
                      <td className="py-2 pr-4 max-w-[120px] truncate" title={s.referer || 'Direkte'}>{getRefererLabel(s.referer)}</td>
                      <td className="py-2 pr-4 hidden sm:table-cell text-gray-500 font-mono text-xs">{s.ip || '–'}</td>
                      <td className="py-2 max-w-[140px] truncate text-gray-600" title={s.originalUrl}>{s.originalUrl || s.qrId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
