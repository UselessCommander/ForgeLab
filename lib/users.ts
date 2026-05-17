import bcrypt from 'bcryptjs';
import { supabase } from './supabase';
import { generateId } from './data';
import { normalizeUsername } from './username';

/** Run migration 021 + 023 before production deploy. Until then, 42703 fallbacks apply. */
const MISSING_COLUMN = '42703';

export interface User {
    id: string;
    username: string;
    email?: string | null;
    ai_enabled?: boolean | null;
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

function mapUserRow(data: Record<string, unknown>): User {
    return {
        id: String(data.id),
        username: String(data.username),
        email: (data.email as string | null) ?? null,
        ai_enabled: (data.ai_enabled as boolean | null) ?? false,
        first_name: (data.first_name as string | null) ?? null,
        last_name: (data.last_name as string | null) ?? null,
        profile_role: (data.profile_role as string | null) ?? null,
        avatar_url: (data.avatar_url as string | null) ?? null,
        stripe_customer_id: (data.stripe_customer_id as string | null) ?? null,
        stripe_subscription_id: (data.stripe_subscription_id as string | null) ?? null,
        subscription_status: (data.subscription_status as string | null) ?? null,
        subscription_current_period_end: (data.subscription_current_period_end as string | null) ?? null,
        subscription_cancel_at_period_end: (data.subscription_cancel_at_period_end as boolean | null) ?? false,
        plan_key: (data.plan_key as string | null) ?? 'free',
        onboarding_completed_at: (data.onboarding_completed_at as string | null) ?? null,
        password: String(data.password_hash),
        createdAt: String(data.created_at),
    };
}

async function usernameExistsCaseInsensitive(trimmedUsername: string): Promise<boolean> {
    const usernameNormalized = normalizeUsername(trimmedUsername);
    if (!usernameNormalized) return true;

    const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username_normalized', usernameNormalized)
        .maybeSingle();

    if (checkError?.code === MISSING_COLUMN) {
        const legacy = await supabase
            .from('users')
            .select('id')
            .ilike('username', trimmedUsername)
            .limit(1);
        if (legacy.error) {
            console.error('Fejl ved tjek af eksisterende bruger:', legacy.error);
            return true;
        }
        return (legacy.data?.length ?? 0) > 0;
    }

    if (checkError) {
        console.error('Fejl ved tjek af eksisterende bruger:', checkError);
        return true;
    }

    return !!existingUser;
}

export async function createUser(username: string, password: string, email?: string): Promise<User | null> {
    try {
        const trimmedUsername = username.trim();

        if (!trimmedUsername || trimmedUsername.length < 3) {
            console.error('Brugernavn er for kort efter trimming');
            return null;
        }

        const usernameNormalized = normalizeUsername(trimmedUsername);
        if (!usernameNormalized) {
            return null;
        }

        if (await usernameExistsCaseInsensitive(trimmedUsername)) {
            return null;
        }

        const normalizedEmail = email?.trim().toLowerCase();
        const passwordHash = await hashPassword(password);
        const userId = generateId();

        const insertPayload: Record<string, unknown> = {
            id: userId,
            username: trimmedUsername,
            username_normalized: usernameNormalized,
            email: normalizedEmail || null,
            password_hash: passwordHash,
            created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('users')
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return null;
            }
            if (error.code === MISSING_COLUMN) {
                delete insertPayload.username_normalized;
                const retry = await supabase.from('users').insert(insertPayload).select().single();
                if (retry.error) {
                    console.error('Fejl ved oprettelse af bruger:', retry.error);
                    return null;
                }
                return mapUserRow(retry.data as Record<string, unknown>);
            }
            console.error('Fejl ved oprettelse af bruger:', error);
            return null;
        }

        return mapUserRow(data as Record<string, unknown>);
    } catch (error) {
        console.error('Fejl ved oprettelse af bruger:', error);
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
        const usernameNormalized = normalizeUsername(username);
        if (!usernameNormalized) {
            return null;
        }

        let { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('username_normalized', usernameNormalized)
            .maybeSingle();

        if (error?.code === MISSING_COLUMN) {
            const legacy = await supabase
                .from('users')
                .select('*')
                .ilike('username', username.trim())
                .limit(1);
            if (legacy.error || !legacy.data?.length) {
                return null;
            }
            userData = legacy.data[0];
        } else if (error) {
            console.error('Fejl ved hentning af bruger:', error);
            return null;
        }

        if (!userData) {
            return null;
        }

        return mapUserRow(userData as Record<string, unknown>);
    } catch (error) {
        console.error('Fejl ved hentning af bruger:', error);
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
            console.error('Fejl ved hentning af bruger:', error);
            return null;
        }

        if (!data || data.length === 0) {
            return null;
        }

        return mapUserRow(data[0] as Record<string, unknown>);
    } catch (error) {
        console.error('Fejl ved hentning af bruger:', error);
        return null;
    }
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
    if (isPasswordHashed(user.password)) {
        return await bcrypt.compare(password, user.password);
    }

    if (user.password === password) {
        try {
            const hashedPassword = await hashPassword(password);
            const { error } = await supabase
                .from('users')
                .update({ password_hash: hashedPassword })
                .eq('id', user.id);

            if (error) {
                console.error('Fejl ved auto-migration af password:', error);
            }
        } catch (error) {
            console.error('Fejl ved auto-migration af password:', error);
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
            console.error('Fejl ved hentning af bruger via email:', error);
            return null;
        }

        if (!data || data.length === 0) {
            return null;
        }

        return mapUserRow(data[0] as Record<string, unknown>);
    } catch (error) {
        console.error('Fejl ved hentning af bruger via email:', error);
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
            console.error('Fejl ved opdatering af password:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Fejl ved opdatering af password:', error);
        return false;
    }
}
