import { NextRequest, NextResponse } from 'next/server';
import { readScans, writeScans } from '@/lib/data';

export async function GET(
    request: NextRequest,
    { params }: { params: { qrId: string } }
) {
    try {
        const { qrId } = params;
        const scans = readScans();
        const clientIP = request.ip || 
            request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown';

        console.log(`\n📱 QR-kode scannet! ID: ${qrId}`);
        console.log(`📍 IP: ${clientIP}`);

        if (!scans[qrId]) {
            console.log(`❌ QR-kode ${qrId} ikke fundet i database`);
            return new NextResponse(
                `<!DOCTYPE html>
                <html>
                    <head>
                        <title>QR Kode Ikke Fundet</title>
                        <meta charset="UTF-8">
                        <style>
                            body { font-family: Arial; text-align: center; padding: 50px; }
                            a { color: #667eea; text-decoration: none; }
                        </style>
                    </head>
                    <body>
                        <h1>QR Kode Ikke Fundet</h1>
                        <p>Denne QR-kode eksisterer ikke eller er blevet slettet.</p>
                        <p><a href="/">Tilbage til ForgeLab</a></p>
                    </body>
                </html>`,
                { status: 404, headers: { 'Content-Type': 'text/html' } }
            );
        }

        // Track the scan
        scans[qrId].count++;
        scans[qrId].scans.push({
            timestamp: new Date().toISOString(),
            ip: clientIP,
            userAgent: request.headers.get('user-agent') || 'unknown',
            referer: request.headers.get('referer') || 'direct'
        });
        writeScans(scans);

        console.log(`✅ Scan registreret! Total scanninger for ${qrId}: ${scans[qrId].count}`);
        console.log(`🔗 Redirecter til: ${scans[qrId].originalUrl}\n`);

        // Redirect to original URL
        const originalUrl = scans[qrId].originalUrl;
        if (originalUrl) {
            // Ensure URL has protocol
            let redirectUrl = originalUrl;
            if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
                redirectUrl = `https://${redirectUrl}`;
            }
            
            // Use NextResponse.redirect with absolute URL
            return NextResponse.redirect(redirectUrl, 302);
        } else {
            return new NextResponse(
                `<!DOCTYPE html>
                <html>
                    <head>
                        <title>QR Kode Scannet</title>
                        <meta charset="UTF-8">
                        <style>
                            body { font-family: Arial; text-align: center; padding: 50px; }
                            a { color: #667eea; text-decoration: none; }
                        </style>
                    </head>
                    <body>
                        <h1>QR Kode Scannet!</h1>
                        <p>Antal scanninger: ${scans[qrId].count}</p>
                        <p><a href="/">Tilbage til ForgeLab</a></p>
                    </body>
                </html>`,
                { headers: { 'Content-Type': 'text/html' } }
            );
        }
    } catch (error: any) {
        console.error('❌ Fejl ved tracking:', error);
        return NextResponse.json(
            { error: 'Intern server fejl', message: error.message },
            { status: 500 }
        );
    }
}
