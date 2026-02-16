import { NextRequest, NextResponse } from 'next/server';
import { readScans, writeScans, generateId, getBaseUrl } from '@/lib/data';

export async function POST(request: NextRequest) {
    try {
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
        const scans = readScans();

        scans[id] = {
            count: 0,
            createdAt: new Date().toISOString(),
            originalUrl: validatedUrl,
            scans: []
        };

        writeScans(scans);

        const BASE_URL = getBaseUrl();

        console.log(`\n✨ Ny tracked QR-kode oprettet:`);
        console.log(`   QR ID: ${id}`);
        console.log(`   Original URL: ${validatedUrl}`);
        console.log(`   Track URL: ${BASE_URL}/api/track/${id}\n`);

        return NextResponse.json({
            success: true,
            qrId: id,
            trackUrl: `${BASE_URL}/api/track/${id}`,
            statsUrl: `${BASE_URL}/api/stats/${id}`,
            originalUrl: validatedUrl
        });
    } catch (error: any) {
        console.error('❌ Fejl ved oprettelse af tracked QR-kode:', error);
        return NextResponse.json(
            { error: 'Intern server fejl', message: error.message },
            { status: 500 }
        );
    }
}
