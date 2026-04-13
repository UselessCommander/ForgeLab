import bcrypt from 'bcryptjs';
import { supabase } from './supabase';
import { generateId } from './data';

export interface User {
    id: string;
    username: string;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    profile_role?: string | null;
    avatar_url?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    subscription_status?: string | null;
    subscription_current_period_end?: string | null;
    subscription_cancel_at_period_end?: boolean | null;
    plan_key?: string | null;
    /** Null/undefined until the post-signup onboarding wizard is completed */
    onboarding_completed_at?: string | null;
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

export async function createUser(username: string, password: string, email?: string): Promise<User | null> {
    try {
        // Trim whitespace fra brugernavnet
        const trimmedUsername = username.trim();
        
        if (!trimmedUsername || trimmedUsername.length < 3) {
            console.error('❌ Brugernavn er for kort efter trimming');
            return null;
        }
        
        console.log(`🔍 Tjekker om brugernavn "${trimmedUsername}" eksisterer...`);
        
        // Tjek om brugernavn allerede eksisterer (case-insensitive)
        // Hent alle brugere og sammenlign case-insensitive i JavaScript
        const { data: allUsers, error: checkError } = await supabase
            .from('users')
            .select('id, username');
        
        if (checkError) {
            console.error('❌ Fejl ved tjek af eksisterende bruger:', checkError);
            console.error('Error code:', checkError.code);
            console.error('Error message:', checkError.message);
            console.error('Error details:', JSON.stringify(checkError, null, 2));
            
            if (checkError.code === '42P01' || checkError.message?.includes('does not exist')) {
                console.error('❌ FEJL: Tabellen "users" eksisterer ikke! Kør migrationen i Supabase.');
            }
            
            return null;
        }
        
        // Tjek case-insensitive om brugernavnet eksisterer
        const existingUsers = allUsers?.filter(u => 
            u.username?.toLowerCase().trim() === trimmedUsername.toLowerCase()
        ) || [];

        console.log(`📊 Tjekket ${allUsers?.length || 0} bruger(er) i databasen`);
        console.log(`📊 Fundet ${existingUsers.length} match(es) for "${trimmedUsername}"`);

        // Hvis brugeren allerede eksisterer
        if (existingUsers && existingUsers.length > 0) {
            console.log(`⚠️ Brugernavn "${trimmedUsername}" er allerede taget (fundet ${existingUsers.length} bruger(er))`);
            console.log(`📋 Eksisterende bruger(er):`, existingUsers);
            return null;
        }

        console.log(`✅ Brugernavn "${trimmedUsername}" er ledigt, opretter bruger...`);

        const normalizedEmail = email?.trim().toLowerCase();

        // Hash password
        const passwordHash = await hashPassword(password);
        const userId = generateId();

        // Opret bruger i Supabase
        const { data, error } = await supabase
            .from('users')
            .insert({
                id: userId,
                username: trimmedUsername,
                email: normalizedEmail || null,
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
            email: data.email,
            first_name: data.first_name ?? null,
            last_name: data.last_name ?? null,
            profile_role: data.profile_role ?? null,
            avatar_url: data.avatar_url ?? null,
            stripe_customer_id: data.stripe_customer_id ?? null,
            stripe_subscription_id: data.stripe_subscription_id ?? null,
            subscription_status: data.subscription_status ?? null,
            subscription_current_period_end: data.subscription_current_period_end ?? null,
            subscription_cancel_at_period_end: data.subscription_cancel_at_period_end ?? false,
            plan_key: data.plan_key ?? 'free',
            onboarding_completed_at: data.onboarding_completed_at ?? null,
            password: data.password_hash,
            createdAt: data.created_at
        };
    } catch (error) {
        console.error('âŒ Fejl ved oprettelse af bruger:', error);
        return null;
    }
}

export function userNeedsOnboarding(userId: string | null, user: User | null): boolean {
    if (!userId || userId === 'admin' || !user) return false
    return !user.onboarding_completed_at
}

export async function markUserOnboardingComplete(userId: string): Promise<boolean> {
    if (userId === 'admin') return true
    try {
        const { error } = await supabase
            .from('users')
            .update({ onboarding_completed_at: new Date().toISOString() })
            .eq('id', userId)
        if (error) {
            console.error('Fejl ved markering af onboarding fuldført:', error)
            return false
        }
        return true
    } catch (e) {
        console.error('Fejl ved markering af onboarding fuldført:', e)
        return false
    }
}

export async function getUserByUsername(username: string): Promise<User | null> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .limit(1);

        if (error) {
            console.error('❌ Fejl ved hentning af bruger:', error);
            return null;
        }

        if (!data || data.length === 0) {
            return null;
        }

        const userData = data[0];

        return {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            first_name: userData.first_name ?? null,
            last_name: userData.last_name ?? null,
            profile_role: userData.profile_role ?? null,
            avatar_url: userData.avatar_url ?? null,
            stripe_customer_id: userData.stripe_customer_id ?? null,
            stripe_subscription_id: userData.stripe_subscription_id ?? null,
            subscription_status: userData.subscription_status ?? null,
            subscription_current_period_end: userData.subscription_current_period_end ?? null,
            subscription_cancel_at_period_end: userData.subscription_cancel_at_period_end ?? false,
            plan_key: userData.plan_key ?? 'free',
            onboarding_completed_at: userData.onboarding_completed_at ?? null,
            password: userData.password_hash,
            createdAt: userData.created_at
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
            .limit(1);

        if (error) {
            console.error('❌ Fejl ved hentning af bruger:', error);
            return null;
        }

        if (!data || data.length === 0) {
            return null;
        }

        const userData = data[0];

        return {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            first_name: userData.first_name ?? null,
            last_name: userData.last_name ?? null,
            profile_role: userData.profile_role ?? null,
            avatar_url: userData.avatar_url ?? null,
            stripe_customer_id: userData.stripe_customer_id ?? null,
            stripe_subscription_id: userData.stripe_subscription_id ?? null,
            subscription_status: userData.subscription_status ?? null,
            subscription_current_period_end: userData.subscription_current_period_end ?? null,
            subscription_cancel_at_period_end: userData.subscription_cancel_at_period_end ?? false,
            plan_key: userData.plan_key ?? 'free',
            onboarding_completed_at: userData.onboarding_completed_at ?? null,
            password: userData.password_hash,
            createdAt: userData.created_at
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

export async function getUserByEmail(email: string): Promise<User | null> {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .limit(1);

        if (error) {
            console.error('❌ Fejl ved hentning af bruger via email:', error);
            return null;
        }

        if (!data || data.length === 0) {
            return null;
        }

        const userData = data[0];
        return {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            first_name: userData.first_name ?? null,
            last_name: userData.last_name ?? null,
            profile_role: userData.profile_role ?? null,
            avatar_url: userData.avatar_url ?? null,
            stripe_customer_id: userData.stripe_customer_id ?? null,
            stripe_subscription_id: userData.stripe_subscription_id ?? null,
            subscription_status: userData.subscription_status ?? null,
            subscription_current_period_end: userData.subscription_current_period_end ?? null,
            subscription_cancel_at_period_end: userData.subscription_cancel_at_period_end ?? false,
            plan_key: userData.plan_key ?? 'free',
            onboarding_completed_at: userData.onboarding_completed_at ?? null,
            password: userData.password_hash,
            createdAt: userData.created_at
        };
    } catch (error) {
        console.error('❌ Fejl ved hentning af bruger via email:', error);
        return null;
    }
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
        const hashedPassword = await hashPassword(newPassword);
        const { error } = await supabase
            .from('users')
            .update({ password_hash: hashedPassword })
            .eq('id', userId);

        if (error) {
            console.error('❌ Fejl ved opdatering af password:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ Fejl ved opdatering af password:', error);
        return false;
    }
}