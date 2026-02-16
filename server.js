const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3000;

// Get local IP address for mobile access
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                // Prefer 192.168.x.x addresses
                if (iface.address.startsWith('192.168.')) {
                    return iface.address;
                }
            }
        }
    }
    // Fallback to first non-internal IPv4
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const LOCAL_IP = getLocalIP();
// Use environment variable for production, otherwise use local IP
const BASE_URL = (function() {
    // Custom domain override (highest priority)
    if (process.env.BASE_URL) {
        return process.env.BASE_URL;
    }
    // Vercel production - check for custom domain first
    if (process.env.VERCEL) {
        // Production environment with custom domain
        if (process.env.VERCEL_ENV === 'production') {
            // Check if custom domain is configured
            return 'https://qr.floweffekt.dk';
        }
        // Preview/deployment URLs
        if (process.env.VERCEL_URL) {
            return `https://${process.env.VERCEL_URL}`;
        }
    }
    // Local development
    return `http://${LOCAL_IP}:${PORT}`;
})();

// Data file path
// On Vercel, use /tmp for writable storage (serverless functions)
// Note: /tmp is ephemeral and resets on each deployment
// For production, consider using a database (MongoDB, PostgreSQL, etc.)
const DATA_FILE = process.env.VERCEL || process.env.VERCEL_ENV
    ? path.join('/tmp', 'scans.json')
    : path.join(__dirname, 'scans.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

// Helper function to read scans data
function readScans() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

// Helper function to write scans data
function writeScans(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Generate unique ID
function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Middleware
// CORS configuration - allow all origins for production (can be restricted if needed)
app.use(cors({
    origin: '*', // Allow all origins for QR code scanning from any device
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Security headers
app.use((req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// ============================================
// API ROUTES - MUST come before static files!
// ============================================

// API: Track a scan
app.post('/api/track', (req, res) => {
    const { qrId } = req.body;
    
    if (!qrId) {
        return res.status(400).json({ error: 'QR ID mangler' });
    }

    const scans = readScans();
    
    if (!scans[qrId]) {
        scans[qrId] = {
            count: 0,
            createdAt: new Date().toISOString(),
            scans: []
        };
    }

    scans[qrId].count++;
    scans[qrId].scans.push({
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress
    });

    writeScans(scans);

    res.json({ 
        success: true, 
        count: scans[qrId].count 
    });
});

// API: Delete all QR codes (MUST come before GET /api/stats!)
app.delete('/api/stats', (req, res) => {
    try {
        console.log(`🗑️ DELETE request modtaget for alle QR-koder`);
        const scans = readScans();
        const count = Object.keys(scans).length;
        console.log(`📊 Sletter ${count} QR-koder`);
        
        writeScans({});
        console.log(`✅ Alle QR-koder slettet`);
        
        res.json({ 
            success: true, 
            message: 'Alle QR-koder slettet',
            deleted: count
        });
    } catch (error) {
        console.error('Fejl ved sletning af alle QR-koder:', error);
        res.status(500).json({ error: 'Intern server fejl', message: error.message });
    }
});

// API: Delete a QR code (MUST come before GET /api/stats/:qrId!)
app.delete('/api/stats/:qrId', (req, res) => {
    try {
        const { qrId } = req.params;
        console.log(`\n🗑️ DELETE request modtaget`);
        console.log(`   Method: ${req.method}`);
        console.log(`   URL: ${req.url}`);
        console.log(`   QR ID: ${qrId}`);
        
        const scans = readScans();
        console.log(`📊 Nuværende QR-koder: ${Object.keys(scans).length}`);
        console.log(`📋 QR-kode IDs:`, Object.keys(scans));

        if (!scans[qrId]) {
            console.log(`❌ QR-kode ${qrId} ikke fundet i database`);
            return res.status(404).json({ 
                error: 'QR kode ikke fundet',
                qrId: qrId,
                availableIds: Object.keys(scans)
            });
        }

        console.log(`🗑️ Sletter QR-kode: ${qrId}`);
        console.log(`   Original URL: ${scans[qrId].originalUrl}`);
        console.log(`   Scanninger: ${scans[qrId].count}`);
        
        delete scans[qrId];
        writeScans(scans);

        console.log(`✅ QR-kode ${qrId} slettet`);
        console.log(`📊 Resterende QR-koder: ${Object.keys(scans).length}\n`);
        
        res.json({ 
            success: true, 
            message: 'QR kode slettet',
            qrId: qrId,
            remaining: Object.keys(scans).length
        });
    } catch (error) {
        console.error('❌ Fejl ved sletning af QR-kode:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Intern server fejl', 
            message: error.message
        });
    }
});

// API: Get scan count for a QR code
app.get('/api/stats/:qrId', (req, res) => {
    const { qrId } = req.params;
    const scans = readScans();

    if (!scans[qrId]) {
        return res.json({ 
            count: 0, 
            createdAt: null,
            scans: []
        });
    }

    res.json({
        count: scans[qrId].count,
        createdAt: scans[qrId].createdAt,
        scans: scans[qrId].scans
    });
});

// API: Get all QR codes stats
app.get('/api/stats', (req, res) => {
    const scans = readScans();
    res.json(scans);
});

// Redirect route - tracks scan and redirects to original URL
app.get('/track/:qrId', (req, res) => {
    const { qrId } = req.params;
    const scans = readScans();
    const clientIP = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

    console.log(`\n📱 QR-kode scannet! ID: ${qrId}`);
    console.log(`📍 IP: ${clientIP}`);
    console.log(`🌐 User-Agent: ${req.headers['user-agent'] || 'unknown'}`);
    console.log(`🔗 Referer: ${req.headers['referer'] || 'direct'}`);

    if (!scans[qrId]) {
        console.log(`❌ QR-kode ${qrId} ikke fundet i database`);
        return res.status(404).send(`
            <html>
                <head><title>QR Kode Ikke Fundet</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>QR Kode Ikke Fundet</h1>
                    <p>Denne QR-kode eksisterer ikke eller er blevet slettet.</p>
                    <p><a href="/">Tilbage til Generator</a></p>
                </body>
            </html>
        `);
    }

    // Track the scan
    scans[qrId].count++;
    scans[qrId].scans.push({
        timestamp: new Date().toISOString(),
        ip: clientIP,
        userAgent: req.headers['user-agent'] || 'unknown',
        referer: req.headers['referer'] || 'direct'
    });
    writeScans(scans);

    console.log(`✅ Scan registreret! Total scanninger for ${qrId}: ${scans[qrId].count}`);
    console.log(`🔗 Redirecter til: ${scans[qrId].originalUrl}\n`);

    // Redirect to original URL
    const originalUrl = scans[qrId].originalUrl;
    if (originalUrl) {
        // Ensure URL has protocol
        const redirectUrl = originalUrl.startsWith('http://') || originalUrl.startsWith('https://') 
            ? originalUrl 
            : `https://${originalUrl}`;
        res.redirect(302, redirectUrl);
    } else {
        res.send(`
            <html>
                <head><title>QR Kode Scannet</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>QR Kode Scannet!</h1>
                    <p>Antal scanninger: ${scans[qrId].count}</p>
                    <p><a href="/">Tilbage til Generator</a></p>
                </body>
            </html>
        `);
    }
});

// API: Create tracked QR code
app.post('/api/create-tracked', (req, res) => {
    const { url, qrId } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL mangler' });
    }

    // Validate URL format
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

    console.log(`\n✨ Ny tracked QR-kode oprettet:`);
    console.log(`   QR ID: ${id}`);
    console.log(`   Original URL: ${validatedUrl}`);
    console.log(`   Track URL: ${BASE_URL}/track/${id}\n`);

    res.json({
        success: true,
        qrId: id,
        trackUrl: `${BASE_URL}/track/${id}`,
        statsUrl: `${BASE_URL}/api/stats/${id}`,
        originalUrl: validatedUrl
    });
});

// ============================================
// STATIC FILES - MUST be last!
// ============================================
// Serve static files with proper MIME types (MUST be last!)
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    }
}));

// Start server for local development
if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 QR Kode Generator Server');
        console.log('='.repeat(60));
        console.log(`\n✅ Server kører på:`);
        console.log(`   • Localhost:  http://localhost:${PORT}`);
        console.log(`   • Lokalt netværk: ${BASE_URL}`);
        console.log(`\n📄 Sider:`);
        console.log(`   • Hoved side (Generator):  http://localhost:${PORT}/`);
        console.log(`   • Dashboard (Statistikker): http://localhost:${PORT}/admin.html`);
        console.log(`\n📱 Til mobil/QR-koder:`);
        console.log(`   • Brug denne URL: ${BASE_URL}`);
        console.log(`   • Sørg for at telefon og computer er på samme WiFi!`);
        console.log(`\n📊 API Endpoints:`);
        console.log(`   • Alle statistikker:        ${BASE_URL}/api/stats`);
        console.log(`   • Specifik QR-kode:        ${BASE_URL}/api/stats/:qrId`);
        console.log(`   • DELETE QR-kode:          ${BASE_URL}/api/stats/:qrId (DELETE)`);
        console.log(`   • Tracking redirect:        ${BASE_URL}/track/:qrId`);
        console.log(`\n💡 Tip: Åbn http://localhost:${PORT}/admin.html i din browser for at se dashboard!`);
        console.log(`\n⚠️  VIGTIGT: For at QR-koder virker fra telefon:`);
        console.log(`   1. Telefon og computer skal være på samme WiFi`);
        console.log(`   2. Brug IP-adressen: ${BASE_URL}`);
        console.log(`   3. Firewall skal tillade forbindelser på port ${PORT}`);
        console.log(`\n🌐 For Vercel deployment:`);
        console.log(`   • Production URL: https://qr.floweffekt.dk`);
        console.log(`   • Kør: vercel --prod`);
        console.log('='.repeat(60) + '\n');
    });
} else {
    console.log('🚀 Running on Vercel');
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log(`💾 Data file: ${DATA_FILE}`);
}

// Export for Vercel serverless
module.exports = app;
