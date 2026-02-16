'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'

declare global {
  interface Window {
    QRCode: any
  }
}

export default function QRGenerator() {
  const [qrText, setQrText] = useState('')
  const [qrSize, setQrSize] = useState(200)
  const [errorLevel, setErrorLevel] = useState('M')
  const [enableTracking, setEnableTracking] = useState(false)
  const [qrCodeLoaded, setQrCodeLoaded] = useState(false)
  const [currentQrId, setCurrentQrId] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [error, setError] = useState('')
  const [qrImageSrc, setQrImageSrc] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.QRCode) {
      setQrCodeLoaded(true)
    }
  }, [])

  const API_URL = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:3000'

  const generateQR = async () => {
    if (typeof window === 'undefined' || !window.QRCode) {
      setError('QRCode biblioteket kunne ikke indlæses. Genindlæs siden.')
      return
    }

    const text = qrText.trim()
    if (!text) {
      setError('Indtast venligst tekst eller URL!')
      return
    }

    setError('')
    setCurrentQrId(null)
    setScanCount(0)
    setQrImageSrc(null)

    let finalText = text
    let trackUrl = null

    if (enableTracking) {
      try {
        if (!text.startsWith('http://') && !text.startsWith('https://')) {
          finalText = 'http://' + text
        }

        const response = await fetch(`${API_URL}/api/create-tracked`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: finalText })
        })

        if (response.ok) {
          const data = await response.json()
          setCurrentQrId(data.qrId)
          trackUrl = data.trackUrl
          finalText = trackUrl
          refreshStats(data.qrId)
          startAutoRefreshStats(data.qrId)
        } else {
          throw new Error('Kunne ikke oprette tracking. Er serveren startet?')
        }
      } catch (err: any) {
        setError('Tracking fejl: ' + err.message)
      }
    }

    try {
      const container = document.createElement('div')
      const errorLevelMap: { [key: string]: number } = {
        'L': 0,
        'M': 1,
        'Q': 2,
        'H': 3
      }
      const correctLevel = errorLevelMap[errorLevel] || 1

      new window.QRCode(container, {
        text: finalText,
        width: qrSize,
        height: qrSize,
        colorDark: '#000000',
        colorLight: '#FFFFFF',
        correctLevel: correctLevel
      })

      setTimeout(() => {
        const canvas = container.querySelector('canvas')
        if (canvas) {
          setQrImageSrc(canvas.toDataURL('image/png'))
        }
      }, 200)
    } catch (err: any) {
      setError('Fejl ved generering af QR kode: ' + err.message)
    }
  }

  const refreshStats = async (qrId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/stats/${qrId}`)
      if (response.ok) {
        const data = await response.json()
        setScanCount(data.count || 0)
      }
    } catch (err) {
      console.error('Kunne ikke hente statistik:', err)
    }
  }

  const startAutoRefreshStats = (qrId: string) => {
    const interval = setInterval(() => {
      refreshStats(qrId)
    }, 5000)
    return () => clearInterval(interval)
  }

  const downloadQR = () => {
    if (!qrImageSrc) {
      alert('Generer venligst en QR kode først!')
      return
    }

    const link = document.createElement('a')
    link.download = 'qr-kode.png'
    link.href = qrImageSrc
    link.click()
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"
        onLoad={() => setQrCodeLoaded(true)}
      />
      <div className="min-h-screen px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-3xl p-6 md:p-10 shadow-xl border border-white/20">
            {/* Back Link */}
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold mb-8 hover:gap-3 transition-all duration-200"
            >
              <span>←</span>
              <span>Tilbage til ForgeLab</span>
            </Link>
            
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                QR Code Generator
              </h1>
            </div>
            
            {/* Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Indtast tekst eller URL
              </label>
              <textarea
                value={qrText}
                onChange={(e) => setQrText(e.target.value)}
                placeholder="Skriv din tekst eller URL her..."
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 resize-none min-h-[100px]"
              />
            </div>

            {/* Tracking Checkbox */}
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                id="enableTracking"
                checked={enableTracking}
                onChange={(e) => setEnableTracking(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="enableTracking" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                Aktiver scanning tracking
              </label>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Størrelse
                </label>
                <input
                  type="number"
                  value={qrSize}
                  onChange={(e) => setQrSize(parseInt(e.target.value))}
                  min="100"
                  max="500"
                  step="50"
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Fejlkorrektion
                </label>
                <select
                  value={errorLevel}
                  onChange={(e) => setErrorLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                >
                  <option value="L">Lav</option>
                  <option value="M">Medium</option>
                  <option value="Q">Høj</option>
                  <option value="H">Meget høj</option>
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateQR}
              className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mb-6"
            >
              Generer QR Kode
            </button>
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            {/* QR Code Display */}
            {qrImageSrc && (
              <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-center items-center min-h-[200px]">
                  <img 
                    src={qrImageSrc} 
                    alt="QR Code" 
                    className="max-w-full h-auto rounded-xl shadow-lg"
                  />
                </div>
              </div>
            )}
            
            {/* Tracking Info */}
            {currentQrId && (
              <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800">
                <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-3">
                  📊 Tracking Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">QR ID:</span>{' '}
                    <code className="px-2 py-1 rounded bg-white dark:bg-slate-800 text-xs font-mono">
                      {currentQrId}
                    </code>
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">Antal scanninger:</span>{' '}
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">{scanCount}</span>
                  </p>
                </div>
              </div>
            )}
            
            {/* Download Button */}
            {qrImageSrc && (
              <button
                onClick={downloadQR}
                className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Download QR Kode
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
