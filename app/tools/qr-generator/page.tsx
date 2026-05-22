'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Loader2, QrCode, Upload, X } from 'lucide-react'
import { useProjectToolData } from '@/lib/useProjectToolData'

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'
type StylePreset = 'classic' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded'
type ExportFormat = 'png' | 'svg'
type ExportSize = 512 | 1024 | 2048 | 4096
type DotType = 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded'
type CornerSquareType = 'square' | 'dot' | 'extra-rounded'
type CornerDotType = 'square' | 'dot'
type DownloadPreset = { format: ExportFormat; size: ExportSize }

type QRGeneratorState = {
  inputValue: string
  size: number
  errorCorrection: ErrorCorrectionLevel
  foregroundColor: string
  backgroundColor: string
  stylePreset: StylePreset
  logoDataUrl: string | null
  centerText: string
  textBelow: string
  enableTracking: boolean
  exportPreset: DownloadPreset
}

type QRCodeInstance = {
  append: (el: HTMLElement) => void
  update: (opts: Record<string, unknown>) => void
  getRawData: (extension: 'png' | 'svg') => Promise<Blob | null>
}
type QRCodeCtor = new (opts: Record<string, unknown>) => QRCodeInstance

const DEFAULT_STATE: QRGeneratorState = {
  inputValue: '',
  size: 220,
  errorCorrection: 'M',
  foregroundColor: '#111827',
  backgroundColor: '#FFFFFF',
  stylePreset: 'classic',
  logoDataUrl: null,
  centerText: '',
  textBelow: '',
  enableTracking: false,
  exportPreset: { format: 'png', size: 2048 },
}

const STYLE_PRESETS: Array<{
  id: StylePreset
  label: string
  dots: DotType
  cornersSquare: CornerSquareType
  cornersDot: CornerDotType
}> = [
  { id: 'classic', label: 'Classic', dots: 'square', cornersSquare: 'square', cornersDot: 'square' },
  { id: 'rounded', label: 'Rounded', dots: 'rounded', cornersSquare: 'extra-rounded', cornersDot: 'dot' },
  { id: 'dots', label: 'Dots', dots: 'dots', cornersSquare: 'dot', cornersDot: 'dot' },
  { id: 'classy', label: 'Classy', dots: 'classy', cornersSquare: 'extra-rounded', cornersDot: 'square' },
  { id: 'classy-rounded', label: 'Classy Rounded', dots: 'classy-rounded', cornersSquare: 'extra-rounded', cornersDot: 'dot' },
  { id: 'extra-rounded', label: 'Extra Rounded', dots: 'extra-rounded', cornersSquare: 'extra-rounded', cornersDot: 'dot' },
]

const COLOR_PRESETS = ['#111827', '#1D4ED8', '#7C3AED', '#EA580C', '#059669', '#DC2626', '#0EA5E9', '#000000']

function sanitizeState(input: Partial<QRGeneratorState>): QRGeneratorState {
  return {
    ...DEFAULT_STATE,
    ...input,
    exportPreset: {
      format: input.exportPreset?.format === 'svg' ? 'svg' : 'png',
      size: ([512, 1024, 2048, 4096].includes(input.exportPreset?.size as number)
        ? (input.exportPreset?.size as ExportSize)
        : 2048),
    },
  }
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const lines: string[] = []
  let line = words[0]
  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${line} ${words[i]}`
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate
    } else {
      lines.push(line)
      line = words[i]
    }
  }
  lines.push(line)
  return lines
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Kunne ikke læse blob-data'))
    reader.readAsDataURL(blob)
  })
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Kunne ikke indlæse billede'))
    img.src = src
  })
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function QRGeneratorPage() {
  const router = useRouter()
  const [state, setState] = useState<QRGeneratorState>(DEFAULT_STATE)
  const [trackedUrl, setTrackedUrl] = useState<string | null>(null)
  const [currentQrId, setCurrentQrId] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [error, setError] = useState('')
  const [isLibraryReady, setIsLibraryReady] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const previewRef = useRef<HTMLDivElement>(null)
  const qrInstanceRef = useRef<QRCodeInstance | null>(null)
  const qrCtorRef = useRef<QRCodeCtor | null>(null)
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useProjectToolData<QRGeneratorState>('qr-generator', state, (saved) => {
    setState(sanitizeState(saved))
  })

  const effectiveData = useMemo(() => {
    if (state.enableTracking && trackedUrl) return trackedUrl
    return state.inputValue.trim()
  }, [state.enableTracking, trackedUrl, state.inputValue])

  const stylePreset = useMemo(
    () => STYLE_PRESETS.find((p) => p.id === state.stylePreset) ?? STYLE_PRESETS[0],
    [state.stylePreset]
  )

  const API_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

  const buildQrOptions = useCallback(
    (size: number, data: string) => ({
      width: size,
      height: size,
      data: data || ' ',
      type: 'canvas',
      margin: 0,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: state.errorCorrection,
      },
      image: state.logoDataUrl ?? undefined,
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.24,
        margin: 8,
        crossOrigin: 'anonymous',
      },
      dotsOptions: {
        color: state.foregroundColor,
        type: stylePreset.dots,
      },
      cornersSquareOptions: {
        color: state.foregroundColor,
        type: stylePreset.cornersSquare,
      },
      cornersDotOptions: {
        color: state.foregroundColor,
        type: stylePreset.cornersDot,
      },
      backgroundOptions: {
        color: state.backgroundColor,
      },
    }),
    [state.errorCorrection, state.logoDataUrl, state.foregroundColor, state.backgroundColor, stylePreset]
  )

  const refreshStats = useCallback(
    async (qrId: string) => {
      try {
        const response = await fetch(`${API_URL}/api/stats/${qrId}`)
        if (!response.ok) return
        const payload = await response.json()
        setScanCount(typeof payload.count === 'number' ? payload.count : 0)
      } catch {
        // best effort only
      }
    },
    [API_URL]
  )

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const mod = await import('qr-code-styling')
        if (!mounted) return
        qrCtorRef.current = (mod.default || (mod as unknown)) as QRCodeCtor
        setIsLibraryReady(true)
      } catch {
        setError('Kunne ikke indlæse qr-code-styling biblioteket.')
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!isLibraryReady || !previewRef.current || !qrCtorRef.current) return
    if (!qrInstanceRef.current) {
      qrInstanceRef.current = new qrCtorRef.current(buildQrOptions(state.size, effectiveData))
      qrInstanceRef.current.append(previewRef.current)
    } else {
      qrInstanceRef.current.update(buildQrOptions(state.size, effectiveData))
    }
  }, [isLibraryReady, state.size, effectiveData, buildQrOptions])

  useEffect(() => {
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current)
    }
  }, [])

  const createTrackedUrl = async () => {
    const text = state.inputValue.trim()
    if (!text) {
      setError('Indtast venligst tekst eller URL først.')
      return
    }
    setError('')
    try {
      const inputUrl =
        text.startsWith('http://') || text.startsWith('https://') ? text : `https://${text}`
      const response = await fetch(`${API_URL}/api/create-tracked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Kunne ikke oprette tracking-link.')
      }
      const payload = await response.json()
      const trackUrl = payload.trackUrl || `/api/track/${payload.qrId}`
      const absoluteTrackUrl = trackUrl.startsWith('http') ? trackUrl : `${API_URL}${trackUrl}`
      setTrackedUrl(absoluteTrackUrl)
      setCurrentQrId(payload.qrId)
      setScanCount(0)
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current)
      statsIntervalRef.current = setInterval(() => {
        refreshStats(payload.qrId)
      }, 5000)
      void refreshStats(payload.qrId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ukendt tracking-fejl')
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Logo skal være et billede (png, jpg, webp eller svg).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo er for stort. Maks 5MB.')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      setState((prev) => ({ ...prev, logoDataUrl: String(reader.result ?? null) }))
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setState((prev) => ({ ...prev, logoDataUrl: null }))
  }

  const composePng = useCallback(
    async (qrBlob: Blob, size: ExportSize) => {
      const qrDataUrl = await blobToDataUrl(qrBlob)
      const qrImage = await loadImage(qrDataUrl)
      const pad = Math.round(size * 0.08)
      const centerText = state.centerText.trim()
      const footerText = state.textBelow.trim()
      const footerHeight = footerText ? Math.round(size * 0.24) : 0

      const canvas = document.createElement('canvas')
      canvas.width = size + pad * 2
      canvas.height = size + pad * 2 + footerHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Kunne ikke oprette eksport-canvas.')

      ctx.fillStyle = state.backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(qrImage, pad, pad, size, size)

      if (centerText) {
        ctx.fillStyle = state.foregroundColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `700 ${Math.max(24, Math.round(size * 0.09))}px Inter, system-ui, sans-serif`
        ctx.fillText(centerText.slice(0, 16), pad + size / 2, pad + size / 2)
      }

      if (footerText) {
        ctx.fillStyle = state.foregroundColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.font = `600 ${Math.max(24, Math.round(size * 0.045))}px Inter, system-ui, sans-serif`
        const lines = wrapTextLines(ctx, footerText, size)
        const lineHeight = Math.max(28, Math.round(size * 0.055))
        let y = pad + size + Math.round(size * 0.06)
        for (const line of lines.slice(0, 4)) {
          ctx.fillText(line, pad + size / 2, y)
          y += lineHeight
        }
      }

      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) reject(new Error('Kunne ikke eksportere PNG.'))
          else resolve(blob)
        }, 'image/png')
      })
    },
    [state.backgroundColor, state.centerText, state.textBelow, state.foregroundColor]
  )

  const composeSvg = useCallback(
    async (qrSvgBlob: Blob, size: ExportSize) => {
      const centerText = state.centerText.trim()
      const footerText = state.textBelow.trim()
      if (!centerText && !footerText) return qrSvgBlob

      const qrSvgRaw = await qrSvgBlob.text()
      const pad = Math.round(size * 0.08)
      const footerHeight = footerText ? Math.round(size * 0.24) : 0
      const totalWidth = size + pad * 2
      const totalHeight = size + pad * 2 + footerHeight
      const svgPayload = btoa(unescape(encodeURIComponent(qrSvgRaw)))

      const footerLine = footerText
        ? `<text x="${totalWidth / 2}" y="${pad + size + Math.round(size * 0.12)}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="${Math.max(
            24,
            Math.round(size * 0.045)
          )}" font-weight="600" fill="${state.foregroundColor}">${footerText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')}</text>`
        : ''
      const centerLine = centerText
        ? `<text x="${pad + size / 2}" y="${pad + size / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Inter, system-ui, sans-serif" font-size="${Math.max(
            24,
            Math.round(size * 0.09)
          )}" font-weight="700" fill="${state.foregroundColor}">${centerText
            .slice(0, 16)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')}</text>`
        : ''

      const wrapped = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <rect width="${totalWidth}" height="${totalHeight}" fill="${state.backgroundColor}" />
  <image href="data:image/svg+xml;base64,${svgPayload}" x="${pad}" y="${pad}" width="${size}" height="${size}" />
  ${centerLine}
  ${footerLine}
</svg>`
      return new Blob([wrapped], { type: 'image/svg+xml;charset=utf-8' })
    },
    [state.centerText, state.textBelow, state.foregroundColor, state.backgroundColor]
  )

  const handleDownload = async () => {
    if (!isLibraryReady || !qrCtorRef.current) return
    const text = effectiveData.trim()
    if (!text) {
      setError('Indtast venligst tekst eller URL før download.')
      return
    }
    setError('')
    setIsDownloading(true)
    try {
      const tempQr = new qrCtorRef.current(buildQrOptions(state.exportPreset.size, text))
      const raw = await tempQr.getRawData(state.exportPreset.format)
      if (!raw) throw new Error('Kunne ikke generere eksportfil.')

      if (state.exportPreset.format === 'png') {
        const pngBlob = await composePng(raw, state.exportPreset.size)
        downloadBlob('qr-code.png', pngBlob)
      } else {
        const svgBlob = await composeSvg(raw, state.exportPreset.size)
        downloadBlob('qr-code.svg', svgBlob)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Download fejlede.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbage
        </button>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/90 text-white shadow-sm shadow-amber-500/30">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">QR Code Generator</h1>
              <p className="text-sm text-gray-600">Live preview, logo i center, design styles og skarp eksport til print/SoMe.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Indhold</h2>
              <label className="mb-2 block text-sm font-medium text-gray-700">URL eller tekst</label>
              <textarea
                value={state.inputValue}
                onChange={(e) => {
                  setState((prev) => ({ ...prev, inputValue: e.target.value }))
                  setTrackedUrl(null)
                  setCurrentQrId(null)
                }}
                placeholder="https://forgelab.dk eller valgfri tekst"
                className="min-h-[120px] w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Størrelse ({state.size}px)</label>
                  <input
                    type="range"
                    min={160}
                    max={520}
                    step={10}
                    value={state.size}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, size: Number(e.target.value) }))
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Fejlkorrektion</label>
                  <select
                    value={state.errorCorrection}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        errorCorrection: e.target.value as ErrorCorrectionLevel,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="L">Lav (L)</option>
                    <option value="M">Medium (M)</option>
                    <option value="Q">Høj (Q)</option>
                    <option value="H">Meget høj (H)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Brug Q/H hvis du bruger logo i midten for bedre scanbarhed.</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Design style</h2>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setState((prev) => ({ ...prev, stylePreset: preset.id }))}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      state.stylePreset === preset.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">QR farve</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={state.foregroundColor}
                      onChange={(e) =>
                        setState((prev) => ({ ...prev, foregroundColor: e.target.value }))
                      }
                      className="h-10 w-12 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={state.foregroundColor}
                      onChange={(e) =>
                        setState((prev) => ({ ...prev, foregroundColor: e.target.value }))
                      }
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setState((prev) => ({ ...prev, foregroundColor: color }))}
                        className={`h-6 w-6 rounded-full border ${
                          state.foregroundColor === color ? 'scale-110 border-gray-700' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Vælg farve ${color}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Baggrundsfarve</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={state.backgroundColor}
                      onChange={(e) =>
                        setState((prev) => ({ ...prev, backgroundColor: e.target.value }))
                      }
                      className="h-10 w-12 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={state.backgroundColor}
                      onChange={(e) =>
                        setState((prev) => ({ ...prev, backgroundColor: e.target.value }))
                      }
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Logo og tekst</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Logo i midten</label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Upload className="h-4 w-4" />
                    Upload logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">Anbefalet kvadratisk logo, max 5MB. Placering/margin styres automatisk.</p>
                  {state.logoDataUrl && (
                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2">
                      <img src={state.logoDataUrl} alt="Logo preview" className="h-12 w-12 rounded object-contain bg-white" />
                      <button
                        onClick={removeLogo}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Fjern
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Center text (valgfri)</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={state.centerText}
                    onChange={(e) => setState((prev) => ({ ...prev, centerText: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                    placeholder="FX"
                  />
                  <label className="mb-1 mt-3 block text-sm font-medium text-gray-700">Tekst under QR-koden</label>
                  <input
                    type="text"
                    value={state.textBelow}
                    onChange={(e) => setState((prev) => ({ ...prev, textBelow: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Scan mig for at besøge siden"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Tracking og eksport</h2>
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <input
                  id="enable-tracking"
                  type="checkbox"
                  checked={state.enableTracking}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, enableTracking: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="enable-tracking" className="text-sm font-medium text-gray-700">
                  Aktiver tracking-link
                </label>
                <button
                  onClick={createTrackedUrl}
                  disabled={!state.enableTracking}
                  className="ml-auto rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                >
                  Generér tracking
                </button>
              </div>
              {currentQrId && (
                <p className="mb-3 text-xs text-gray-600">
                  QR ID: <span className="font-mono">{currentQrId}</span> · Scanninger: <span className="font-semibold">{scanCount}</span>
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Filtype</label>
                  <select
                    value={state.exportPreset.format}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        exportPreset: {
                          ...prev.exportPreset,
                          format: e.target.value as ExportFormat,
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="png">PNG</option>
                    <option value="svg">SVG</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Størrelse</label>
                  <select
                    value={String(state.exportPreset.size)}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        exportPreset: {
                          ...prev.exportPreset,
                          size: Number(e.target.value) as ExportSize,
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="512">512 x 512</option>
                    <option value="1024">1024 x 1024</option>
                    <option value="2048">2048 x 2048</option>
                    <option value="4096">4096 x 4096</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading || !effectiveData || !isLibraryReady}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download QR-kode
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">Previewet er lille, men eksporten genereres på ny i valgt opløsning (default 2048 PNG).</p>
            </section>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Live preview</h3>
              <div
                className="rounded-xl border border-gray-200 p-4"
                style={{ backgroundColor: state.backgroundColor }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div
                      ref={previewRef}
                      className="overflow-hidden rounded-lg"
                      style={{ width: state.size, height: state.size }}
                    />
                    {state.centerText.trim() && (
                      <div
                        className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center font-extrabold"
                        style={{
                          color: state.foregroundColor,
                          fontSize: Math.max(14, Math.round(state.size * 0.12)),
                        }}
                      >
                        {state.centerText.trim().slice(0, 16)}
                      </div>
                    )}
                  </div>
                  {state.textBelow.trim() && (
                    <p
                      className="max-w-full break-words text-center font-semibold"
                      style={{ color: state.foregroundColor, fontSize: Math.max(13, Math.round(state.size * 0.075)) }}
                    >
                      {state.textBelow}
                    </p>
                  )}
                  {!effectiveData && (
                    <p className="text-xs text-gray-500">Skriv tekst/URL for at aktivere QR-preview.</p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
