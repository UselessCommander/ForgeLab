import { NextRequest, NextResponse } from 'next/server';
import { createQRCode, generateId, getBaseUrl } from '@/lib/data';
import { getCurrentUserId } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const userId = await getCurrentUserId();
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Ikke autentificeret' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { url, qrId } = body;

        if (!url) {
            return NextResponse.json(
                { error: 'URL mangler' },
                { status: 400 }
            );
        }

        let validatedUrl = url.trim();
        if (!validatedUrl.startsWith('http://') && !validatedUrl.startsWith('https://')) {
            validatedUrl = `https://${validatedUrl}`;
        }

        const id = qrId || generateId();
        const success = await createQRCode(id, userId, validatedUrl);

        if (!success) {
            return NextResponse.json(
                { error: 'Fejl ved oprettelse af QR-kode' },
                { status: 500 }
            );
        }

        const BASE_URL = getBaseUrl();

        console.log(`\nâœ¨ Ny tracked QR-kode oprettet:`);
        console.log(`   QR ID: ${id}`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Original URL: ${validatedUrl}`);
        console.log(`   Track URL: ${BASE_URL}/api/track/${id}\n`);

        return NextResponse.json({
            success: true,
            qrId: id,
            trackUrl: `/api/track/${id}`,
            statsUrl: `${BASE_URL}/api/stats/${id}`,
            originalUrl: validatedUrl
        });
    } catch (error: any) {
        console.error('âŒ Fejl ved oprettelse af tracked QR-kode:', error);
        return NextResponse.json(
            { error: 'Intern server fejl', message: error.message },
            { status: 500 }
        );
    }
}