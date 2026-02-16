import { NextRequest, NextResponse } from 'next/server';
import { getQRCodeById, trackScan } from '@/lib/data';

export async function GET(
    request: NextRequest,
    { params }: { params: { qrId: string } }
) {
    try {
        const { qrId } = params;
        const clientIP = request.ip || 
            request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown';

        console.log(`\nðŸ“± QR-kode scannet! ID: ${qrId}`);
        console.log(`ðŸ“ IP: ${clientIP}`);

        const qrCode = await getQRCodeById(qrId);

        if (!qrCode) {
            console.log(`âŒ QR-kode ${qrId} ikke fundet i database`);
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
        const userAgent = request.headers.get('user-agent') || 'unknown';
        const referer = request.headers.get('referer') || 'direct';
        
        await trackScan(qrId, clientIP, userAgent, referer);

        const newCount = qrCode.count + 1;
        console.log(`âœ… Scan registreret! Total scanninger for ${qrId}: ${newCount}`);
        console.log(`ðŸ”— Redirecter til: ${qrCode.originalUrl}\n`);

        // Redirect to original URL
        const originalUrl = qrCode.originalUrl;
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
                        <p>Antal scanninger: ${newCount}</p>
                        <p><a href="/">Tilbage til ForgeLab</a></p>
                    </body>
                </html>`,
                { headers: { 'Content-Type': 'text/html' } }
            );
        }
    } catch (error: any) {
        console.error('âŒ Fejl ved tracking:', error);
        return NextResponse.json(
            { error: 'Intern server fejl', message: error.message },
            { status: 500 }
        );
    }
}