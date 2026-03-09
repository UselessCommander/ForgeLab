import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { readScansForUser } from '@/lib/data'

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Hent alle QR koder og scans for brugeren
    const qrData = await readScansForUser(userId)

    // Beregn statistikker for hver QR kode
    const analytics = Object.entries(qrData).map(([qrId, data]: [string, any]) => {
      const scans = data.scans || []
      const totalScans = scans.length
      const uniqueIPs = new Set(scans.map((s: any) => s.ip).filter(Boolean))
      const uniqueScans = uniqueIPs.size
      const lastScanned = scans.length > 0 
        ? scans[scans.length - 1].timestamp 
        : null

      // Gruppér scanninger pr. dag for trend
      const scansByDate: Record<string, number> = {}
      scans.forEach((scan: any) => {
        if (scan.timestamp) {
          const date = new Date(scan.timestamp).toISOString().split('T')[0]
          scansByDate[date] = (scansByDate[date] || 0) + 1
        }
      })

      // Gruppér scanninger pr. IP for lokation (vi kan udvide dette senere med geolocation)
      const scansByIP: Record<string, number> = {}
      scans.forEach((scan: any) => {
        if (scan.ip) {
          scansByIP[scan.ip] = (scansByIP[scan.ip] || 0) + 1
        }
      })

      return {
        qrId,
        originalUrl: data.originalUrl,
        createdAt: data.createdAt,
        totalScans,
        uniqueScans,
        lastScanned,
        scansByDate,
        scansByIP,
        topIPs: Object.entries(scansByIP)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([ip, count]) => ({ ip, count }))
      }
    })

    // Beregn samlet statistik
    const totalQRCodes = analytics.length
    const totalAllScans = analytics.reduce((sum, qr) => sum + qr.totalScans, 0)
    const totalUniqueScans = new Set(
      Object.values(qrData).flatMap((data: any) => 
        (data.scans || []).map((s: any) => s.ip).filter(Boolean)
      )
    ).size

    return NextResponse.json({
      qrCodes: analytics,
      summary: {
        totalQRCodes,
        totalAllScans,
        totalUniqueScans,
      }
    })
  } catch (error) {
    console.error('Error fetching QR analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
