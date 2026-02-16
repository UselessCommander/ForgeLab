import { NextRequest, NextResponse } from 'next/server';
import { readScans, writeScans, readScansForUser } from '@/lib/data';
import { getCurrentUserId } from '@/lib/auth';

// GET all stats for current user
export async function GET() {
    try {
        const userId = await getCurrentUserId();
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Ikke autentificeret' },
                { status: 401 }
            );
        }

        const scans = readScansForUser(userId);
        return NextResponse.json(scans);
    } catch (error: any) {
        console.error('❌ Fejl ved hentning af statistikker:', error);
        return NextResponse.json(
            { error: 'Intern server fejl', message: error.message },
            { status: 500 }
        );
    }
}

// DELETE all QR codes for current user
export async function DELETE() {
    try {
        const userId = await getCurrentUserId();
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Ikke autentificeret' },
                { status: 401 }
            );
        }

        const allScans = readScans();
        const userScans = readScansForUser(userId);
        const count = Object.keys(userScans).length;
        
        // Slet kun brugerens QR-koder
        for (const qrId of Object.keys(userScans)) {
            delete allScans[qrId];
        }
        
        writeScans(allScans);
        console.log(`🗑️ Alle QR-koder slettet for bruger ${userId} (${count} stk)`);
        
        return NextResponse.json({ 
            success: true, 
            message: 'Alle QR-koder slettet',
            deleted: count
        });
    } catch (error: any) {
        console.error('❌ Fejl ved sletning af alle QR-koder:', error);
        return NextResponse.json(
            { error: 'Intern server fejl', message: error.message },
            { status: 500 }
        );
    }
}
