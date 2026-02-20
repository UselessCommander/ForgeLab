'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import ForgeLabLogo from '@/components/ForgeLabLogo'
import { QrCode, Download, ArrowRight } from 'lucide-react'

declare global {
  interface Window {
    QRCode: any
  }
}

export default function TryQRGeneratorPage() {
  const [qrText, setQrText] = useState('https://www.forgelab.dk')
  const [qrSize, setQrSize] = useState(200)
  const [qrCodeLoaded, setQrCodeLoaded] = useState(false)
  const [imageData, setImageData] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.QRCode) {
      setQrCodeLoaded(true)
    }
  }, [])

  const generateQR = () => {
    if (typeof window === 'undefined' || !window.QRCode) {
      setError('QR-biblioteket indlæses. Vent et øjeblik og prøv igen.')
      return
    }

    const text = qrText.trim()
    if (!text) {
      setError('Indtast tekst eller URL')
      setImageData(null)
      return
    }

    setError('')
    try {
      const container = document.createElement('div')
      new window.QRCode(container, {
        text,
        width: qrSize,
        height: qrSize,
        colorDark: '#000000',
        colorLight: '#FFFFFF',
        correctLevel: 1,
      })

      setTimeout(() => {
        const canvas = container.querySelector('canvas')
        if (!canvas) {
          setError('Kunne ikke generere QR-kode')
          return
        }
        setImageData(canvas.toDataURL('image/png'))
      }, 100)
    } catch (err: any) {
      setError(err?.message || 'Fejl ved generering')
      setImageData(null)
    }
  }

  const downloadQR = () => {
    if (!imageData) return
    const link = document.createElement('a')
    link.download = 'qr-kode.png'
    link.href = imageData
    link.click()
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"
        onLoad={() => setQrCodeLoaded(true)}
      />
      <div className="min-h-screen bg-[#fafbfc]">
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f1f3_1px,transparent_1px),linear-gradient(to_bottom,#f0f1f3_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none" />
        <div className="fixed inset-0 bg-gradient-to-b from-white/80 via-transparent to-amber-50/30 pointer-events-none" />
        <nav className="relative z-10 border-b border-gray-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-20">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20 transition-colors">
                  <ForgeLabLogo size={28} />
                </div>
                <span className="text-xl font-semibold text-gray-900 tracking-tight">ForgeLab</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Log ind for tracking
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative z-10 container mx-auto px-6 py-12 max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mb-4">
              <QrCode className="w-7 h-7" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Prøv QR Code Generator
            </h1>
            <p className="text-gray-600">
              Generer en QR-kode uden login. Ingen tracking — kun output. For tracking og gemte koder, log ind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200/80 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tekst eller URL
              </label>
              <input
                type="text"
                value={qrText}
                onChange={(e) => setQrText(e.target.value)}
                placeholder="https://eksempel.dk"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-4"
              />
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Størrelse: {qrSize}px
              </label>
              <input
                type="range"
                min="120"
                max="400"
                step="20"
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className="w-full mb-6"
              />
              <button
                onClick={generateQR}
                disabled={!qrCodeLoaded}
                className="w-full py-3 px-4 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {qrCodeLoaded ? 'Generer QR-kode' : 'Indlæser…'}
              </button>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200/80 shadow-sm flex flex-col items-center justify-center min-h-[280px]">
              {imageData ? (
                <>
                  <img
                    src={imageData}
                    alt="QR kode"
                    className="max-w-full h-auto rounded-lg border border-gray-100"
                  />
                  <button
                    onClick={downloadQR}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </button>
                </>
              ) : (
                <p className="text-gray-400 text-center">
                  Indtast tekst og klik på Generer for at se QR-koden her.
                </p>
              )}
            </div>
          </div>

          <div className="mt-10 p-4 bg-amber-50 border border-amber-200/80 rounded-xl text-center text-sm text-amber-800">
            <strong>Demo uden login.</strong> Her er ingen tracking. For at følge antal scanninger og gemme QR-koder,{' '}
            <Link href="/login" className="underline font-medium">log ind</Link> og brug den fulde QR Code Generator fra dashboard.
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-gray-500 hover:text-gray-900">
              ← Tilbage til forsiden
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
