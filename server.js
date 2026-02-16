const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Get local IP address for mobile access
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                if (iface.address.startsWith('192.168.')) {
                    return iface.address;
                }
            }
        }
    }
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
const BASE_URL = (function() {
    if (process.env.BASE_URL) {
        return process.env.BASE_URL;
    }
    if (process.env.VERCEL) {
        if (process.env.VERCEL_ENV === 'production') {
            return 'https://qr.floweffekt.dk';
        }
        if (process.env.VERCEL_URL) {
            return `https://${process.env.VERCEL_URL}`;
        }
    }
    return `http://${LOCAL_IP}:${PORT}`;
})();

// Data file path
const DATA_FILE = process.env.VERCEL || process.env.VERCEL_ENV
    ? path.join('/tmp', 'scans.json')
    : path.join(__dirname, 'scans.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

// Helper functions
function readScans() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return {};
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        if (!data || data.trim() === '') {
            return {};
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Fejl ved læsning af scans data:', error);
        return {};
    }
}

function writeScans(data) {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ Fejl ved skrivning af scans data:', error);
        throw error;
    }
}

function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ForgeLab API is running' });
});

// API: Create tracked QR code
app.post('/api/create-tracked', (req, res) => {
    const { url, qrId } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL mangler' });
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

// API: Delete a QR code
app.delete('/api/stats/:qrId', (req, res) => {
    try {
        const { qrId } = req.params;
        const scans = readScans();

        if (!scans[qrId]) {
            return res.status(404).json({ 
                error: 'QR kode ikke fundet',
                qrId: qrId
            });
        }

        delete scans[qrId];
        writeScans(scans);

        console.log(`🗑️ QR-kode ${qrId} slettet`);

        res.json({ 
            success: true, 
            message: 'QR kode slettet',
            qrId: qrId
        });
    } catch (error) {
        console.error('❌ Fejl ved sletning af QR-kode:', error);
        res.status(500).json({ 
            error: 'Intern server fejl', 
            message: error.message
        });
    }
});

// API: Delete all QR codes
app.delete('/api/stats', (req, res) => {
    try {
        const scans = readScans();
        const count = Object.keys(scans).length;
        
        writeScans({});
        console.log(`🗑️ Alle QR-koder slettet (${count} stk)`);
        
        res.json({ 
            success: true, 
            message: 'Alle QR-koder slettet',
            deleted: count
        });
    } catch (error) {
        console.error('❌ Fejl ved sletning af alle QR-koder:', error);
        res.status(500).json({ error: 'Intern server fejl', message: error.message });
    }
});

// Redirect route - tracks scan and redirects to original URL
app.get('/track/:qrId', (req, res) => {
    const { qrId } = req.params;
    const scans = readScans();
    const clientIP = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

    console.log(`\n📱 QR-kode scannet! ID: ${qrId}`);
    console.log(`📍 IP: ${clientIP}`);

    if (!scans[qrId]) {
        console.log(`❌ QR-kode ${qrId} ikke fundet i database`);
        return res.status(404).send(`
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
        const redirectUrl = originalUrl.startsWith('http://') || originalUrl.startsWith('https://') 
            ? originalUrl 
            : `https://${originalUrl}`;
        res.redirect(302, redirectUrl);
    } else {
        res.send(`
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
                    <p>Antal scanninger: ${scans[qrId].count}</p>
                    <p><a href="/">Tilbage til ForgeLab</a></p>
                </body>
            </html>
        `);
    }
});

// ============================================
// STATIC FILES
// ============================================
app.use(express.static('public', {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
        }
    }
}));

// Start server
if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 ForgeLab Server');
        console.log('='.repeat(60));
        console.log(`\n✅ Server kører på:`);
        console.log(`   • http://localhost:${PORT}`);
        console.log(`   • Lokalt netværk: ${BASE_URL}`);
        console.log(`\n📄 Sider:`);
        console.log(`   • Hovedside: http://localhost:${PORT}/`);
        console.log(`   • Admin Dashboard: http://localhost:${PORT}/admin.html`);
        console.log('='.repeat(60) + '\n');
    });
} else {
    console.log('🚀 Running on Vercel');
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log(`💾 Data file: ${DATA_FILE}`);
}

// Export for Vercel serverless
module.exports = app;
