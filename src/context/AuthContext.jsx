import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    const configured = isSupabaseConfigured();

    useEffect(() => {
        if (!configured) {
            setLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [configured]);

    // -- Google OAuth --
    const loginWithGoogle = useCallback(async () => {
        if (!configured) return { error: { message: 'Supabase no configurado' } };
        setAuthError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) setAuthError(error.message);
        return { error };
    }, [configured]);

    // -- Email/Password Sign Up --
    const signUpWithEmail = useCallback(async (email, password, displayName) => {
        if (!configured) return { error: { message: 'Supabase no configurado' } };
        setAuthError(null);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: displayName || '' },
            },
        });
        if (error) setAuthError(error.message);
        return { data, error };
    }, [configured]);

    // -- Email/Password Sign In --
    const loginWithEmail = useCallback(async (email, password) => {
        if (!configured) return { error: { message: 'Supabase no configurado' } };
        setAuthError(null);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) setAuthError(error.message);
        return { data, error };
    }, [configured]);

    // -- Logout --
    const logout = useCallback(async () => {
        if (!configured) return;
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    }, [configured]);

    // -- Upload goal image to Supabase Storage --
    const uploadGoalImage = useCallback(async (file, goalId) => {
        if (!configured || !user) return { url: null, error: 'No autenticado' };
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${goalId}.${fileExt}`;

        const { error } = await supabase.storage
            .from('goal-images')
            .upload(fileName, file, { upsert: true });

        if (error) return { url: null, error: error.message };

        const { data: urlData } = supabase.storage
            .from('goal-images')
            .getPublicUrl(fileName);

        return { url: urlData.publicUrl, error: null };
    }, [configured, user]);

    // -- Get goal image URL --
    const getGoalImageUrl = useCallback((goalId, ext = 'jpg') => {
        if (!configured || !user) return null;
        const fileName = `${user.id}/${goalId}.${ext}`;
        const { data } = supabase.storage
            .from('goal-images')
            .getPublicUrl(fileName);
        return data.publicUrl;
    }, [configured, user]);

    const clearError = useCallback(() => setAuthError(null), []);

    const displayName = user?.user_metadata?.display_name
        || user?.user_metadata?.full_name
        || user?.email?.split('@')[0]
        || '';

    const avatarUrl = user?.user_metadata?.avatar_url || null;

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            authError,
            configured,
            displayName,
            avatarUrl,
            loginWithGoogle,
            signUpWithEmail,
            loginWithEmail,
            logout,
            uploadGoalImage,
            getGoalImageUrl,
            clearError,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
