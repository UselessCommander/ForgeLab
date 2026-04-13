import { NextRequest, NextResponse } from 'next/server';
import { readScansForUser, deleteAllQRCodesForUser, getQRCodeById } from '@/lib/data';
import { getCurrentUserId } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { canViewProject } from '@/lib/project-access';

// GET all stats for current user, eller kun QR-koder gemt i projektets qr-generator
export async function GET(request: NextRequest) {
    try {
        const userId = await getCurrentUserId();
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Ikke autentificeret' },
                { status: 401 }
            );
        }

        const projectId = request.nextUrl.searchParams.get('projectId');
        if (projectId) {
            const canView = await canViewProject(projectId, userId);
            if (!canView) {
                return NextResponse.json({ error: 'Projekt ikke fundet' }, { status: 404 });
            }
            const { data: row, error } = await supabase
                .from('project_tool_data')
                .select('data')
                .eq('project_id', projectId)
                .eq('tool_slug', 'qr-generator')
                .maybeSingle();
            if (error) {
                console.error('stats project qr tool:', error);
                return NextResponse.json({ error: 'Kunne ikke hente QR-data' }, { status: 500 });
            }
            const raw = row?.data as { savedQRCodes?: { qrId?: string | null }[] } | undefined;
            const ids = Array.from(
                new Set(
                    (raw?.savedQRCodes ?? [])
                        .map((s) => (typeof s?.qrId === 'string' ? s.qrId : null))
                        .filter((id): id is string => Boolean(id))
                )
            );
            const result: Record<string, unknown> = {};
            for (const qrId of ids) {
                const qr = await getQRCodeById(qrId);
                if (!qr) continue;
                if (qr.userId !== userId && userId !== 'admin') continue;
                result[qrId] = {
                    userId: qr.userId,
                    count: qr.count,
                    createdAt: qr.createdAt,
                    originalUrl: qr.originalUrl,
                    scans: qr.scans,
                };
            }
            return NextResponse.json(result);
        }

        const scans = await readScansForUser(userId);
        return NextResponse.json(scans);
    } catch (error: any) {
        console.error('âŒ Fejl ved hentning af statistikker:', error);
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

        const count = await deleteAllQRCodesForUser(userId);
        console.log(`ðŸ—‘ï¸ Alle QR-koder slettet for bruger ${userId} (${count} stk)`);
        
        return NextResponse.json({ 
            success: true, 
            message: 'Alle QR-koder slettet',
            deleted: count
        });
    } catch (error: any) {
        console.error('âŒ Fejl ved sletning af alle QR-koder:', error);
        return NextResponse.json(
            { error: 'Intern server fejl', message: error.message },
            { status: 500 }
        );
    }
}