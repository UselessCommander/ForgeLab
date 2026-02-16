'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import ForgeLabLogo from '@/components/ForgeLabLogo'

declare global {
  interface Window {
    QRCode: any
  }
}

type CornerStyle = 'square' | 'rounded' | 'dot' | 'classic'

const COLOR_PRESETS = [
  { name: 'Sort', value: '#000000' },
  { name: 'Rød', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Grøn', value: '#10B981' },
  { name: 'Lyseblå', value: '#3B82F6' },
  { name: 'Mørkeblå', value: '#1E40AF' },
  { name: 'Lilla', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
]

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
  const [finalQRImage, setFinalQRImage] = useState<string | null>(null)
  
  // Customization states
  const [foregroundColor, setForegroundColor] = useState('#000000')
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')
  const [cornerStyle, setCornerStyle] = useState<CornerStyle>('square')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [centerText, setCenterText] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [savedQRCodes, setSavedQRCodes] = useState<Array<{
    id: string
    qrId: string | null
    image: string
    text: string
    originalUrl: string
    createdAt: string
    scanCount: number
  }>>([])
  const [showSaved, setShowSaved] = useState(false)
  
  const logoInputRef = useRef<HTMLInputElement>(null)
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.QRCode) {
      setQrCodeLoaded(true)
    }
    // Load saved QR codes from localStorage
    loadSavedQRCodes()
  }, [])

  const loadSavedQRCodes = () => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem('forgelab_saved_qr_codes')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSavedQRCodes(parsed)
      }
    } catch (err) {
      console.error('Fejl ved indlæsning af gemte QR koder:', err)
    }
  }

  const saveQRCode = (qrId: string | null, image: string, text: string, originalUrl: string, scanCount: number) => {
    if (typeof window === 'undefined') return
    try {
      const newQRCode = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        qrId,
        image,
        text,
        originalUrl,
        createdAt: new Date().toISOString(),
        scanCount
      }
      const updated = [...savedQRCodes, newQRCode]
      setSavedQRCodes(updated)
      localStorage.setItem('forgelab_saved_qr_codes', JSON.stringify(updated))
    } catch (err) {
      console.error('Fejl ved gemning af QR kode:', err)
    }
  }

  const deleteSavedQRCode = (id: string) => {
    if (typeof window === 'undefined') return
    try {
      const updated = savedQRCodes.filter(qr => qr.id !== id)
      setSavedQRCodes(updated)
      localStorage.setItem('forgelab_saved_qr_codes', JSON.stringify(updated))
    } catch (err) {
      console.error('Fejl ved sletning af QR kode:', err)
    }
  }

  const loadSavedQRCode = (savedQR: typeof savedQRCodes[0]) => {
    setFinalQRImage(savedQR.image)
    setQrText(savedQR.text)
    setCurrentQrId(savedQR.qrId)
    setScanCount(savedQR.scanCount)
    if (savedQR.qrId) {
      startAutoRefreshStats(savedQR.qrId)
    }
  }

  const API_URL = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:3000'

  const drawCorner = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    corner: CornerStyle,
    color: string
  ) => {
    ctx.fillStyle = color
    
    switch (corner) {
      case 'square':
        ctx.fillRect(x, y, size, size)
        break
      case 'rounded':
        const cornerRadius = size * 0.3
        ctx.beginPath()
        ctx.moveTo(x + cornerRadius, y)
        ctx.lineTo(x + size - cornerRadius, y)
        ctx.quadraticCurveTo(x + size, y, x + size, y + cornerRadius)
        ctx.lineTo(x + size, y + size - cornerRadius)
        ctx.quadraticCurveTo(x + size, y + size, x + size - cornerRadius, y + size)
        ctx.lineTo(x + cornerRadius, y + size)
        ctx.quadraticCurveTo(x, y + size, x, y + size - cornerRadius)
        ctx.lineTo(x, y + cornerRadius)
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y)
        ctx.closePath()
        ctx.fill()
        break
      case 'dot':
        ctx.beginPath()
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'classic':
        ctx.fillRect(x, y, size, size)
        ctx.fillStyle = backgroundColor
        const innerSize = size * 0.4
        const innerOffset = size * 0.3
        ctx.fillRect(x + innerOffset, y + innerOffset, innerSize, innerSize)
        ctx.fillStyle = color
        break
    }
  }, [backgroundColor])

  // Core QR code generation function
  const generateQRCode = useCallback((text: string, skipTracking: boolean = false) => {
    return new Promise<string>((resolve, reject) => {
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
          text: text,
          width: qrSize,
          height: qrSize,
          colorDark: '#000000',
          colorLight: '#FFFFFF',
          correctLevel: correctLevel
        })

        setTimeout(() => {
          const canvas = container.querySelector('canvas')
          if (!canvas) {
            reject(new Error('Kunne ikke generere QR kode canvas'))
            return
          }

          const tempCtx = canvas.getContext('2d')
          if (!tempCtx) {
            reject(new Error('Kunne ikke få canvas context'))
            return
          }
          
          const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height)
          const modules = canvas.width
          const moduleSize = canvas.width / modules

          const finalCanvas = document.createElement('canvas')
          const ctx = finalCanvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Kunne ikke få final canvas context'))
            return
          }

          const padding = 20
          const textHeight = textBelow.trim() ? 60 : 0
          finalCanvas.width = qrSize + (padding * 2)
          finalCanvas.height = qrSize + (padding * 2) + textHeight

          ctx.fillStyle = backgroundColor
          ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

          const qrStartX = padding
          const qrStartY = padding
          
          for (let y = 0; y < modules; y++) {
            for (let x = 0; x < modules; x++) {
              const index = (y * modules + x) * 4
              const r = imageData.data[index]
              const isDark = r < 128

              if (isDark) {
                const pixelX = qrStartX + x * moduleSize
                const pixelY = qrStartY + y * moduleSize
                
                const isCorner = (
                  (x < 7 && y < 7) ||
                  (x >= modules - 7 && y < 7) ||
                  (x < 7 && y >= modules - 7)
                )

                if (isCorner) {
                  drawCorner(ctx, pixelX, pixelY, moduleSize, cornerStyle, foregroundColor)
                } else {
                  ctx.fillStyle = foregroundColor
                  ctx.fillRect(pixelX, pixelY, moduleSize, moduleSize)
                }
              }
            }
          }

          const finalizeQR = () => {
            if (!ctx) return
            
            if (textBelow.trim()) {
              ctx.fillStyle = '#1a1a1a'
              ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'top'
              
              const maxWidth = qrSize - 20
              const words = textBelow.split(' ')
              let line = ''
              let y = qrSize + padding + 10
              
              for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' '
                const metrics = ctx.measureText(testLine)
                if (metrics.width > maxWidth && i > 0) {
                  ctx.fillText(line, finalCanvas.width / 2, y)
                  line = words[i] + ' '
                  y += 22
                } else {
                  line = testLine
                }
              }
              ctx.fillText(line, finalCanvas.width / 2, y)
            }
            
            resolve(finalCanvas.toDataURL('image/png'))
          }

          const addLogoAndText = () => {
            if (logoPreview || centerText) {
              const centerX = qrStartX + qrSize / 2
              const centerY = qrStartY + qrSize / 2
              const logoSize = qrSize * 0.2

              if (logoPreview) {
                const logoImg = new Image()
                logoImg.onload = () => {
                  ctx.save()
                  ctx.globalCompositeOperation = 'destination-over'
                  ctx.drawImage(logoImg, centerX - logoSize / 2, centerY - logoSize / 2, logoSize, logoSize)
                  ctx.restore()
                  finalizeQR()
                }
                logoImg.onerror = () => finalizeQR()
                logoImg.src = logoPreview
              } else if (centerText) {
                ctx.fillStyle = foregroundColor
                ctx.font = `bold ${logoSize * 0.3}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(centerText, centerX, centerY)
                finalizeQR()
              }
            } else {
              finalizeQR()
            }
          }

          addLogoAndText()
        }, 200)
      } catch (err: any) {
        reject(err)
      }
    })
  }, [qrSize, errorLevel, foregroundColor, backgroundColor, cornerStyle, logoPreview, centerText, textBelow, drawCorner])

  // Live preview effect with debouncing
  useEffect(() => {
    if (!qrCodeLoaded || !qrText.trim()) {
      setFinalQRImage(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      if (typeof window === 'undefined' || !window.QRCode) {
        return
      }

      const text = qrText.trim()
      if (!text) {
        setFinalQRImage(null)
        return
      }

      try {
        const imageData = await generateQRCode(text, true)
        setFinalQRImage(imageData)
      } catch (err: any) {
        console.error('Preview generation error:', err)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [qrText, qrCodeLoaded, generateQRCode, foregroundColor, backgroundColor, cornerStyle, logoPreview, centerText, textBelow, qrSize, errorLevel])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo filen er for stor. Maks størrelse: 5MB')
        return
      }
      if (!file.type.includes('image')) {
        setError('Logo skal være et billede')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  const refreshStats = async (qrId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/stats/${qrId}`)
      if (response.ok) {
        const data = await response.json()
        const count = data.count || 0
        setScanCount(count)
        // Update saved QR code scan count
        const updated = savedQRCodes.map(qr => 
          qr.qrId === qrId ? { ...qr, scanCount: count } : qr
        )
        setSavedQRCodes(updated)
        if (typeof window !== 'undefined') {
          localStorage.setItem('forgelab_saved_qr_codes', JSON.stringify(updated))
        }
      }
    } catch (err) {
      console.error('Kunne ikke hente statistik:', err)
    }
  }

  const startAutoRefreshStats = (qrId: string) => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
    }
    statsIntervalRef.current = setInterval(() => {
      refreshStats(qrId)
    }, 5000)
  }

  useEffect(() => {
    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current)
      }
    }
  }, [])

  // Full generation with tracking
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

    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
      statsIntervalRef.current = null
    }

    let finalText = text

    if (enableTracking) {
      try {
        // Ensure URL has protocol for tracking
        let urlToTrack = text
        if (!urlToTrack.startsWith('http://') && !urlToTrack.startsWith('https://')) {
          urlToTrack = 'https://' + urlToTrack
        }

        const response = await fetch(`${API_URL}/api/create-tracked`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: urlToTrack })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Kunne ikke oprette tracking. Er serveren startet?')
        }

        const data = await response.json()
        setCurrentQrId(data.qrId)
        
        // Construct full tracking URL
        const trackUrl = data.trackUrl || `/api/track/${data.qrId}`
        const fullTrackUrl = trackUrl.startsWith('http') 
          ? trackUrl 
          : `${API_URL}${trackUrl}`
        
        finalText = fullTrackUrl
          refreshStats(data.qrId)
          startAutoRefreshStats(data.qrId)
        
        // Generate QR code with tracking URL
        try {
          const imageData = await generateQRCode(finalText, false)
          setFinalQRImage(imageData)
          // Save to localStorage
          saveQRCode(data.qrId, imageData, finalText, urlToTrack, 0)
        } catch (err: any) {
          setError('Fejl ved generering af QR kode: ' + err.message)
        }
      } catch (err: any) {
        setError('Tracking fejl: ' + err.message)
        // Don't generate QR code if tracking fails
        return
      }
    } else {
      // Generate QR code without tracking
      try {
        const imageData = await generateQRCode(finalText, false)
        setFinalQRImage(imageData)
        // Save to localStorage
        saveQRCode(null, imageData, finalText, finalText, 0)
      } catch (err: any) {
        setError('Fejl ved generering af QR kode: ' + err.message)
      }
    }
  }

  const downloadQR = () => {
    if (!finalQRImage) {
      alert('Generer venligst en QR kode først!')
      return
    }

    const link = document.createElement('a')
    link.download = 'qr-kode.png'
    link.href = finalQRImage
    link.click()
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"
        onLoad={() => setQrCodeLoaded(true)}
      />
      <div className="min-h-screen px-4 py-8 md:py-12 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Controls */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200">
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
                <div className="flex items-center justify-center gap-3 mb-4">
                  <ForgeLabLogo size={48} />
                  <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
                    QR Code Generator
                  </h1>
                </div>
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

              {/* Basic Options */}
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

              {/* Advanced Options Toggle */}
              <div className="mb-6">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-all duration-200 flex items-center justify-between"
                >
                  <span>Avancerede Indstillinger</span>
                  <span className={showAdvanced ? 'rotate-180' : ''}>▼</span>
                </button>
              </div>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {/* Colors - Side by side layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Color Presets */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">Preset Farver</h3>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            onClick={() => setForegroundColor(preset.value)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              foregroundColor === preset.value 
                                ? 'border-gray-900 scale-110' 
                                : 'border-gray-300 hover:border-gray-500'
                            }`}
                            style={{ backgroundColor: preset.value }}
                            title={preset.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Foreground & Background Colors - Side by side */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          QR Kode Farve
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={foregroundColor}
                            onChange={(e) => setForegroundColor(e.target.value)}
                            className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={foregroundColor}
                            onChange={(e) => setForegroundColor(e.target.value)}
                            placeholder="#000000"
                            className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Baggrund Farve
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            placeholder="#FFFFFF"
                            className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Corner Styles - Smaller */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Hjørne Styles</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {(['square', 'rounded', 'dot', 'classic'] as CornerStyle[]).map((corner) => (
                        <button
                          key={corner}
                          onClick={() => setCornerStyle(corner)}
                          className={`p-2 rounded border-2 transition-all ${
                            cornerStyle === corner
                              ? 'border-gray-900 bg-gray-100'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex justify-center mb-1">
                            <div className={`w-6 h-6 bg-gray-900 ${
                              corner === 'square' ? '' :
                              corner === 'rounded' ? 'rounded-lg' :
                              corner === 'dot' ? 'rounded-full' :
                              'rounded-lg'
                            }`} />
                          </div>
                          <p className="text-[10px] font-medium text-gray-700 capitalize text-center">
                            {corner === 'square' ? 'Firkant' :
                             corner === 'rounded' ? 'Afrundet' :
                             corner === 'dot' ? 'Prik' :
                             'Klassisk'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo / Center Text */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Logo eller Center Tekst</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        onClick={removeLogo}
                        className={`px-3 py-1.5 rounded border-2 transition-all text-sm ${
                          !logoPreview && !centerText
                            ? 'border-gray-900 bg-gray-100'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <span className="text-lg">✕</span>
                      </button>
                      
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3 py-1.5 rounded border-2 border-gray-200 hover:border-gray-400 transition-all text-sm"
                      >
                        <span className="text-lg">📷</span>
                        <span className="ml-1 text-xs font-medium text-gray-700">Upload</span>
                      </button>
                      
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>

                    {logoPreview && (
                      <div className="mb-3">
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="w-16 h-16 object-contain rounded border border-gray-200"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Center tekst
                      </label>
                      <input
                        type="text"
                        value={centerText}
                        onChange={(e) => {
                          setCenterText(e.target.value)
                          if (e.target.value) removeLogo()
                        }}
                        placeholder="F.eks. Logo"
                        maxLength={10}
                        className="w-full px-3 py-2 text-sm rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">PNG, 1:1, max 5MB</p>
                    </div>
                  </div>
                </div>
              )}

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
              {finalQRImage && (
                <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex flex-col items-center">
                    <div className="mb-2 text-sm text-gray-500">
                      {qrText.trim() ? 'Live Preview' : 'Generer QR kode for at se preview'}
                    </div>
                    <div className="flex justify-center items-center">
                      <img 
                        src={finalQRImage ?? undefined} 
                        alt="QR Code" 
                        className="max-w-full h-auto rounded-lg shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tracking Info */}
              {currentQrId && (
                <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
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
            {finalQRImage && (
              <button
                onClick={downloadQR}
                className="w-full px-6 py-4 bg-gray-700 text-white rounded-lg font-medium text-lg hover:bg-gray-600 transition-all duration-200 mb-4"
              >
                Download QR Kode
              </button>
            )}

            {/* Saved QR Codes Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowSaved(!showSaved)}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-all duration-200 flex items-center justify-between"
              >
                <span>💾 Gemte QR Koder ({savedQRCodes.length})</span>
                <span className={showSaved ? 'rotate-180' : ''}>▼</span>
              </button>
              
              {showSaved && (
                <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {savedQRCodes.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Ingen gemte QR koder endnu. Generer en QR kode for at gemme den.
                    </p>
                  ) : (
                    savedQRCodes.slice().reverse().map((savedQR) => (
                      <div
                        key={savedQR.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-all"
                      >
                        <div className="flex gap-3">
                          <img
                            src={savedQR.image}
                            alt="Saved QR Code"
                            className="w-20 h-20 object-contain rounded border border-gray-200"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate mb-1">
                              {savedQR.originalUrl || savedQR.text}
                            </p>
                            <p className="text-xs text-gray-500 mb-2">
                              {new Date(savedQR.createdAt).toLocaleString('da-DK')}
                            </p>
                            {savedQR.qrId && (
                              <p className="text-xs text-gray-600 mb-2">
                                Scans: <span className="font-semibold">{savedQR.scanCount}</span>
                              </p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.download = `qr-kode-${savedQR.id.substring(0, 8)}.png`
                                  link.href = savedQR.image
                                  link.click()
                                }}
                                className="px-3 py-1.5 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                              >
                                Download
                              </button>
                              <button
                                onClick={() => loadSavedQRCode(savedQR)}
                                className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
                              >
                                Indlæs
                              </button>
                              <button
                                onClick={() => deleteSavedQRCode(savedQR.id)}
                                className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors ml-auto"
                              >
                                Slet
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

            {/* Right Column - QR Preview (on larger screens) */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                {finalQRImage ? (
                  <div className="flex flex-col items-center">
                    <div className="mb-3 text-sm font-medium text-gray-700">
                      Live Preview
                    </div>
                    <div className="flex justify-center items-center bg-gray-50 p-4 rounded-lg">
                      <img 
                        src={finalQRImage ?? undefined} 
                        alt="QR Code Preview" 
                        className="max-w-full h-auto rounded-lg shadow-md"
                      />
                    </div>
                    {currentQrId && (
                      <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 w-full">
                        <p className="text-xs text-gray-600 mb-1">Scanninger:</p>
                        <p className="text-2xl font-bold text-gray-900">{scanCount}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400">
                    <div className="text-4xl mb-2">🔲</div>
                    <p className="text-sm">Indtast tekst for at se preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
