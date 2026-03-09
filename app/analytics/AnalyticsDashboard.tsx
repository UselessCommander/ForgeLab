'use client'

import { useEffect, useState } from 'react'
import { QrCode, Clock, TrendingUp, Users, MapPin, Calendar, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface QRCodeAnalytics {
  qrId: string
  originalUrl: string
  createdAt: string
  totalScans: number
  uniqueScans: number
  lastScanned: string | null
  scansByDate: Record<string, number>
  scansByIP: Record<string, number>
  topIPs: Array<{ ip: string; count: number }>
}

interface AnalyticsData {
  qrCodes: QRCodeAnalytics[]
  summary: {
    totalQRCodes: number
    totalAllScans: number
    totalUniqueScans: number
  }
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/qr')
      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Aldrig'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('da-DK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Aldrig'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Lige nu'
    if (diffMins < 60) return `For ${diffMins} min siden`
    if (diffHours < 24) return `For ${diffHours} timer siden`
    if (diffDays < 7) return `For ${diffDays} dage siden`
    return formatDate(dateString)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-4"></div>
          <p className="text-gray-600">Indlæser analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800 font-medium mb-2">Fejl ved indlæsning</p>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={loadAnalytics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Prøv igen
        </button>
      </div>
    )
  }

  if (!data || data.qrCodes.length === 0) {
    return null // Vis ingenting når der ikke er data
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">QR Koder</p>
            <QrCode className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.summary.totalQRCodes}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Samlet Scanninger</p>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.summary.totalAllScans}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Unikke Scanninger</p>
            <Users className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.summary.totalUniqueScans}</p>
        </div>
      </div>

      {/* QR Code List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Dine QR Koder</h2>
        {data.qrCodes.map((qr) => (
          <div
            key={qr.qrId}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-semibold text-gray-900">QR Kode</h3>
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                    {qr.qrId.slice(0, 8)}...
                  </span>
                </div>
                <a
                  href={qr.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  {qr.originalUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-gray-600" />
                  <p className="text-xs font-medium text-gray-600">Total Scanninger</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{qr.totalScans}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-gray-600" />
                  <p className="text-xs font-medium text-gray-600">Unikke Scanninger</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{qr.uniqueScans}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <p className="text-xs font-medium text-gray-600">Sidst Scannet</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatRelativeTime(qr.lastScanned)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(qr.lastScanned)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <p className="text-xs font-medium text-gray-600">Top IP'er</p>
                </div>
                <div className="space-y-1">
                  {qr.topIPs.slice(0, 2).map(({ ip, count }) => (
                    <div key={ip} className="flex justify-between items-center">
                      <span className="text-xs font-mono text-gray-700">{ip.slice(0, 12)}...</span>
                      <span className="text-xs font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
                  {qr.topIPs.length === 0 && (
                    <p className="text-xs text-gray-500">Ingen data</p>
                  )}
                </div>
              </div>
            </div>

            {/* Scan Timeline */}
            {Object.keys(qr.scansByDate).length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Scanninger pr. dag (sidste 7 dage)</p>
                <div className="flex items-end gap-2 h-32">
                  {Object.entries(qr.scansByDate)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .slice(-7)
                    .map(([date, count]) => {
                      const maxCount = Math.max(...Object.values(qr.scansByDate))
                      const height = maxCount > 0 ? (count / maxCount) * 100 : 0
                      return (
                        <div key={date} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-amber-500 rounded-t-lg min-h-[4px] transition-all"
                            style={{ height: `${Math.max(height, 4)}%` }}
                          />
                          <span className="text-[10px] text-gray-500 mt-2">
                            {new Date(date).toLocaleDateString('da-DK', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-xs font-semibold text-gray-900">{count}</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
