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

export type DbProjectMember = {
    id: string;
    project_id: string;
    user_id: string;
    role: string;
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
        }        // Primero obtener todos los proyectos donde el usuario es propietario
        const { data: ownedProjects, error: ownedError } = await supabase
            .from("projects")
            .select("*")
            .eq("user_id", user.id);

        if (ownedError) {
            console.error("Error al obtener proyectos propios:", ownedError);
            throw ownedError;
        }        // Luego obtener los IDs de proyectos donde el usuario es miembro
        let memberProjects = null;
        let memberError = null;
        
        try {
            const result = await supabase
                .from("project_members")
                .select("project_id")
                .eq("user_id", user.id);
            
            memberProjects = result.data;
            memberError = result.error;
        } catch (error) {
            console.warn("Tabla project_members no existe aún, mostrando solo proyectos propios");
            memberError = error;
        }

        if (memberError) {
            console.error("Error al obtener membresías:", memberError);
            // No lanzar error, continuar solo con proyectos propios
        }

        const memberProjectIds = memberProjects?.map((m) => m.project_id) || [];

        // Obtener los proyectos donde es miembro (excluyendo los que ya posee)
        let memberProjectsData: DbProject[] = [];
        if (memberProjectIds.length > 0) {            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .in("id", memberProjectIds)
                .neq("user_id", user.id); // Excluir proyectos que ya posee

            if (error) {
                console.error(
                    "Error al obtener proyectos como miembro:",
                    error
                );
                // No lanzar error, continuar sin estos proyectos
            } else {
                memberProjectsData = data as DbProject[];
            }
        } // Combinar y ordenar todos los proyectos
        const allProjects = [...(ownedProjects || []), ...memberProjectsData];
        const sortedProjects = allProjects.sort((a, b) => {
            // Usar toString() para asegurar que tenemos strings válidos
            const dateA = a.created_at
                ? new Date(a.created_at.toString()).getTime()
                : 0;
            const dateB = b.created_at
                ? new Date(b.created_at.toString()).getTime()
                : 0;
            return dateB - dateA;
        });

        return sortedProjects as DbProject[];
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
        }        return true;
    },

    // Miembros del proyecto
    async getProjectMembers(projectId: string) {
        const supabase = createClientSupabaseClient();
        
        try {
            const { data, error } = await supabase
                .from("project_members")
                .select("*")
                .eq("project_id", projectId);

            if (error) {
                console.error("Error al obtener miembros del proyecto:", error);
                throw error;
            }

            return data as DbProjectMember[];
        } catch (error) {
            console.warn("Tabla project_members no existe, devolviendo array vacío");
            return [];
        }
    },

    async addUserToProject(
        projectId: string,
        userId: string,
        role: string = "member"
    ) {
        const supabase = createClientSupabaseClient();

        // Verificar si el usuario ya es miembro del proyecto
        const { data: existingMember } = await supabase
            .from("project_members")
            .select("*")
            .eq("project_id", projectId)
            .eq("user_id", userId)
            .single();

        if (existingMember) {
            // El usuario ya es miembro, devolver el miembro existente
            return existingMember as DbProjectMember;
        }

        // Agregar el usuario como miembro del proyecto
        const { data, error } = await supabase
            .from("project_members")
            .insert({
                id: uuidv4(),
                project_id: projectId,
                user_id: userId,
                role,
            })
            .select()
            .single();

        if (error) {
            console.error("Error al agregar usuario al proyecto:", error);
            throw error;
        }

        return data as DbProjectMember;
    },

    async removeUserFromProject(projectId: string, userId: string) {
        const supabase = createClientSupabaseClient();
        const { error } = await supabase
            .from("project_members")
            .delete()
            .eq("project_id", projectId)
            .eq("user_id", userId);

        if (error) {
            console.error("Error al eliminar usuario del proyecto:", error);
            throw error;
        }

        return true;
    },

    async updateProjectMemberRole(
        projectId: string,
        userId: string,
        role: string
    ) {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase
            .from("project_members")
            .update({ role })
            .eq("project_id", projectId)
            .eq("user_id", userId)
            .select()
            .single();

        if (error) {
            console.error("Error al actualizar rol del miembro:", error);
            throw error;
        }

        return data as DbProjectMember;
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

        // Primero, obtener la información de la tarea para conseguir el project_id
        const { data: taskData, error: taskError } = await supabase
            .from("tasks")
            .select(
                `
                id,
                column_id
            `
            )
            .eq("id", taskId)
            .single();

        if (taskError) {
            console.error("Error al obtener datos de la tarea:", taskError);
            throw taskError;
        } // Obtener el project_id de la columna
        const { data: columnData, error: columnError } = await supabase
            .from("columns")
            .select("project_id")
            .eq("id", (taskData as any).column_id)
            .single();

        if (columnError) {
            console.error("Error al obtener datos de la columna:", columnError);
            throw columnError;
        }

        // Asignar el usuario a la tarea
        const { data, error } = await supabase
            .from("task_assignments")
            .insert({ task_id: taskId, user_id: userId, id: uuidv4() })
            .select()
            .single();
        if (error) {
            console.error("Error al asignar usuario a tarea:", error);
            throw error;
        }

        // Auto-asignar usuario al proyecto si no es ya miembro
        if (columnData && "project_id" in columnData && columnData.project_id) {
            try {
                await this.addUserToProject(
                    columnData.project_id as string,
                    userId,
                    "member"
                );
            } catch (memberError) {
                // Si falla agregar como miembro, al menos registrar el error pero no fallar la asignación de tarea
                console.warn(
                    "No se pudo agregar el usuario como miembro del proyecto:",
                    memberError
                );
            }
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
                            // Primero obtener las asignaciones
                            const {
                                data: assignments,
                                error: assignmentsError,
                            } = await supabase
                                .from("task_assignments")
                                .select("*")
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

                            // Para cada asignación, obtener el usuario correspondiente
                            const assignedUsers = await Promise.all(
                                assignments.map(
                                    //@ts-ignore
                                    async (assignment: DbTaskAssignment) => {
                                        const {
                                            data: userData,
                                            error: userError,
                                        } = await supabase
                                            .from("users")
                                            .select("*")
                                            .eq("id", assignment.user_id)
                                            .single();

                                        if (userError) {
                                            console.error(
                                                "Error al obtener usuario:",
                                                userError
                                            );
                                            return {
                                                id: assignment.user_id,
                                                name: "Usuario",
                                                email: "",
                                                avatar: null,
                                            };
                                        }

                                        return {
                                            id: userData.id,
                                            name:
                                                userData.name ||
                                                userData.email ||
                                                "Usuario",
                                            email: userData.email || "",
                                            avatar: userData.avatar_url,
                                        };
                                    }
                                )
                            );
                            return {
                                ...task,
                                assignedUsers,
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
