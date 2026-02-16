import { NextRequest, NextResponse } from 'next/server';
import { readScans, writeScans } from '@/lib/data';

// GET all stats
export async function GET() {
    try {
        const scans = readScans();
        return NextResponse.json(scans);
    } catch (error: any) {
        console.error('❌ Fejl ved hentning af statistikker:', error);
        return NextResponse.json(
            { error: 'Intern server fejl', message: error.message },
            { status: 500 }
        );
    }
}

// DELETE all QR codes
export async function DELETE() {
    try {
        const scans = readScans();
        const count = Object.keys(scans).length;
        
        writeScans({});
        console.log(`🗑️ Alle QR-koder slettet (${count} stk)`);
        
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
