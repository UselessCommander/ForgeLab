import fs from 'fs';
import path from 'path';
import { generateId } from './data';

const USERS_FILE = process.env.VERCEL || process.env.VERCEL_ENV
    ? path.join('/tmp', 'users.json')
    : path.join(process.cwd(), 'users.json');

function ensureUsersFile() {
    if (!fs.existsSync(USERS_FILE)) {
        const dir = path.dirname(USERS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(USERS_FILE, JSON.stringify({}));
    }
}

export interface User {
    id: string;
    username: string;
    password: string; // I production skal dette være hashed
    createdAt: string;
}

export function readUsers(): Record<string, User> {
    try {
        ensureUsersFile();
        if (!fs.existsSync(USERS_FILE)) {
            return {};
        }
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        if (!data || data.trim() === '') {
            return {};
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Fejl ved læsning af brugere:', error);
        return {};
    }
}

export function writeUsers(users: Record<string, User>) {
    try {
        ensureUsersFile();
        const dir = path.dirname(USERS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error('❌ Fejl ved skrivning af brugere:', error);
        throw error;
    }
}

export function createUser(username: string, password: string): User | null {
    const users = readUsers();
    
    // Tjek om brugernavn allerede eksisterer
    const existingUser = Object.values(users).find(u => u.username === username);
    if (existingUser) {
        return null;
    }
    
    const user: User = {
        id: generateId(),
        username,
        password, // I production skal dette hashes med bcrypt
        createdAt: new Date().toISOString()
    };
    
    users[user.id] = user;
    writeUsers(users);
    
    return user;
}

export function getUserByUsername(username: string): User | null {
    const users = readUsers();
    const user = Object.values(users).find(u => u.username === username);
    return user || null;
}

export function getUserById(id: string): User | null {
    const users = readUsers();
    return users[id] || null;
}

export function verifyPassword(user: User, password: string): boolean {
    return user.password === password; // I production skal dette sammenligne hashes
}
