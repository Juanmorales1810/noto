"use client";

import { createClient } from "@supabase/supabase-js";

// Creamos un singleton para el cliente de Supabase
let supabaseClient: ReturnType<typeof createClient> | null = null;

export const createClientSupabaseClient = () => {
    if (supabaseClient) return supabaseClient;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // Durante el build, las variables pueden no estar disponibles
        // En ese caso, creamos un cliente mock que no se usará
        if (typeof window === "undefined") {
            console.warn(
                "Supabase environment variables not found during build"
            );
            return null as any;
        }
        throw new Error("Missing Supabase environment variables");
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
    return supabaseClient;
};
