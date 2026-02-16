import { NextRequest, NextResponse } from 'next/server';
import { getQRCodeById, deleteQRCode } from '@/lib/data';
import { getCurrentUserId } from '@/lib/auth';

// GET stats for specific QR code
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ qrId: string }> }
) {
    try {
        const userId = await getCurrentUserId();
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Ikke autentificeret' },
                { status: 401 }
            );
        }

        const { qrId } = await params;
        const qrCode = await getQRCodeById(qrId);

        if (!qrCode) {
            return NextResponse.json({ 
                count: 0, 
                createdAt: null,
                scans: []
            });
        }

        // Tjek om QR-koden tilhÃ¸rer brugeren (eller admin)
        if (qrCode.userId !== userId && userId !== 'admin') {
            return NextResponse.json(
                { error: 'Ingen adgang til denne QR-kode' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            count: qrCode.count,
            createdAt: qrCode.createdAt,
            scans: qrCode.scans
        });
    } catch (error: any) {
        console.error('âŒ Fejl ved hentning af statistik:', error);
        return NextResponse.json(
            { error: 'Intern server fejl', message: error.message },
            { status: 500 }
        );
    }
}

// DELETE specific QR code
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ qrId: string }> }
) {
    try {
        const userId = await getCurrentUserId();
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Ikke autentificeret' },
                { status: 401 }
            );
        }

        const { qrId } = await params;
        const qrCode = await getQRCodeById(qrId);

        if (!qrCode) {
            return NextResponse.json(
                { error: 'QR kode ikke fundet', qrId: qrId },
                { status: 404 }
            );
        }

        // Tjek om QR-koden tilhÃ¸rer brugeren (eller admin)
        if (qrCode.userId !== userId && userId !== 'admin') {
            return NextResponse.json(
                { error: 'Ingen adgang til denne QR-kode' },
                { status: 403 }
            );
        }

        const success = await deleteQRCode(qrId);

        if (!success) {
            return NextResponse.json(
                { error: 'Fejl ved sletning af QR-kode' },
                { status: 500 }
            );
        }

        console.log(`ðŸ—‘ï¸ QR-kode ${qrId} slettet af bruger ${userId}`);

        return NextResponse.json({ 
            success: true, 
            message: 'QR kode slettet',
            qrId: qrId
        });
    } catch (error: any) {
        console.error('âŒ Fejl ved sletning af QR-kode:', error);
        return NextResponse.json(
            { error: 'Intern server fejl', message: error.message },
            { status: 500 }
        );
    }
}