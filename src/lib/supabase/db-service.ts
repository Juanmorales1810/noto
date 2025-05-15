import { createClientSupabaseClient } from "./client";
import { v4 as uuidv4 } from "uuid";

// Tipos
export type DbProject = {
    id: string;
    name: string;
    user_id: string;
    created_at?: string;
    updated_at?: string;
};

export type DbColumn = {
    id: string;
    title: string;
    project_id: string;
    position: number;
    created_at?: string;
    updated_at?: string;
};

export type DbTask = {
    id: string;
    title: string;
    description: string | null;
    column_id: string;
    position: number;
    created_at?: string;
    updated_at?: string;
};

export type DbTaskAssignment = {
    id: string;
    task_id: string;
    user_id: string;
    created_at?: string;
};

export type KanbanUser = {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
};

// Servicios para el cliente
export const clientDbService = {
    // Proyectos
    async getProjects() {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error al obtener proyectos:", error);
            throw error;
        }

        return data as DbProject[];
    },

    async createProject(name: string) {
        const supabase = createClientSupabaseClient();

        // Obtener el usuario actual
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error("Error al obtener el usuario actual:", userError);
            throw (
                userError || new Error("No se pudo obtener el usuario actual")
            );
        }

        // Crear el proyecto con el ID del usuario actual
        const { data, error } = await supabase
            .from("projects")
            .insert({
                name,
                id: uuidv4(),
                user_id: user.id, // Establecer explícitamente el user_id
            })
            .select()
            .single();

        if (error) {
            console.error("Error al crear proyecto:", error);
            throw error;
        }

        return data as DbProject;
    },

    async updateProject(id: string, name: string) {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
            .from("projects")
            .update({ name, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error al actualizar proyecto:", error);
            throw error;
        }

        return data as DbProject;
    },

    async deleteProject(id: string) {
        const supabase = createClientSupabaseClient();
        const { error } = await supabase.from("projects").delete().eq("id", id);

        if (error) {
            console.error("Error al eliminar proyecto:", error);
            throw error;
        }

        return true;
    },

    // Columnas
    async getColumns(projectId: string) {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
            .from("columns")
            .select("*")
            .eq("project_id", projectId)
            .order("position", { ascending: true });

        if (error) {
            console.error("Error al obtener columnas:", error);
            throw error;
        }

        return data as DbColumn[];
    },

    async createColumn(projectId: string, title: string, position: number) {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
            .from("columns")
            .insert({ project_id: projectId, title, position, id: uuidv4() })
            .select()
            .single();

        if (error) {
            console.error("Error al crear columna:", error);
            throw error;
        }

        return data as DbColumn;
    },

    async updateColumn(id: string, title: string) {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
            .from("columns")
            .update({ title, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error al actualizar columna:", error);
            throw error;
        }

        return data as DbColumn;
    },

    async updateColumnPosition(id: string, position: number) {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
            .from("columns")
            .update({ position, updated_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error al actualizar posición de columna:", error);
            throw error;
        }

        return data as DbColumn;
    },

    async deleteColumn(id: string) {
        const supabase = createClientSupabaseClient();
        const { error } = await supabase.from("columns").delete().eq("id", id);

        if (error) {
            console.error("Error al eliminar columna:", error);
            throw error;
        }

        return true;
    },

    // Tareas
    async getTasks(columnId: string) {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("column_id", columnId)
            .order("position", { ascending: true });

        if (error) {
            console.error("Error al obtener tareas:", error);
            throw error;
        }

        return data as DbTask[];
    },

    async createTask(
        columnId: string,
        title: string,
        description: string | null,
        position: number
    ) {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
            .from("tasks")
            .insert({
                column_id: columnId,
                title,
                description,
                position,
                id: uuidv4(),
            })
            .select()
            .single();

        if (error) {
            console.error("Error al crear tarea:", error);
            throw error;
        }

        return data as DbTask;
    },

    async updateTask(id: string, title: string, description: string | null) {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
            .from("tasks")
            .update({
                title,
                description,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error al actualizar tarea:", error);
            throw error;
        }

        return data as DbTask;
    },

    async updateTaskPosition(id: string, columnId: string, position: number) {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
            .from("tasks")
            .update({
                column_id: columnId,
                position,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Error al actualizar posición de tarea:", error);
            throw error;
        }

        return data as DbTask;
    },

    async deleteTask(id: string) {
        const supabase = createClientSupabaseClient();
        const { error } = await supabase.from("tasks").delete().eq("id", id);

        if (error) {
            console.error("Error al eliminar tarea:", error);
            throw error;
        }

        return true;
    },

    // Asignaciones de tareas
    async getTaskAssignments(taskId: string) {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
            .from("task_assignments")
            .select("*")
            .eq("task_id", taskId);

        if (error) {
            console.error("Error al obtener asignaciones de tarea:", error);
            throw error;
        }

        return data as DbTaskAssignment[];
    },

    async assignUserToTask(taskId: string, userId: string) {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
            .from("task_assignments")
            .insert({ task_id: taskId, user_id: userId, id: uuidv4() })
            .select()
            .single();

        if (error) {
            console.error("Error al asignar usuario a tarea:", error);
            throw error;
        }

        return data as DbTaskAssignment;
    },

    async removeUserFromTask(taskId: string, userId: string) {
        const supabase = createClientSupabaseClient();
        const { error } = await supabase
            .from("task_assignments")
            .delete()
            .eq("task_id", taskId)
            .eq("user_id", userId);

        if (error) {
            console.error("Error al eliminar asignación de tarea:", error);
            throw error;
        }

        return true;
    },

    // Usuarios
    async getUsers() {
        const supabase = createClientSupabaseClient();

        try {
            const { data, error } = await supabase.from("users").select("*");

            if (error) {
                console.error("Error al obtener usuarios:", error);
                throw error;
            }

            return data as KanbanUser[];
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
            // Si hay un error, devolver una lista vacía como fallback
            return [];
        }
    },

    // Cargar datos completos del proyecto
    async loadFullProject(projectId: string) {
        const supabase = createClientSupabaseClient();

        // Obtener proyecto
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .single();

        if (projectError) {
            console.error("Error al obtener proyecto:", projectError);
            throw projectError;
        }

        // Obtener columnas
        const { data: columns, error: columnsError } = await supabase
            .from("columns")
            .select("*")
            .eq("project_id", projectId)
            .order("position", { ascending: true });

        if (columnsError) {
            console.error("Error al obtener columnas:", columnsError);
            throw columnsError;
        }

        // Para cada columna, obtener sus tareas
        const columnsWithTasks = await Promise.all(
            (columns as DbColumn[]).map(async (column: DbColumn) => {
                const { data: tasks, error: tasksError } = await supabase
                    .from("tasks")
                    .select("*")
                    .eq("column_id", column.id)
                    .order("position", { ascending: true });

                if (tasksError) {
                    console.error("Error al obtener tareas:", tasksError);
                    throw tasksError;
                }

                // Para cada tarea, obtener sus asignaciones
                const tasksWithAssignments = await Promise.all(
                    tasks.map(async (task) => {
                        try {
                            const {
                                data: assignments,
                                error: assignmentsError,
                            } = await supabase
                                .from("task_assignments")
                                .select("*, users:user_id(*)")
                                .eq("task_id", task.id as string);

                            if (assignmentsError) {
                                console.error(
                                    "Error al obtener asignaciones:",
                                    assignmentsError
                                );
                                return {
                                    ...task,
                                    assignedUsers: [],
                                };
                            }

                            return {
                                ...task,
                                assignedUsers: assignments.map(
                                    (assignment: any) => ({
                                        id:
                                            assignment.users?.id ||
                                            assignment.user_id,
                                        name:
                                            assignment.users?.name ||
                                            assignment.users?.email ||
                                            "Usuario",
                                        email: assignment.users?.email || "",
                                        avatar: assignment.users?.avatar_url,
                                    })
                                ),
                            };
                        } catch (error) {
                            console.error(
                                `Error al procesar asignaciones para tarea ${task.id}:`,
                                error
                            );
                            return {
                                ...task,
                                assignedUsers: [],
                            };
                        }
                    })
                );

                return {
                    ...column,
                    tasks: tasksWithAssignments,
                };
            })
        );

        return {
            ...project,
            columns: columnsWithTasks,
        };
    },

    // Crear o actualizar un usuario en la tabla users
    async upsertUser(user: {
        id: string;
        email: string;
        name?: string;
        avatar_url?: string;
    }) {
        const supabase = createClientSupabaseClient();

        try {
            const { data, error } = await supabase
                .from("users")
                .upsert({
                    id: user.id,
                    email: user.email,
                    name: user.name || user.email.split("@")[0],
                    avatar_url: user.avatar_url,
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) {
                console.error("Error al crear/actualizar usuario:", error);
                throw error;
            }

            return data as KanbanUser;
        } catch (error) {
            console.error("Error al crear/actualizar usuario:", error);
            // Devolver el usuario original como fallback
            return user as KanbanUser;
        }
    },
};
