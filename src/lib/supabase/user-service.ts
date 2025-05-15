import { createClientSupabaseClient } from "./client";
import { clientDbService, type KanbanUser } from "./db-service";

export type { KanbanUser };

export const userService = {
    async getCurrentUser() {
        const supabase = createClientSupabaseClient();
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            console.error("Error al obtener el usuario actual:", error);
            return null;
        }

        // Asegurarse de que el usuario existe en la tabla users
        try {
            const dbUser = await clientDbService.upsertUser({
                id: user.id,
                email: user.email || "",
                name: user.user_metadata?.name,
                avatar_url: user.user_metadata?.avatar_url,
            });

            return dbUser;
        } catch (error) {
            console.error(
                "Error al sincronizar usuario con la base de datos:",
                error
            );

            // Devolver un objeto de usuario básico si falla la sincronización
            return {
                id: user.id,
                email: user.email || "",
                name:
                    user.user_metadata?.name ||
                    user.email?.split("@")[0] ||
                    "Usuario",
                avatar_url: user.user_metadata?.avatar_url,
            };
        }
    },

    async getAllUsers() {
        try {
            const users = await clientDbService.getUsers();

            if (!users || users.length === 0) {
                // Si no hay usuarios en la tabla, intentar obtener al menos el usuario actual
                const currentUser = await this.getCurrentUser();
                return currentUser ? [currentUser] : [];
            }

            return users;
        } catch (error) {
            console.error("Error al obtener todos los usuarios:", error);

            // Si falla, intentar obtener al menos el usuario actual
            try {
                const currentUser = await this.getCurrentUser();
                return currentUser ? [currentUser] : [];
            } catch (innerError) {
                console.error(
                    "Error al obtener usuario actual como fallback:",
                    innerError
                );
                return [];
            }
        }
    },

    async updateUserProfile(
        userId: string,
        data: { name?: string; avatar_url?: string }
    ) {
        const supabase = createClientSupabaseClient();

        try {
            // Primero actualizar los metadatos del usuario en auth
            if (data.name) {
                await supabase.auth.updateUser({
                    data: { name: data.name },
                });
            }

            // Luego actualizar en la tabla users
            const { data: updatedUser, error } = await supabase
                .from("users")
                .update({
                    name: data.name,
                    avatar_url: data.avatar_url,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", userId)
                .select()
                .single();

            if (error) {
                console.error("Error al actualizar perfil de usuario:", error);
                throw error;
            }

            return updatedUser as KanbanUser;
        } catch (error) {
            console.error("Error al actualizar perfil de usuario:", error);
            throw error;
        }
    },
};
