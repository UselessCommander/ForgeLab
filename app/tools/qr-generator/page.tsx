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
      <div style={{ minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', padding: '40px' }}>
          <Link href="/" style={{ display: 'inline-block', color: '#667eea', textDecoration: 'none', marginBottom: '20px', fontWeight: '600' }}>
            ← Tilbage til ForgeLab
          </Link>
          
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#333', fontSize: '2em', marginBottom: '10px' }}>🔲 QR Code Generator</h1>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: '600' }}>
              Indtast tekst eller URL:
            </label>
            <textarea
              value={qrText}
              onChange={(e) => setQrText(e.target.value)}
              placeholder="Skriv din tekst eller URL her..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px',
                minHeight: '100px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
            <input
              type="checkbox"
              id="enableTracking"
              checked={enableTracking}
              onChange={(e) => setEnableTracking(e.target.checked)}
              style={{ width: '20px', height: '20px', marginRight: '10px', cursor: 'pointer' }}
            />
            <label htmlFor="enableTracking" style={{ cursor: 'pointer', margin: 0 }}>
              Aktiver scanning tracking
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: '600' }}>
                Størrelse:
              </label>
              <input
                type="number"
                value={qrSize}
                onChange={(e) => setQrSize(parseInt(e.target.value))}
                min="100"
                max="500"
                step="50"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: '600' }}>
                Fejlkorrektion:
              </label>
              <select
                value={errorLevel}
                onChange={(e) => setErrorLevel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="L">Lav</option>
                <option value="M">Medium</option>
                <option value="Q">Høj</option>
                <option value="H">Meget høj</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateQR}
            style={{
              width: '100%',
              padding: '15px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            Generer QR Kode
          </button>
          
          {error && (
            <div style={{
              color: '#dc3545',
              textAlign: 'center',
              marginTop: '10px',
              padding: '10px',
              background: '#f8d7da',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}
          
          {qrImageSrc && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
              background: '#f9f9f9',
              borderRadius: '10px',
              padding: '20px',
              marginTop: '20px'
            }}>
              <img src={qrImageSrc} alt="QR Code" style={{ maxWidth: '100%', height: 'auto' }} />
            </div>
          )}
          
          {currentQrId && (
            <div style={{
              background: '#e7f3ff',
              border: '2px solid #2196F3',
              borderRadius: '8px',
              padding: '15px',
              marginTop: '15px'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#1976D2', fontSize: '16px' }}>📊 Tracking Information</h3>
              <p style={{ margin: '5px 0', color: '#555', fontSize: '14px' }}>
                <strong>QR ID:</strong> <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{currentQrId}</code>
              </p>
              <p style={{ margin: '5px 0', color: '#555', fontSize: '14px' }}>
                <strong>Antal scanninger:</strong> {scanCount}
              </p>
            </div>
          )}
          
          {qrImageSrc && (
            <button
              onClick={downloadQR}
              style={{
                width: '100%',
                padding: '15px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '15px'
              }}
            >
              Download QR Kode
            </button>
          )}
        </div>
      </div>
    </>
  )
}
