import { useState, useEffect } from "react";
import { clientDbService } from "@/lib/supabase/db-service";
import { userService } from "@/lib/supabase/user-service";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { NotoProject, User } from "../types";

export function useProjects(user: any) {
    const [projects, setProjects] = useState<NotoProject[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const activeProject = activeProjectId
        ? projects.find((p) => p.id === activeProjectId)
        : projects.length > 0
        ? projects[0]
        : null;

    // Cargar datos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            if (!user) return;

            setIsLoading(true);
            try {
                // Cargar usuarios
                const allUsers = await userService.getAllUsers();
                setUsers(
                    allUsers.map((u) => ({
                        id: u.id,
                        name: u.name || u.email.split("@")[0],
                        email: u.email,
                        avatar: u.avatar_url,
                    }))
                );

                // Cargar proyectos
                const projectsData = await clientDbService.getProjects();

                // Mostrar mensaje si hay error de política RLS
                if (projectsData.length === 0) {
                    // Verificar si el error puede ser de política RLS
                    try {
                        const supabase = createClientSupabaseClient();
                        const { error } = await supabase
                            .from("projects")
                            .select("count(*)", { count: "exact" });

                        if (
                            error &&
                            error.code === "42P17" &&
                            error.message?.includes("infinite recursion")
                        ) {
                            console.warn(
                                "Detectado error de recursión infinita en políticas RLS"
                            );
                        }
                    } catch (policyError) {
                        console.error(
                            "Error al verificar políticas:",
                            policyError
                        );
                    }

                    // Crear un proyecto por defecto si no hay ninguno
                    const defaultProject = await clientDbService.createProject(
                        "Mi primer proyecto"
                    );

                    // Crear columnas por defecto
                    const column1 = await clientDbService.createColumn(
                        defaultProject.id,
                        "Por hacer",
                        0
                    );
                    const column2 = await clientDbService.createColumn(
                        defaultProject.id,
                        "En progreso",
                        1
                    );
                    const column3 = await clientDbService.createColumn(
                        defaultProject.id,
                        "Completado",
                        2
                    );

                    setProjects([
                        {
                            id: defaultProject.id,
                            name: defaultProject.name,
                            columns: [
                                {
                                    id: column1.id,
                                    title: column1.title,
                                    tasks: [],
                                },
                                {
                                    id: column2.id,
                                    title: column2.title,
                                    tasks: [],
                                },
                                {
                                    id: column3.id,
                                    title: column3.title,
                                    tasks: [],
                                },
                            ],
                        },
                    ]);
                    setActiveProjectId(defaultProject.id);
                } else {
                    // Cargar todos los proyectos con sus datos
                    const fullProjects = await Promise.all(
                        projectsData.map(async (project) => {
                            try {
                                const fullProject =
                                    await clientDbService.loadFullProject(
                                        project.id
                                    );
                                return {
                                    id: project.id,
                                    name: project.name,
                                    columns: fullProject.columns.map(
                                        (col: any) => ({
                                            id: col.id,
                                            title: col.title,
                                            tasks: col.tasks.map(
                                                (task: any) => ({
                                                    id: task.id,
                                                    title: task.title,
                                                    description:
                                                        task.description,
                                                    assignedUsers:
                                                        task.assignedUsers ||
                                                        [],
                                                })
                                            ),
                                        })
                                    ),
                                };
                            } catch (error) {
                                console.error(
                                    `Error al cargar el proyecto ${project.id}:`,
                                    error
                                );
                                return {
                                    id: project.id,
                                    name: project.name,
                                    columns: [],
                                };
                            }
                        })
                    );

                    setProjects(fullProjects);
                    setActiveProjectId(fullProjects[0]?.id || null);
                }
            } catch (error) {
                console.error("Error al cargar datos iniciales:", error);
                toast.error(
                    "No se pudieron cargar los datos. Por favor, intenta de nuevo."
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [user]);

    const handleProjectSelect = (projectId: string) => {
        setActiveProjectId(projectId);
    };    const handleProjectCreate = async (projectName: string, memberUserIds: string[] = []) => {
        try {
            const newProject = await clientDbService.createProjectWithMembers(projectName, memberUserIds);

            // Crear columnas por defecto
            const column1 = await clientDbService.createColumn(
                newProject.id,
                "Por hacer",
                0
            );
            const column2 = await clientDbService.createColumn(
                newProject.id,
                "En progreso",
                1
            );
            const column3 = await clientDbService.createColumn(
                newProject.id,
                "Completado",
                2
            );

            const projectWithColumns: NotoProject = {
                id: newProject.id,
                name: newProject.name,
                columns: [
                    { id: column1.id, title: column1.title, tasks: [] },
                    { id: column2.id, title: column2.title, tasks: [] },
                    { id: column3.id, title: column3.title, tasks: [] },
                ],
            };

            setProjects([...projects, projectWithColumns]);
            setActiveProjectId(newProject.id);

            const memberCount = memberUserIds.length;
            const successMessage = memberCount > 0 
                ? `El proyecto "${projectName}" ha sido creado con ${memberCount} miembro${memberCount === 1 ? '' : 's'}.`
                : `El proyecto "${projectName}" ha sido creado exitosamente.`;

            toast.success("Proyecto creado", {
                description: successMessage,
            });
        } catch (error) {
            console.error("Error al crear proyecto:", error);
            toast.error("Error", {
                description:
                    "No se pudo crear el proyecto. Por favor, intenta de nuevo.",
            });
        }
    };

    const handleProjectUpdate = async (
        projectId: string,
        projectName: string
    ) => {
        try {
            await clientDbService.updateProject(projectId, projectName);

            setProjects(
                projects.map((project) =>
                    project.id === projectId
                        ? { ...project, name: projectName }
                        : project
                )
            );

            toast.success("Proyecto actualizado", {
                description: `El proyecto ha sido actualizado exitosamente.`,
            });
        } catch (error) {
            console.error("Error al actualizar proyecto:", error);
            toast.error("Error", {
                description:
                    "No se pudo actualizar el proyecto. Por favor, intenta de nuevo.",
            });
        }
    };

    const handleProjectDelete = async (projectId: string) => {
        try {
            await clientDbService.deleteProject(projectId);

            const filteredProjects = projects.filter(
                (project) => project.id !== projectId
            );
            setProjects(filteredProjects);

            // Si se elimina el proyecto activo, seleccionar otro
            if (projectId === activeProjectId && filteredProjects.length > 0) {
                setActiveProjectId(filteredProjects[0].id);
            }

            toast.success("Proyecto eliminado", {
                description: "El proyecto ha sido eliminado exitosamente.",
            });
        } catch (error) {
            console.error("Error al eliminar proyecto:", error);
            toast.error("Error", {
                description:
                    "No se pudo eliminar el proyecto. Por favor, intenta de nuevo.",
            });
        }
    };

    return {
        projects,
        setProjects,
        activeProject,
        activeProjectId,
        users,
        isLoading,
        handleProjectSelect,
        handleProjectCreate,
        handleProjectUpdate,
        handleProjectDelete,
    };
}
