'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface QRData {
  count: number
  createdAt: string
  originalUrl: string
  scans: Array<{
    timestamp: string
    ip: string
    userAgent?: string
    referer?: string
  }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<Record<string, QRData>>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('-')

  const API_URL = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:3000'

  const loadData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const responseData = await response.json()
        setData(responseData)
        setLastUpdate(new Date().toLocaleTimeString('da-DK'))
      }
    } catch (error) {
      console.error('Fejl ved indlæsning:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const deleteQR = async (qrId: string) => {
    if (!confirm(`Er du sikker på at du vil slette QR-koden ${qrId.substring(0, 12)}...?`)) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/stats/${qrId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadData()
      } else {
        const errorData = await response.json()
        alert('Fejl ved sletning: ' + (errorData.error || 'Ukendt fejl'))
      }
    } catch (error: any) {
      console.error('Fejl ved sletning:', error)
      alert('Fejl ved sletning: ' + error.message)
    }
  }

  const deleteAllQR = async () => {
    if (!confirm('Er du sikker på at du vil slette ALLE QR-koder? Dette kan ikke fortrydes!')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/stats`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadData()
      } else {
        const errorData = await response.json()
        alert('Fejl ved sletning: ' + (errorData.error || 'Ukendt fejl'))
      }
    } catch (error: any) {
      console.error('Fejl ved sletning:', error)
      alert('Fejl ved sletning: ' + error.message)
    }
  }

  const qrCodes = Object.keys(data)
  const totalScans = qrCodes.reduce((sum, id) => sum + (data[id]?.count || 0), 0)

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-3xl p-6 md:p-10 shadow-xl border border-white/20">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold mb-6 hover:gap-3 transition-all duration-200"
            >
              <span>←</span>
              <span>Tilbage til ForgeLab</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Oversigt over alle QR-koder og scanninger
            </p>
          </div>
        </header>

        {/* Controls */}
        <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl p-4 md:p-6 shadow-lg border border-white/20 mb-6 md:mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={loadData}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              🔄 Opdater
            </button>
            <button
              onClick={deleteAllQR}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              🗑️ Slet Alle
            </button>
            <div className="ml-auto text-sm text-slate-600 dark:text-slate-400">
              Sidst opdateret: <span className="font-semibold">{lastUpdate}</span>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8">
          <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl p-6 md:p-8 shadow-lg border border-white/20 text-center">
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {qrCodes.length}
            </div>
            <div className="text-slate-600 dark:text-slate-300 font-medium">QR Koder</div>
          </div>
          <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl p-6 md:p-8 shadow-lg border border-white/20 text-center">
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {totalScans}
            </div>
            <div className="text-slate-600 dark:text-slate-300 font-medium">Total Scanninger</div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl p-12 shadow-lg border border-white/20 text-center">
            <div className="text-slate-600 dark:text-slate-300 text-lg">Indlæser data...</div>
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl p-12 md:p-16 shadow-lg border border-white/20 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Ingen QR-koder endnu
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-8">
              Generer din første QR-kode med tracking for at se statistikker her.
            </p>
            <Link 
              href="/tools/qr-generator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              Gå til QR Generator
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {qrCodes.map(qrId => {
              const qrData = data[qrId]
              const createdAt = qrData.createdAt ? new Date(qrData.createdAt).toLocaleString('da-DK') : 'Ukendt'
              const lastScan = qrData.scans && qrData.scans.length > 0 
                ? new Date(qrData.scans[qrData.scans.length - 1].timestamp).toLocaleString('da-DK')
                : 'Ingen scanninger endnu'

              return (
                <div 
                  key={qrId} 
                  className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">QR Kode</h3>
                    <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
                      {qrId.substring(0, 12)}...
                    </span>
                  </div>

                  {/* Scan Count */}
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {qrData.count || 0}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      scanninger
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Oprettet:</span>
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">{createdAt}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Sidste scan:</span>
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">{lastScan}</span>
                    </div>
                  </div>

                  {/* Original URL */}
                  {qrData.originalUrl && (
                    <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Original URL:
                      </div>
                      <div className="text-sm text-indigo-600 dark:text-indigo-400 break-all">
                        {qrData.originalUrl}
                      </div>
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteQR(qrId)}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    🗑️ Slet
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
