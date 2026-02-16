import fs from 'fs';
import path from 'path';
import os from 'os';

// Data file path
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

// Write scans data
export function writeScans(data: any) {
    try {
        ensureDataFile();
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
