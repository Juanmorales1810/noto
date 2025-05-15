import { createClientSupabaseClient } from "./client";

export type KanbanUser = {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
};

export const userService = {
    // Método para obtener el usuario actual
    async getCurrentUser() {
        const supabase = createClientSupabaseClient();

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return null;

            try {
                // Verificar si el usuario existe en la tabla de usuarios
                const { data, error } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (error) {
                    // Si el error es que la tabla no existe, mostramos un mensaje más amigable
                    if (
                        error.message?.includes("relation") &&
                        error.message?.includes("does not exist")
                    ) {
                        console.error(
                            "La tabla 'users' no existe. Necesitas crearla en Supabase."
                        );
                        // Creamos un usuario temporal para que la aplicación funcione
                        return {
                            id: user.id,
                            email: user.email || "",
                            name:
                                user.user_metadata.name ||
                                user.user_metadata.full_name ||
                                user.email?.split("@")[0] ||
                                "",
                            avatar_url: user.user_metadata.avatar_url || null,
                        } as KanbanUser;
                    } else if (error.code !== "PGRST116") {
                        console.error("Error al obtener usuario:", error);
                        throw error;
                    }
                }

                // Si el usuario no existe en la tabla, crearlo
                if (!data) {
                    // Obtener información del perfil según el proveedor
                    const name =
                        user.user_metadata.name ||
                        user.user_metadata.full_name ||
                        user.email?.split("@")[0] ||
                        "";
                    const avatar_url = user.user_metadata.avatar_url || null;

                    const newUser = {
                        id: user.id,
                        email: user.email || "",
                        name,
                        avatar_url,
                    };

                    try {
                        // Intentar insertar el usuario con reintentos (máximo 3)
                        let insertError = null;
                        let insertSuccess = false;
                        let retryCount = 0;
                        const maxRetries = 3;

                        while (!insertSuccess && retryCount < maxRetries) {
                            const { error: currentError } = await supabase
                                .from("users")
                                .insert(newUser);

                            if (!currentError) {
                                insertSuccess = true;
                                break;
                            }

                            insertError = currentError;
                            retryCount++;

                            // Esperar un poco antes de reintentar (backoff exponencial)
                            await new Promise((resolve) =>
                                setTimeout(
                                    resolve,
                                    300 * Math.pow(2, retryCount)
                                )
                            );
                        }

                        if (insertError) {
                            console.error(
                                `Error al crear usuario después de ${retryCount} intentos:`,
                                insertError
                            );

                            // Si el error es que la tabla no existe, devolver el usuario temporal
                            if (
                                insertError.message?.includes("relation") &&
                                insertError.message?.includes("does not exist")
                            ) {
                                return newUser as KanbanUser;
                            }

                            // Si es un error de política, intentar una manera alternativa
                            if (insertError.code === "42501") {
                                // Error de permiso de política
                                console.log(
                                    "Intentando método alternativo para crear usuario..."
                                );
                                try {
                                    // Consultar si realmente el usuario ya existe (podría ser un error de RLS)
                                    const { data: checkData } = await supabase
                                        .from("users")
                                        .select("*")
                                        .eq("id", user.id)
                                        .single();

                                    if (checkData) {
                                        console.log(
                                            "Usuario encontrado en segundo intento"
                                        );
                                        return checkData as KanbanUser;
                                    }
                                } catch (e) {
                                    console.error(
                                        "Error en la verificación alternativa:",
                                        e
                                    );
                                }
                            }

                            throw insertError;
                        }
                    } catch (insertErr) {
                        console.error("Error al insertar usuario:", insertErr);
                        // Registrar el error en localStorage para diagnóstico
                        if (typeof window !== "undefined") {
                            try {
                                let errors = JSON.parse(
                                    localStorage.getItem("userCreateErrors") ||
                                        "[]"
                                );
                                errors.push({
                                    timestamp: new Date().toISOString(),
                                    userId: user.id,
                                    error:
                                        insertErr.message || String(insertErr),
                                });
                                localStorage.setItem(
                                    "userCreateErrors",
                                    JSON.stringify(errors)
                                );
                            } catch (e) {
                                console.error(
                                    "Error al guardar información de error:",
                                    e
                                );
                            }
                        }

                        // Devolver el usuario de todos modos para que la app siga funcionando
                        return newUser as KanbanUser;
                    }

                    // Verificar que la inserción se haya realizado correctamente
                    const { data: verifyData, error: verifyError } =
                        await supabase
                            .from("users")
                            .select("*")
                            .eq("id", user.id)
                            .single();

                    if (verifyError || !verifyData) {
                        console.warn(
                            "Usuario creado pero no se pudo verificar:",
                            verifyError
                        );
                        // Usar el objeto creado localmente
                        return newUser as KanbanUser;
                    }

                    return verifyData as KanbanUser;
                }

                return data as KanbanUser;
            } catch (err) {
                console.error("Error en getCurrentUser:", err);
                // Devolver un usuario básico para que la aplicación siga funcionando
                return {
                    id: user.id,
                    email: user.email || "",
                    name:
                        user.user_metadata.name ||
                        user.user_metadata.full_name ||
                        user.email?.split("@")[0] ||
                        "",
                    avatar_url: user.user_metadata.avatar_url || null,
                } as KanbanUser;
            }
        } catch (authError) {
            console.error("Error de autenticación:", authError);
            return null;
        }
    },

    // Método para obtener todos los usuarios
    async getAllUsers() {
        const supabase = createClientSupabaseClient();

        try {
            const { data, error } = await supabase.from("users").select("*");

            if (error) {
                // Si el error es que la tabla no existe, devolveremos un array vacío
                if (
                    error.message?.includes("relation") &&
                    error.message?.includes("does not exist")
                ) {
                    console.error(
                        "La tabla 'users' no existe. Necesitas crearla en Supabase."
                    );

                    // Intentar obtener al menos el usuario actual
                    try {
                        const currentUser = await this.getCurrentUser();
                        return currentUser ? [currentUser] : [];
                    } catch (e) {
                        console.error("No se pudo obtener usuario actual:", e);
                        return [];
                    }
                }

                console.error("Error al obtener usuarios:", error);
                throw error;
            }

            return data as KanbanUser[];
        } catch (err) {
            console.error("Error en getAllUsers:", err);
            return []; // Devolver array vacío para que la app siga funcionando
        }
    },

    // Método para actualizar el perfil de un usuario
    async updateUserProfile(
        id: string,
        name: string,
        avatar_url: string | null
    ) {
        const supabase = createClientSupabaseClient();

        try {
            const { data, error } = await supabase
                .from("users")
                .update({ name, avatar_url })
                .eq("id", id)
                .select()
                .single();

            if (error) {
                // Si el error es que la tabla no existe, mostrar mensaje amigable
                if (
                    error.message?.includes("relation") &&
                    error.message?.includes("does not exist")
                ) {
                    console.error(
                        "La tabla 'users' no existe. Necesitas crearla en Supabase."
                    );

                    // Devolver un objeto básico para que la app siga funcionando
                    return {
                        id,
                        name,
                        avatar_url,
                        email: "", // No tenemos email en este punto
                    } as KanbanUser;
                }

                console.error("Error al actualizar perfil:", error);
                throw error;
            }

            return data as KanbanUser;
        } catch (err) {
            console.error("Error en updateUserProfile:", err);
            // Devolver un objeto básico para que la app siga funcionando
            return {
                id,
                name,
                avatar_url,
                email: "",
            } as KanbanUser;
        }
    },
};
