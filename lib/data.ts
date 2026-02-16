import { supabase } from './supabase';

// Generate unique ID
export function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Get base URL
export function getBaseUrl() {
    if (process.env.BASE_URL) {
        return process.env.BASE_URL;
    }
    if (process.env.VERCEL) {
        if (process.env.VERCEL_ENV === 'production') {
            return 'https://forgelab.dk';
        }
        if (process.env.VERCEL_URL) {
            return `https://${process.env.VERCEL_URL}`;
        }
    }
    return 'http://localhost:3000';
}

// Read all QR codes (for admin)
export async function readScans(): Promise<Record<string, any>> {
    try {
        const { data: qrCodes, error } = await supabase
            .from('qr_codes')
            .select('*');

        if (error) {
            console.error('âŒ Fejl ved hentning af QR-koder:', error);
            return {};
        }

        const result: Record<string, any> = {};
        
        for (const qrCode of qrCodes || []) {
            // Hent scans for denne QR-kode
            const { data: scans } = await supabase
                .from('scans')
                .select('*')
                .eq('qr_code_id', qrCode.id)
                .order('timestamp', { ascending: true });

            result[qrCode.id] = {
                userId: qrCode.user_id,
                count: qrCode.count,
                createdAt: qrCode.created_at,
                originalUrl: qrCode.original_url,
                scans: (scans || []).map(scan => ({
                    timestamp: scan.timestamp,
                    ip: scan.ip,
                    userAgent: scan.user_agent,
                    referer: scan.referer
                }))
            };
        }

        return result;
    } catch (error) {
        console.error('âŒ Fejl ved lÃ¦sning af scans data:', error);
        return {};
    }
}

// Read scans for a specific user
export async function readScansForUser(userId: string): Promise<Record<string, any>> {
    try {
        // Admin bruger kan se alle QR-koder
        if (userId === 'admin') {
            return await readScans();
        }

        const { data: qrCodes, error } = await supabase
            .from('qr_codes')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('âŒ Fejl ved hentning af QR-koder:', error);
            return {};
        }

        const result: Record<string, any> = {};
        
        for (const qrCode of qrCodes || []) {
            // Hent scans for denne QR-kode
            const { data: scans } = await supabase
                .from('scans')
                .select('*')
                .eq('qr_code_id', qrCode.id)
                .order('timestamp', { ascending: true });

            result[qrCode.id] = {
                userId: qrCode.user_id,
                count: qrCode.count,
                createdAt: qrCode.created_at,
                originalUrl: qrCode.original_url,
                scans: (scans || []).map(scan => ({
                    timestamp: scan.timestamp,
                    ip: scan.ip,
                    userAgent: scan.user_agent,
                    referer: scan.referer
                }))
            };
        }

        return result;
    } catch (error) {
        console.error('âŒ Fejl ved lÃ¦sning af scans data:', error);
        return {};
    }
}

// Create QR code
export async function createQRCode(qrId: string, userId: string, originalUrl: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('qr_codes')
            .insert({
                id: qrId,
                user_id: userId,
                original_url: originalUrl,
                count: 0,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('âŒ Fejl ved oprettelse af QR-kode:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('âŒ Fejl ved oprettelse af QR-kode:', error);
        return false;
    }
}

// Get QR code by ID
export async function getQRCodeById(qrId: string): Promise<any | null> {
    try {
        const { data, error } = await supabase
            .from('qr_codes')
            .select('*')
            .eq('id', qrId)
            .single();

        if (error || !data) {
            return null;
        }

        // Hent scans
        const { data: scans } = await supabase
            .from('scans')
            .select('*')
            .eq('qr_code_id', qrId)
            .order('timestamp', { ascending: true });

        return {
            userId: data.user_id,
            count: data.count,
            createdAt: data.created_at,
            originalUrl: data.original_url,
            scans: (scans || []).map(scan => ({
                timestamp: scan.timestamp,
                ip: scan.ip,
                userAgent: scan.user_agent,
                referer: scan.referer
            }))
        };
    } catch (error) {
        console.error('âŒ Fejl ved hentning af QR-kode:', error);
        return null;
    }
}

// Track scan (increment count and add scan record)
export async function trackScan(qrId: string, ip: string, userAgent: string, referer: string): Promise<boolean> {
    try {
        // Increment count
        const { data: qrCode } = await supabase
            .from('qr_codes')
            .select('count')
            .eq('id', qrId)
            .single();

        if (!qrCode) {
            return false;
        }

        const { error: updateError } = await supabase
            .from('qr_codes')
            .update({ count: qrCode.count + 1 })
            .eq('id', qrId);

        if (updateError) {
            console.error('âŒ Fejl ved opdatering af count:', updateError);
            return false;
        }

        // Add scan record
        const { error: insertError } = await supabase
            .from('scans')
            .insert({
                qr_code_id: qrId,
                timestamp: new Date().toISOString(),
                ip,
                user_agent: userAgent,
                referer
            });

        if (insertError) {
            console.error('âŒ Fejl ved indsÃ¦ttelse af scan:', insertError);
            return false;
        }

        return true;
    } catch (error) {
        console.error('âŒ Fejl ved tracking:', error);
        return false;
    }
}

// Delete QR code
export async function deleteQRCode(qrId: string): Promise<boolean> {
    try {
        // Scans vil blive slettet automatisk pga. CASCADE
        const { error } = await supabase
            .from('qr_codes')
            .delete()
            .eq('id', qrId);

        if (error) {
            console.error('âŒ Fejl ved sletning af QR-kode:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('âŒ Fejl ved sletning af QR-kode:', error);
        return false;
    }
}

// Delete all QR codes for a user
export async function deleteAllQRCodesForUser(userId: string): Promise<number> {
    try {
        const { data: qrCodes } = await supabase
            .from('qr_codes')
            .select('id')
            .eq('user_id', userId);

        if (!qrCodes || qrCodes.length === 0) {
            return 0;
        }

        const { error } = await supabase
            .from('qr_codes')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error('âŒ Fejl ved sletning af QR-koder:', error);
            return 0;
        }

        return qrCodes.length;
    } catch (error) {
        console.error('âŒ Fejl ved sletning af QR-koder:', error);
        return 0;
    }
}