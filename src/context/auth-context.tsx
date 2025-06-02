"use client";

import type React from "react";

import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session, Provider } from "@supabase/supabase-js";
import { createClientSupabaseClient } from "@/lib/supabase/client";

type AuthContextType = {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signUp: (
        email: string,
        password: string
    ) => Promise<{
        error: any | null;
        success: boolean;
    }>;
    signIn: (
        email: string,
        password: string
    ) => Promise<{
        error: any | null;
        success: boolean;
    }>;
    signInWithProvider: (provider: Provider) => Promise<{
        error: any | null;
        success: boolean;
    }>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Solo crear el cliente en el lado del cliente
    const [supabase] = useState(() => {
        if (typeof window !== "undefined") {
            return createClientSupabaseClient();
        }
        return null;
    });

    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        // Verificar si hay una sesión activa al cargar la página
        const getSession = async () => {
            setIsLoading(true);
            try {
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();
                if (error) {
                    throw error;
                }

                setSession(session);
                setUser(session?.user || null);
            } catch (error) {
                console.error("Error al obtener la sesión:", error);
            } finally {
                setIsLoading(false);
            }
        };

        getSession(); // Suscribirse a cambios en la autenticación
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (event: any, session: Session | null) => {
                setSession(session);
                setUser(session?.user || null);
                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    const signUp = async (email: string, password: string) => {
        if (!supabase) {
            return {
                error: new Error("Supabase client not available"),
                success: false,
            };
        }

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });

            return {
                error,
                success: !error,
            };
        } catch (error) {
            console.error("Error al registrar usuario:", error);
            return {
                error,
                success: false,
            };
        }
    };
    const signIn = async (email: string, password: string) => {
        if (!supabase) {
            return {
                error: new Error("Supabase client not available"),
                success: false,
            };
        }

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            return {
                error,
                success: !error,
            };
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            return {
                error,
                success: false,
            };
        }
    };

    const signInWithProvider = async (provider: Provider) => {
        if (!supabase) {
            return {
                error: new Error("Supabase client not available"),
                success: false,
            };
        }

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            return {
                error,
                success: !error,
            };
        } catch (error) {
            console.error(`Error al iniciar sesión con ${provider}:`, error);
            return {
                error,
                success: false,
            };
        }
    };

    const signOut = async () => {
        if (!supabase) {
            console.warn("Supabase client not available");
            return;
        }

        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    const value = {
        user,
        session,
        isLoading,
        signUp,
        signIn,
        signInWithProvider,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth debe ser usado dentro de un AuthProvider");
    }
    return context;
};
