'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Script from 'next/script'

declare global {
  interface Window {
    QRCode: any
  }
}

type PatternStyle = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'star' | 'diamond' | 'lines' | 'blob' | 'pixel' | 'wave' | 'cross' | 'heart'
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
  const [patternStyle, setPatternStyle] = useState<PatternStyle>('square')
  const [cornerStyle, setCornerStyle] = useState<CornerStyle>('square')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [centerText, setCenterText] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.QRCode) {
      setQrCodeLoaded(true)
    }
  }, [])

  // Live preview effect with debouncing
  useEffect(() => {
    if (!qrCodeLoaded || !qrText.trim()) {
      return
    }

    const timeoutId = setTimeout(() => {
      generateQRPreview()
    }, 500) // Debounce 500ms

    return () => clearTimeout(timeoutId)
  }, [qrText, qrSize, errorLevel, foregroundColor, backgroundColor, patternStyle, cornerStyle, logoPreview, centerText, textBelow, qrCodeLoaded])

  const API_URL = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:3000'

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

  const drawPattern = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    pattern: PatternStyle,
    color: string
  ) => {
    ctx.fillStyle = color
    const centerX = x + size / 2
    const centerY = y + size / 2
    
    switch (pattern) {
      case 'square':
        ctx.fillRect(x, y, size, size)
        break
      case 'dots':
        const radius = size / 2
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'rounded':
        const cornerRadius = size * 0.2
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
      case 'extra-rounded':
        ctx.beginPath()
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'star':
        // 5-pointed star
        ctx.beginPath()
        const starRadius = size * 0.45
        const spikes = 5
        for (let i = 0; i < spikes * 2; i++) {
          const angle = (i * Math.PI) / spikes - Math.PI / 2
          const r = i % 2 === 0 ? starRadius : starRadius * 0.4
          const px = centerX + Math.cos(angle) * r
          const py = centerY + Math.sin(angle) * r
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fill()
        break
      case 'diamond':
        // Diamond shape
        ctx.beginPath()
        ctx.moveTo(centerX, y)
        ctx.lineTo(x + size, centerY)
        ctx.lineTo(centerX, y + size)
        ctx.lineTo(x, centerY)
        ctx.closePath()
        ctx.fill()
        break
      case 'lines':
        // Horizontal lines
        ctx.fillRect(x, y + size * 0.2, size, size * 0.15)
        ctx.fillRect(x, y + size * 0.65, size, size * 0.15)
        break
      case 'blob':
        // Organic blob shape (deterministic based on position)
        ctx.beginPath()
        const blobRadius = size * 0.4
        const points = 8
        const seed = (x + y) % 7 // Deterministic seed based on position
        for (let i = 0; i < points; i++) {
          const angle = (i * Math.PI * 2) / points
          const variation = Math.sin(seed + i) * 0.2 + Math.cos(seed * 2 + i) * 0.1
          const radius = blobRadius + variation * blobRadius
          const px = centerX + Math.cos(angle) * radius
          const py = centerY + Math.sin(angle) * radius
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fill()
        break
      case 'pixel':
        // Pixel art style - smaller squares
        const pixelSize = size / 3
        ctx.fillRect(x + pixelSize, y, pixelSize, pixelSize)
        ctx.fillRect(x, y + pixelSize, pixelSize, pixelSize)
        ctx.fillRect(x + pixelSize * 2, y + pixelSize, pixelSize, pixelSize)
        ctx.fillRect(x + pixelSize, y + pixelSize * 2, pixelSize, pixelSize)
        break
      case 'wave':
        // Wave pattern
        ctx.beginPath()
        const waveHeight = size * 0.3
        ctx.moveTo(x, centerY)
        for (let i = 0; i <= size; i += 2) {
          const waveY = centerY + Math.sin((i / size) * Math.PI * 4) * waveHeight
          ctx.lineTo(x + i, waveY)
        }
        ctx.lineTo(x + size, y + size)
        ctx.lineTo(x, y + size)
        ctx.closePath()
        ctx.fill()
        break
      case 'cross':
        // Cross shape
        const crossWidth = size * 0.3
        ctx.fillRect(centerX - crossWidth / 2, y, crossWidth, size)
        ctx.fillRect(x, centerY - crossWidth / 2, size, crossWidth)
        break
      case 'heart':
        // Heart shape
        ctx.beginPath()
        ctx.moveTo(centerX, centerY + size * 0.15)
        ctx.bezierCurveTo(centerX, centerY, x + size * 0.2, y + size * 0.2, x + size * 0.2, centerY)
        ctx.bezierCurveTo(x + size * 0.2, centerY + size * 0.1, centerX, centerY + size * 0.3, centerX, centerY + size * 0.5)
        ctx.bezierCurveTo(centerX, centerY + size * 0.3, x + size * 0.8, centerY + size * 0.1, x + size * 0.8, centerY)
        ctx.bezierCurveTo(x + size * 0.8, y + size * 0.2, centerX, centerY, centerX, centerY + size * 0.15)
        ctx.closePath()
        ctx.fill()
        break
    }
  }

  const drawCorner = (
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
        // Classic QR code corner with inner square
        ctx.fillRect(x, y, size, size)
        ctx.fillStyle = backgroundColor
        const innerSize = size * 0.4
        const innerOffset = size * 0.3
        ctx.fillRect(x + innerOffset, y + innerOffset, innerSize, innerSize)
        ctx.fillStyle = color
        break
    }
  }

  // Core QR code generation function (used by both preview and full generation)
  const generateQRCode = (text: string, skipTracking: boolean = false) => {
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
                  drawPattern(ctx, pixelX, pixelY, moduleSize, patternStyle, foregroundColor)
                }
              }
            }
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

          addLogoAndText()
        }, 200)
      } catch (err: any) {
        reject(err)
      }
    })
  }

  // Preview generation (without tracking)
  const generateQRPreview = async () => {
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
      // Silently fail for preview
      console.error('Preview generation error:', err)
    }
  }

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
      const imageData = await generateQRCode(finalText, false)
      setFinalQRImage(imageData)
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
        <div className="max-w-4xl mx-auto">
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
              <div className="space-y-6 mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                {/* Colors */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Vælg Farver</h3>
                  
                  {/* Color Presets */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preset Farver
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => setForegroundColor(preset.value)}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
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

                  {/* Foreground Color */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      QR Kode Farve (Hex)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={foregroundColor}
                        onChange={(e) => setForegroundColor(e.target.value)}
                        placeholder="#000000"
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Baggrund Farve (Hex)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        placeholder="#FFFFFF"
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Pattern Styles */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pattern Styles</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {([
                      'square', 'dots', 'rounded', 'extra-rounded', 
                      'star', 'diamond', 'lines', 'blob', 
                      'pixel', 'wave', 'cross', 'heart'
                    ] as PatternStyle[]).map((pattern) => (
                      <button
                        key={pattern}
                        onClick={() => setPatternStyle(pattern)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          patternStyle === pattern
                            ? 'border-gray-900 bg-gray-100'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex justify-center mb-2">
                          <div className={`w-10 h-10 ${
                            pattern === 'square' ? 'bg-gray-900' :
                            pattern === 'dots' ? 'bg-gray-900 rounded-full' :
                            pattern === 'rounded' ? 'bg-gray-900 rounded-lg' :
                            pattern === 'extra-rounded' ? 'bg-gray-900 rounded-full' :
                            pattern === 'star' ? 'bg-gray-900' :
                            pattern === 'diamond' ? 'bg-gray-900 rotate-45' :
                            pattern === 'lines' ? 'bg-gray-900' :
                            pattern === 'blob' ? 'bg-gray-900 rounded-full' :
                            pattern === 'pixel' ? 'bg-gray-900' :
                            pattern === 'wave' ? 'bg-gray-900' :
                            pattern === 'cross' ? 'bg-gray-900' :
                            pattern === 'heart' ? 'bg-gray-900' :
                            'bg-gray-900'
                          }`} />
                        </div>
                        <p className="text-xs font-medium text-gray-700 capitalize text-center">
                          {pattern === 'square' ? 'Firkant' :
                           pattern === 'dots' ? 'Prikker' :
                           pattern === 'rounded' ? 'Afrundet' :
                           pattern === 'extra-rounded' ? 'Meget Afrundet' :
                           pattern === 'star' ? 'Stjerne' :
                           pattern === 'diamond' ? 'Diamant' :
                           pattern === 'lines' ? 'Linjer' :
                           pattern === 'blob' ? 'Blob' :
                           pattern === 'pixel' ? 'Pixel' :
                           pattern === 'wave' ? 'Bølge' :
                           pattern === 'cross' ? 'Kors' :
                           pattern === 'heart' ? 'Hjerte' :
                           pattern}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Corner Styles */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Hjørne Styles</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(['square', 'rounded', 'dot', 'classic'] as CornerStyle[]).map((corner) => (
                      <button
                        key={corner}
                        onClick={() => setCornerStyle(corner)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          cornerStyle === corner
                            ? 'border-gray-900 bg-gray-100'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex justify-center mb-2">
                          <div className={`w-12 h-12 bg-gray-900 ${
                            corner === 'square' ? '' :
                            corner === 'rounded' ? 'rounded-lg' :
                            corner === 'dot' ? 'rounded-full' :
                            'rounded-lg'
                          }`} />
                        </div>
                        <p className="text-xs font-medium text-gray-700 capitalize">
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tilføj Logo eller Center Tekst</h3>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    <button
                      onClick={removeLogo}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        !logoPreview && !centerText
                          ? 'border-gray-900 bg-gray-100'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-2xl">✕</span>
                    </button>
                    
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="px-4 py-2 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-all"
                    >
                      <span className="text-2xl">📷</span>
                      <span className="ml-2 text-sm font-medium text-gray-700">Upload Logo</span>
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
                    <div className="mb-4">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-20 h-20 object-contain rounded-lg border border-gray-200"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Eller indtast center tekst
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
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">PNG format, 1:1 forhold, maks 5MB</p>
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
              <div className="mb-6 p-6 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex flex-col items-center">
                  <div className="mb-2 text-sm text-gray-500">
                    {qrText.trim() ? 'Live Preview' : 'Generer QR kode for at se preview'}
                  </div>
                  <div className="flex justify-center items-center">
                    <img 
                      src={finalQRImage} 
                      alt="QR Code" 
                      className="max-w-full h-auto rounded-lg shadow-sm"
                    />
                  </div>
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
            {finalQRImage && (
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
