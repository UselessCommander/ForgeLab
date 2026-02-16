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
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
        }}>
          <Link href="/" style={{ display: 'inline-block', color: '#667eea', textDecoration: 'none', marginBottom: '20px', fontWeight: '600' }}>
            ← Tilbage til ForgeLab
          </Link>
          <h1 style={{ color: '#333', fontSize: '2em', marginBottom: '10px' }}>📊 Admin Dashboard</h1>
          <p style={{ color: '#666' }}>Oversigt over alle QR-koder og scanninger</p>
        </header>

        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <button
            onClick={loadData}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔄 Opdater
          </button>
          <button
            onClick={deleteAllQR}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🗑️ Slet Alle
          </button>
          <div style={{ color: '#666', fontSize: '0.9em', marginLeft: 'auto' }}>
            Sidst opdateret: {lastUpdate}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#667eea', marginBottom: '10px' }}>
              {qrCodes.length}
            </div>
            <div style={{ color: '#666', fontSize: '1em' }}>QR Koder</div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#667eea', marginBottom: '10px' }}>
              {totalScans}
            </div>
            <div style={{ color: '#666', fontSize: '1em' }}>Total Scanninger</div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'white', fontSize: '1.2em' }}>
            Indlæser data...
          </div>
        ) : qrCodes.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
          }}>
            <h2 style={{ color: '#666', marginBottom: '10px' }}>Ingen QR-koder endnu</h2>
            <p style={{ color: '#999' }}>Generer din første QR-kode med tracking for at se statistikker her.</p>
            <Link href="/tools/qr-generator" style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '12px 25px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Gå til QR Generator
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {qrCodes.map(qrId => {
              const qrData = data[qrId]
              const createdAt = qrData.createdAt ? new Date(qrData.createdAt).toLocaleString('da-DK') : 'Ukendt'
              const lastScan = qrData.scans && qrData.scans.length > 0 
                ? new Date(qrData.scans[qrData.scans.length - 1].timestamp).toLocaleString('da-DK')
                : 'Ingen scanninger endnu'

              return (
                <div key={qrId} style={{
                  background: 'white',
                  borderRadius: '15px',
                  padding: '25px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                    paddingBottom: '15px',
                    borderBottom: '2px solid #f0f0f0'
                  }}>
                    <h3 style={{ color: '#333', fontSize: '1.2em' }}>QR Kode</h3>
                    <span style={{
                      fontFamily: 'monospace',
                      background: '#f8f9fa',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      fontSize: '0.85em',
                      color: '#666'
                    }}>
                      {qrId.substring(0, 12)}...
                    </span>
                  </div>
                  <div style={{
                    fontSize: '2.5em',
                    color: '#667eea',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '10px',
                    margin: '15px 0'
                  }}>
                    {qrData.count || 0}
                  </div>
                  <div style={{ textAlign: 'center', color: '#666', marginBottom: '15px' }}>
                    scanninger
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <span style={{ color: '#666', fontWeight: '600' }}>Oprettet:</span>
                      <span style={{ color: '#333', fontWeight: 'bold' }}>{createdAt}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0'
                    }}>
                      <span style={{ color: '#666', fontWeight: '600' }}>Sidste scan:</span>
                      <span style={{ color: '#333', fontWeight: 'bold' }}>{lastScan}</span>
                    </div>
                  </div>
                  {qrData.originalUrl && (
                    <div style={{
                      wordBreak: 'break-all',
                      color: '#667eea',
                      fontSize: '0.9em',
                      marginTop: '10px',
                      padding: '10px',
                      background: '#f8f9fa',
                      borderRadius: '5px'
                    }}>
                      <strong>Original URL:</strong><br />
                      {qrData.originalUrl}
                    </div>
                  )}
                  <div style={{ marginTop: '15px' }}>
                    <button
                      onClick={() => deleteQR(qrId)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Slet
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
