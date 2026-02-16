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
  const [textBelow, setTextBelow] = useState('')
  const [qrCodeLoaded, setQrCodeLoaded] = useState(false)
  const [currentQrId, setCurrentQrId] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [error, setError] = useState('')
  const [qrImageSrc, setQrImageSrc] = useState<string | null>(null)
  const [finalQRImage, setFinalQRImage] = useState<string | null>(null)

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
          // Use full URL for QR code
          const fullTrackUrl = trackUrl.startsWith('http') 
            ? trackUrl 
            : `${API_URL}${trackUrl}`
          finalText = fullTrackUrl
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
          const qrImageData = canvas.toDataURL('image/png')
          setQrImageSrc(qrImageData)
          
          // Add text below if provided
          if (textBelow.trim()) {
            const finalCanvas = document.createElement('canvas')
            const ctx = finalCanvas.getContext('2d')
            const img = new Image()
            
            img.onload = () => {
              const padding = 20
              const textHeight = 50
              finalCanvas.width = qrSize + (padding * 2)
              finalCanvas.height = qrSize + (padding * 2) + textHeight
              
              // White background
              ctx!.fillStyle = '#FFFFFF'
              ctx!.fillRect(0, 0, finalCanvas.width, finalCanvas.height)
              
              // Draw QR code
              ctx!.drawImage(img, padding, padding, qrSize, qrSize)
              
              // Draw text below
              ctx!.fillStyle = '#1a1a1a'
              ctx!.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              ctx!.textAlign = 'center'
              ctx!.textBaseline = 'top'
              
              // Word wrap text
              const maxWidth = qrSize - 20
              const words = textBelow.split(' ')
              let line = ''
              let y = qrSize + padding + 10
              
              for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' '
                const metrics = ctx!.measureText(testLine)
                if (metrics.width > maxWidth && i > 0) {
                  ctx!.fillText(line, finalCanvas.width / 2, y)
                  line = words[i] + ' '
                  y += 22
                } else {
                  line = testLine
                }
              }
              ctx!.fillText(line, finalCanvas.width / 2, y)
              
              setFinalQRImage(finalCanvas.toDataURL('image/png'))
            }
            
            img.src = qrImageData
          } else {
            setFinalQRImage(qrImageData)
          }
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
    const imageToDownload = finalQRImage || qrImageSrc
    if (!imageToDownload) {
      alert('Generer venligst en QR kode først!')
      return
    }

    const link = document.createElement('a')
    link.download = 'qr-kode.png'
    link.href = imageToDownload
    link.click()
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"
        onLoad={() => setQrCodeLoaded(true)}
      />
      <div className="min-h-screen px-4 py-8 md:py-12 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-200">
            {/* Back Link */}
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 text-gray-700 font-medium mb-8 hover:text-gray-900 transition-colors"
            >
              <span>←</span>
              <span>Tilbage til Dashboard</span>
            </Link>
            
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
                QR Code Generator
              </h1>
            </div>
            
            {/* Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indtast tekst eller URL
              </label>
              <textarea
                value={qrText}
                onChange={(e) => setQrText(e.target.value)}
                placeholder="Skriv din tekst eller URL her..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 resize-none min-h-[100px]"
              />
            </div>

            {/* Tracking Checkbox */}
            <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <input
                type="checkbox"
                id="enableTracking"
                checked={enableTracking}
                onChange={(e) => setEnableTracking(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
              />
              <label htmlFor="enableTracking" className="text-gray-700 font-medium cursor-pointer">
                Aktiver scanning tracking
              </label>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Størrelse
                </label>
                <input
                  type="number"
                  value={qrSize}
                  onChange={(e) => setQrSize(parseInt(e.target.value))}
                  min="100"
                  max="500"
                  step="50"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fejlkorrektion
                </label>
                <select
                  value={errorLevel}
                  onChange={(e) => setErrorLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200"
                >
                  <option value="L">Lav</option>
                  <option value="M">Medium</option>
                  <option value="Q">Høj</option>
                  <option value="H">Meget høj</option>
                </select>
              </div>
            </div>

            {/* Text Below Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tekst nedenunder QR-koden (valgfrit)
              </label>
              <input
                type="text"
                value={textBelow}
                onChange={(e) => setTextBelow(e.target.value)}
                placeholder="F.eks. Scan mig for at besøge hjemmesiden"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generateQR}
              className="w-full px-6 py-4 bg-gray-900 text-white rounded-lg font-medium text-lg hover:bg-gray-800 transition-all duration-200 mb-6"
            >
              Generer QR Kode
            </button>
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            {/* QR Code Display */}
            {(finalQRImage || qrImageSrc) && (
              <div className="mb-6 p-6 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex justify-center items-center">
                  <img 
                    src={finalQRImage || qrImageSrc} 
                    alt="QR Code" 
                    className="max-w-full h-auto rounded-lg shadow-sm"
                  />
                </div>
              </div>
            )}
            
            {/* Tracking Info */}
            {currentQrId && (
              <div className="mb-6 p-5 rounded-lg bg-gray-50 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  📊 Tracking Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">QR ID:</span>{' '}
                    <code className="px-2 py-1 rounded bg-white border border-gray-200 text-xs font-mono">
                      {currentQrId}
                    </code>
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Antal scanninger:</span>{' '}
                    <span className="text-gray-900 font-bold text-lg">{scanCount}</span>
                  </p>
                </div>
              </div>
            )}
            
            {/* Download Button */}
            {qrImageSrc && (
              <button
                onClick={downloadQR}
                className="w-full px-6 py-4 bg-gray-700 text-white rounded-lg font-medium text-lg hover:bg-gray-600 transition-all duration-200"
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
