import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#333', fontSize: '2.5em', marginBottom: '10px' }}>
            🔨 ForgeLab
          </h1>
          <p style={{ color: '#666', fontSize: '1.1em' }}>
            Et samlet værktøjssuite med forskellige online værktøjer
          </p>
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            marginTop: '20px',
            flexWrap: 'wrap'
          }}>
            <Link href="/admin" style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'transform 0.2s'
            }}>
              📊 Admin Dashboard
            </Link>
          </div>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            transition: 'transform 0.2s'
          }}>
            <h2 style={{ color: '#333', marginBottom: '15px', fontSize: '1.5em' }}>
              🔲 QR Code Generator
            </h2>
            <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
              Generer QR-koder med tracking funktionalitet. Følg hvor mange gange din QR-kode bliver scannet.
            </p>
            <Link href="/tools/qr-generator" style={{
              display: 'inline-block',
              padding: '12px 25px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Brug Værktøj →
            </Link>
          </div>
        </div>

        <footer style={{
          textAlign: 'center',
          color: 'white',
          marginTop: '40px',
          padding: '20px'
        }}>
          <p>ForgeLab - Bygget med ❤️</p>
        </footer>
      </div>
    </div>
  )
}
