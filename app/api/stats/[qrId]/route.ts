import { NextRequest, NextResponse } from 'next/server';
import { readScans, writeScans } from '@/lib/data';

// GET stats for specific QR code
export async function GET(
    request: NextRequest,
    { params }: { params: { qrId: string } }
) {
    try {
        const { qrId } = params;
        const scans = readScans();

        if (!scans[qrId]) {
            return NextResponse.json({ 
                count: 0, 
                createdAt: null,
                scans: []
            });
        }

        return NextResponse.json({
            count: scans[qrId].count,
            createdAt: scans[qrId].createdAt,
            scans: scans[qrId].scans
        });
    } catch (error: any) {
        console.error('❌ Fejl ved hentning af statistik:', error);
        return NextResponse.json(
            { error: 'Intern server fejl', message: error.message },
            { status: 500 }
        );
    }
}

// DELETE specific QR code
export async function DELETE(
    request: NextRequest,
    { params }: { params: { qrId: string } }
) {
    try {
        const { qrId } = params;
        const scans = readScans();

        if (!scans[qrId]) {
            return NextResponse.json(
                { error: 'QR kode ikke fundet', qrId: qrId },
                { status: 404 }
            );
        }

        delete scans[qrId];
        writeScans(scans);

        console.log(`🗑️ QR-kode ${qrId} slettet`);

        return NextResponse.json({ 
            success: true, 
            message: 'QR kode slettet',
            qrId: qrId
        });
    } catch (error: any) {
        console.error('❌ Fejl ved sletning af QR-kode:', error);
        return NextResponse.json(
            { error: 'Intern server fejl', message: error.message },
            { status: 500 }
        );
    }
}
