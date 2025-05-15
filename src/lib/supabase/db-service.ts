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

        try {
            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                // Si el error es que la tabla no existe, devolver un array vacío
                if (
                    error.message?.includes("relation") &&
                    error.message?.includes("does not exist")
                ) {
                    console.error(
                        "La tabla 'projects' no existe. Necesitas crearla en Supabase."
                    );
                    return [];
                }

                // Si el error es de recursión infinita en la política
                if (
                    error.code === "42P17" &&
                    error.message?.includes(
                        "infinite recursion detected in policy"
                    )
                ) {
                    console.error(
                        "Se detectó recursión infinita en la política de la tabla 'projects'. " +
                            "Ejecuta el script de corrección en INSTRUCCIONES_SUPABASE.md"
                    );
                    return [];
                }

                console.error("Error al obtener proyectos:", error);
                throw error;
            }

            return data as DbProject[];
        } catch (err) {
            console.error("Error en getProjects:", err);
            return []; // Devolver array vacío para que la app siga funcionando
        }
    },

    async createProject(name: string) {
        const supabase = createClientSupabaseClient();

        try {
            const { data, error } = await supabase
                .from("projects")
                .insert({ name, id: uuidv4() })
                .select()
                .single();

            if (error) {
                // Si el error es que la tabla no existe, devolver un proyecto simulado
                if (
                    error.message?.includes("relation") &&
                    error.message?.includes("does not exist")
                ) {
                    console.error(
                        "La tabla 'projects' no existe. Necesitas crearla en Supabase."
                    );

                    // Devolver un proyecto simulado
                    const mockProject = {
                        id: uuidv4(),
                        name,
                        user_id:
                            (await supabase.auth.getUser()).data.user?.id || "",
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };

                    return mockProject as DbProject;
                }

                console.error("Error al crear proyecto:", error);
                throw error;
            }

            return data as DbProject;
        } catch (err) {
            console.error("Error en createProject:", err);

            // Devolver un proyecto simulado en caso de error
            return {
                id: uuidv4(),
                name,
                user_id: (await supabase.auth.getUser()).data.user?.id || "",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            } as DbProject;
        }
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

        try {
            const { data, error } = await supabase
                .from("columns")
                .select("*")
                .eq("project_id", projectId)
                .order("position", { ascending: true });

            if (error) {
                // Si el error es que la tabla no existe, devolver un array vacío
                if (
                    error.message?.includes("relation") &&
                    error.message?.includes("does not exist")
                ) {
                    console.error(
                        "La tabla 'columns' no existe. Necesitas crearla en Supabase."
                    );
                    return [];
                }

                console.error("Error al obtener columnas:", error);
                throw error;
            }

            return data as DbColumn[];
        } catch (err) {
            console.error("Error en getColumns:", err);
            return []; // Devolver array vacío para que la app siga funcionando
        }
    },

    async createColumn(projectId: string, title: string, position: number) {
        const supabase = createClientSupabaseClient();

        try {
            const { data, error } = await supabase
                .from("columns")
                .insert({
                    project_id: projectId,
                    title,
                    position,
                    id: uuidv4(),
                })
                .select()
                .single();

            if (error) {
                // Si el error es que la tabla no existe
                if (
                    error.message?.includes("relation") &&
                    error.message?.includes("does not exist")
                ) {
                    console.error(
                        "La tabla 'columns' no existe. Necesitas crearla en Supabase."
                    );

                    // Devolver una columna simulada
                    return {
                        id: uuidv4(),
                        project_id: projectId,
                        title,
                        position,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    } as DbColumn;
                }

                // Si el error es de recursión infinita en la política
                if (
                    error.code === "42P17" &&
                    error.message?.includes(
                        "infinite recursion detected in policy"
                    )
                ) {
                    console.error(
                        "Se detectó recursión infinita en políticas RLS. " +
                            "Ejecuta el script de corrección en INSTRUCCIONES_SUPABASE.md"
                    );

                    // Devolver una columna simulada
                    return {
                        id: uuidv4(),
                        project_id: projectId,
                        title,
                        position,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    } as DbColumn;
                }

                console.error("Error al crear columna:", error);
                throw error;
            }

            return data as DbColumn;
        } catch (err) {
            console.error("Error en createColumn:", err);

            // Devolver una columna simulada en caso de error
            return {
                id: uuidv4(),
                project_id: projectId,
                title,
                position,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            } as DbColumn;
        }
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

        try {
            const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .eq("column_id", columnId)
                .order("position", { ascending: true });

            if (error) {
                // Si el error es que la tabla no existe, devolver un array vacío
                if (
                    error.message?.includes("relation") &&
                    error.message?.includes("does not exist")
                ) {
                    console.error(
                        "La tabla 'tasks' no existe. Necesitas crearla en Supabase."
                    );
                    return [];
                }

                console.error("Error al obtener tareas:", error);
                throw error;
            }

            return data as DbTask[];
        } catch (err) {
            console.error("Error en getTasks:", err);
            return []; // Devolver array vacío para que la app siga funcionando
        }
    },

    async createTask(
        columnId: string,
        title: string,
        description: string | null,
        position: number
    ) {
        const supabase = createClientSupabaseClient();

        try {
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
                // Si el error es que la tabla no existe, devolver una tarea simulada
                if (
                    error.message?.includes("relation") &&
                    error.message?.includes("does not exist")
                ) {
                    console.error(
                        "La tabla 'tasks' no existe. Necesitas crearla en Supabase."
                    );

                    // Devolver una tarea simulada
                    return {
                        id: uuidv4(),
                        column_id: columnId,
                        title,
                        description,
                        position,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    } as DbTask;
                }

                console.error("Error al crear tarea:", error);
                throw error;
            }

            return data as DbTask;
        } catch (err) {
            console.error("Error en createTask:", err);

            // Devolver una tarea simulada en caso de error
            return {
                id: uuidv4(),
                column_id: columnId,
                title,
                description,
                position,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            } as DbTask;
        }
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
        const { data, error } = await supabase.from("users").select("*");

        if (error) {
            console.error("Error al obtener usuarios:", error);
            throw error;
        }

        return data as KanbanUser[];
    },

    // Cargar datos completos del proyecto
    async loadFullProject(projectId: string) {
        const supabase = createClientSupabaseClient();

        try {
            // Obtener proyecto
            const { data: project, error: projectError } = await supabase
                .from("projects")
                .select("*")
                .eq("id", projectId)
                .single();

            if (projectError) {
                // Si el error es que la tabla no existe, devolver un proyecto simulado
                if (
                    projectError.message?.includes("relation") &&
                    projectError.message?.includes("does not exist")
                ) {
                    console.error(
                        "La tabla 'projects' no existe. Necesitas crearla en Supabase."
                    );

                    // Crear un proyecto simulado con columnas vacías
                    return {
                        id: projectId,
                        name: "Proyecto temporal",
                        user_id:
                            (await supabase.auth.getUser()).data.user?.id || "",
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        columns: [],
                    };
                }

                // Si el error es de recursión infinita en la política
                if (
                    projectError.code === "42P17" &&
                    projectError.message?.includes(
                        "infinite recursion detected in policy"
                    )
                ) {
                    console.error(
                        "Se detectó recursión infinita en la política de la tabla 'projects'. " +
                            "Ejecuta el script de corrección en INSTRUCCIONES_SUPABASE.md"
                    );

                    // Crear un proyecto simulado con columnas vacías
                    return {
                        id: projectId,
                        name: "Proyecto (error de política RLS)",
                        user_id:
                            (await supabase.auth.getUser()).data.user?.id || "",
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        columns: [],
                    };
                }

                console.error("Error al obtener proyecto:", projectError);
                throw projectError;
            }

            try {
                // Obtener columnas
                const { data: columns, error: columnsError } = await supabase
                    .from("columns")
                    .select("*")
                    .eq("project_id", projectId)
                    .order("position", { ascending: true });

                if (columnsError) {
                    // Si el error es que la tabla no existe, devolver proyecto con columnas vacías
                    if (
                        columnsError.message?.includes("relation") &&
                        columnsError.message?.includes("does not exist")
                    ) {
                        console.error(
                            "La tabla 'columns' no existe. Necesitas crearla en Supabase."
                        );

                        return {
                            ...project,
                            columns: [],
                        };
                    }

                    console.error("Error al obtener columnas:", columnsError);
                    throw columnsError;
                }

                // Para cada columna, obtener sus tareas
                const columnsWithTasks = await Promise.all(
                    (columns as DbColumn[]).map(async (column) => {
                        try {
                            const { data: tasks, error: tasksError } =
                                await supabase
                                    .from("tasks")
                                    .select("*")
                                    .eq("column_id", column.id)
                                    .order("position", { ascending: true });

                            if (tasksError) {
                                // Si el error es que la tabla no existe, devolver columna con tareas vacías
                                if (
                                    tasksError.message?.includes("relation") &&
                                    tasksError.message?.includes(
                                        "does not exist"
                                    )
                                ) {
                                    console.error(
                                        "La tabla 'tasks' no existe. Necesitas crearla en Supabase."
                                    );

                                    return {
                                        ...column,
                                        tasks: [],
                                    };
                                }

                                console.error(
                                    "Error al obtener tareas:",
                                    tasksError
                                );
                                throw tasksError;
                            }

                            // Para cada tarea, obtener sus asignaciones
                            const tasksWithAssignments = await Promise.all(
                                (tasks as DbTask[]).map(async (task) => {
                                    try {
                                        const {
                                            data: assignments,
                                            error: assignmentsError,
                                        } = await supabase
                                            .from("task_assignments")
                                            .select("*, users:user_id(*)")
                                            .eq("task_id", task.id);

                                        if (assignmentsError) {
                                            // Si el error es que la tabla no existe, devolver tarea sin asignaciones
                                            if (
                                                assignmentsError.message?.includes(
                                                    "relation"
                                                ) &&
                                                assignmentsError.message?.includes(
                                                    "does not exist"
                                                )
                                            ) {
                                                console.error(
                                                    "La tabla 'task_assignments' o 'users' no existe. Necesitas crearla en Supabase."
                                                );

                                                return {
                                                    ...task,
                                                    assignedUsers: [],
                                                };
                                            }

                                            console.error(
                                                "Error al obtener asignaciones:",
                                                assignmentsError
                                            );
                                            throw assignmentsError;
                                        }

                                        return {
                                            ...task,
                                            assignedUsers: assignments.map(
                                                (assignment: any) => ({
                                                    id:
                                                        assignment.users?.id ||
                                                        "",
                                                    name:
                                                        assignment.users
                                                            ?.name ||
                                                        assignment.users
                                                            ?.email ||
                                                        "",
                                                    email:
                                                        assignment.users
                                                            ?.email || "",
                                                    avatar:
                                                        assignment.users
                                                            ?.avatar_url ||
                                                        null,
                                                })
                                            ),
                                        };
                                    } catch (err) {
                                        console.error(
                                            "Error en procesamiento de tarea:",
                                            err
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
                        } catch (err) {
                            console.error(
                                "Error en procesamiento de columna:",
                                err
                            );
                            return {
                                ...column,
                                tasks: [],
                            };
                        }
                    })
                );

                return {
                    ...project,
                    columns: columnsWithTasks,
                };
            } catch (err) {
                console.error("Error en loadFullProject:", err);
                return {
                    ...project,
                    columns: [],
                };
            }
        } catch (err) {
            console.error("Error en loadFullProject:", err);
            // Devolver un proyecto básico en caso de error
            return {
                id: projectId,
                name: "Proyecto (error al cargar)",
                user_id: (await supabase.auth.getUser()).data.user?.id || "",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                columns: [],
            };
        }
    },
};
