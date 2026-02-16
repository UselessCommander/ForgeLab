import fs from 'fs';
import path from 'path';
import os from 'os';

// Data file path
// On Vercel, use /tmp which persists during function execution
// Note: /tmp is ephemeral and may be cleared between deployments or after inactivity
const DATA_FILE = process.env.VERCEL || process.env.VERCEL_ENV
    ? path.join('/tmp', 'scans.json')
    : path.join(process.cwd(), 'scans.json');

// Initialize data file if it doesn't exist
function ensureDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify({}));
    }
}

// Read scans data
export function readScans() {
    try {
        ensureDataFile();
        if (!fs.existsSync(DATA_FILE)) {
            console.log('⚠️ Data file does not exist, returning empty object');
            return {};
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        if (!data || data.trim() === '') {
            console.log('⚠️ Data file is empty, returning empty object');
            return {};
        }
        const parsed = JSON.parse(data);
        console.log(`📊 Read ${Object.keys(parsed).length} QR codes from data file`);
        return parsed;
    } catch (error) {
        console.error('❌ Fejl ved læsning af scans data:', error);
        return {};
    }
}

// Write scans data
export function writeScans(data: any) {
    try {
        ensureDataFile();
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        console.log(`💾 Saved ${Object.keys(data).length} QR codes to data file`);
    } catch (error) {
        console.error('❌ Fejl ved skrivning af scans data:', error);
        throw error;
    }
}

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
