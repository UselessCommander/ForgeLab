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
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (response.ok) {
        const responseData = await response.json()
        // Only update if we got valid data
        if (responseData && typeof responseData === 'object') {
          setData(responseData)
          setLastUpdate(new Date().toLocaleTimeString('da-DK'))
        } else {
          console.warn('⚠️ Received invalid data from API:', responseData)
        }
      } else {
        console.error('❌ Failed to load data:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Fejl ved indlæsning:', error)
      // Don't clear existing data on error, just log it
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadData()
    }, 5000)
    
    // Also refresh when window gains focus (user comes back to tab)
    const handleFocus = () => {
      loadData()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
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
    <div className="min-h-screen px-4 py-8 md:py-12 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-200">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-gray-700 font-medium mb-6 hover:text-gray-900 transition-colors"
            >
              <span>←</span>
              <span>Tilbage til Dashboard</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Oversigt over alle QR-koder og scanninger
            </p>
          </div>
        </header>

        {/* Controls */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 mb-6 md:mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={loadData}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
            >
              🔄 Opdater
            </button>
            <button
              onClick={deleteAllQR}
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200"
            >
              🗑️ Slet Alle
            </button>
            <div className="ml-auto text-sm text-gray-600">
              Sidst opdateret: <span className="font-medium">{lastUpdate}</span>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-200 text-center">
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {qrCodes.length}
            </div>
            <div className="text-gray-600 font-medium">QR Koder</div>
          </div>
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-200 text-center">
            <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {totalScans}
            </div>
            <div className="text-gray-600 font-medium">Total Scanninger</div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
            <div className="text-gray-600 text-lg">Indlæser data...</div>
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 md:p-16 shadow-sm border border-gray-200 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Ingen QR-koder endnu
            </h2>
            <p className="text-gray-600 mb-8">
              Generer din første QR-kode med tracking for at se statistikker her.
            </p>
            <Link 
              href="/tools/qr-generator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-200"
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
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">QR Kode</h3>
                    <span className="px-3 py-1 rounded-lg bg-gray-100 text-xs font-mono text-gray-600">
                      {qrId.substring(0, 12)}...
                    </span>
                  </div>

                  {/* Scan Count */}
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-gray-900 mb-2">
                      {qrData.count || 0}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      scanninger
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 font-medium">Sidste scan:</span>
                      <span className="text-gray-900 font-medium">{lastScan}</span>
                    </div>
                  </div>

                  {/* Original URL */}
                  {qrData.originalUrl && (
                    <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        Original URL:
                      </div>
                      <div className="text-sm text-gray-700 break-all">
                        {qrData.originalUrl}
                      </div>
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteQR(qrId)}
                    className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200"
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
