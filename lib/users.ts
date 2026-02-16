import bcrypt from 'bcryptjs';
import { supabase } from './supabase';
import { generateId } from './data';

export interface User {
    id: string;
    username: string;
    password: string; // Hashed password
    createdAt: string;
}

export async function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

export function isPasswordHashed(password: string): boolean {
    return password.startsWith('$2') && password.length === 60;
}

export async function createUser(username: string, password: string): Promise<User | null> {
    try {
        // Tjek om brugernavn allerede eksisterer
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .maybeSingle();

        // Hvis der er en fejl (ikke PGRST116 = not found), log den
        if (checkError && checkError.code !== 'PGRST116') {
            console.error('❌ Fejl ved tjek af eksisterende bruger:', checkError);
            return null;
        }

        // Hvis brugeren allerede eksisterer
        if (existingUser) {
            console.log(`⚠️ Brugernavn "${username}" er allerede taget`);
            return null;
        }

        // Hash password
        const passwordHash = await hashPassword(password);
        const userId = generateId();

        // Opret bruger i Supabase
        const { data, error } = await supabase
            .from('users')
            .insert({
                id: userId,
                username,
                password_hash: passwordHash,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('âŒ Fejl ved oprettelse af bruger:', error);
            return null;
        }

        return {
            id: data.id,
            username: data.username,
            password: data.password_hash,
            createdAt: data.created_at
        };
    } catch (error) {
        console.error('âŒ Fejl ved oprettelse af bruger:', error);
        return null;
    }
}

export async function getUserByUsername(username: string): Promise<User | null> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .maybeSingle();

        // PGRST116 = not found, hvilket er OK
        if (error && error.code !== 'PGRST116') {
            console.error('❌ Fejl ved hentning af bruger:', error);
            return null;
        }

        if (!data) {
            return null;
        }

        return {
            id: data.id,
            username: data.username,
            password: data.password_hash,
            createdAt: data.created_at
        };
    } catch (error) {
        console.error('âŒ Fejl ved hentning af bruger:', error);
        return null;
    }
}

export async function getUserById(id: string): Promise<User | null> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        // PGRST116 = not found, hvilket er OK
        if (error && error.code !== 'PGRST116') {
            console.error('❌ Fejl ved hentning af bruger:', error);
            return null;
        }

        if (!data) {
            return null;
        }

        return {
            id: data.id,
            username: data.username,
            password: data.password_hash,
            createdAt: data.created_at
        };
    } catch (error) {
        console.error('âŒ Fejl ved hentning af bruger:', error);
        return null;
    }
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
    // Hvis password er hashet, brug bcrypt.compare
    if (isPasswordHashed(user.password)) {
        const isValid = await bcrypt.compare(password, user.password);
        return isValid;
    }
    
    // Hvis password ikke er hashet (gammel bruger), sammenlign direkte
    // og hash det automatisk ved nÃ¦ste login (graduel migration)
    if (user.password === password) {
        // Auto-migrer: hash passwordet og gem det i Supabase
        try {
            const hashedPassword = await hashPassword(password);
            const { error } = await supabase
                .from('users')
                .update({ password_hash: hashedPassword })
                .eq('id', user.id);

            if (error) {
                console.error('âŒ Fejl ved auto-migration af password:', error);
            } else {
                console.log(`✅ Auto-migreret password for bruger: ${user.username}`);
            }
        } catch (error) {
            console.error('âŒ Fejl ved auto-migration af password:', error);
        }
        return true;
    }
    
    return false;
}