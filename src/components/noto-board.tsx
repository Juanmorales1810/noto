"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    MoreHorizontal,
    X,
    Edit,
    Trash2,
    LogOut,
    Loader2,
    GripVertical,
} from "lucide-react";
import { dragAndDrop } from "@formkit/drag-and-drop";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { ProjectSidebar, type Project } from "@/components/project-sidebar";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { clientDbService } from "@/lib/supabase/db-service";
import { userService } from "@/lib/supabase/user-service";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Tipos para nuestros datos
type User = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
};

type Task = {
    id: string;
    title: string;
    description?: string;
    assignedUsers: User[];
};

type Column = {
    id: string;
    title: string;
    tasks: Task[];
};

type NotoProject = {
    id: string;
    name: string;
    columns: Column[];
};

export default function NotoBoard() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const boardRef = useRef<HTMLDivElement>(null);
    const [columnsParent] = useAutoAnimate();

    // Estado para usuarios
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estado para proyectos
    const [projects, setProjects] = useState<NotoProject[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const activeProject = activeProjectId
        ? projects.find((p) => p.id === activeProjectId)
        : projects.length > 0
        ? projects[0]
        : null;

    // Estado para nueva columna
    const [newColumnTitle, setNewColumnTitle] = useState("");

    // Estados para nueva tarea
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [newTaskColumnId, setNewTaskColumnId] = useState("");
    const [newTaskAssignedUsers, setNewTaskAssignedUsers] = useState<User[]>(
        []
    );

    // Estados para editar tarea
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editingColumnId, setEditingColumnId] = useState(""); // Vamos a definir una función para manejar el arrastre y soltura de tareas
    const handleTaskDrop = async (
        e: React.DragEvent,
        destinationColumnId: string
    ) => {
        e.preventDefault();

        const taskId = e.dataTransfer.getData("taskId");
        const sourceColumnId = e.dataTransfer.getData("sourceColumnId");
        const sourceIndex = parseInt(e.dataTransfer.getData("sourceIndex"));

        if (!taskId || !sourceColumnId) return;

        // Calcular el índice de destino (al final de la columna)
        const destinationColumn = activeProject?.columns.find(
            (c) => c.id === destinationColumnId
        );
        if (!destinationColumn) return;

        const destinationIndex = destinationColumn.tasks.length;

        try {
            // Actualizar posición en la base de datos
            await clientDbService.updateTaskPosition(
                taskId,
                destinationColumnId,
                destinationIndex
            );

            // Actualizar estado local
            setProjects((prevProjects) =>
                prevProjects.map((project) => {
                    if (project.id !== activeProjectId) return project;

                    // Encontrar la tarea a mover
                    let taskToMove: Task | undefined;
                    const updatedColumns = project.columns.map((column) => {
                        if (column.id === sourceColumnId) {
                            const newTasks = [...column.tasks];
                            const [removed] = newTasks.splice(sourceIndex, 1);
                            taskToMove = removed;
                            return { ...column, tasks: newTasks };
                        }
                        return column;
                    });

                    // Si no encontramos la tarea, no hacer nada
                    if (!taskToMove) return project;

                    // Añadir la tarea a la columna de destino
                    return {
                        ...project,
                        columns: updatedColumns.map((column) => {
                            if (column.id === destinationColumnId) {
                                const newTasks = [...column.tasks];
                                newTasks.splice(
                                    destinationIndex,
                                    0,
                                    taskToMove!
                                );
                                return { ...column, tasks: newTasks };
                            }
                            return column;
                        }),
                    };
                })
            );
        } catch (error) {
            console.error("Error al actualizar posición de tarea:", error);
            toast.error("Error", {
                description:
                    "No se pudo mover la tarea. Por favor, intenta de nuevo.",
            });
        }
    };

    const handleTaskDragStart = (
        e: React.DragEvent,
        taskId: string,
        columnId: string,
        index: number
    ) => {
        e.dataTransfer.setData("taskId", taskId);
        e.dataTransfer.setData("sourceColumnId", columnId);
        e.dataTransfer.setData("sourceIndex", index.toString());
        e.dataTransfer.effectAllowed = "move";
    };

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
                            // Guardar el error en localStorage para el componente de advertencia
                            localStorage.setItem("rls_policy_error", "true");

                            toast.error("Error de política de seguridad", {
                                description:
                                    "Se detectó un problema en las políticas de seguridad. Consulta INSTRUCCIONES_SUPABASE.md para la solución.",
                                duration: 8000,
                            });
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

    // Manejar cierre de sesión
    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    // Funciones para gestionar proyectos
    const handleProjectSelect = (projectId: string) => {
        setActiveProjectId(projectId);
    };

    const handleProjectCreate = async (projectName: string) => {
        try {
            const newProject = await clientDbService.createProject(projectName);

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

            toast.success("Proyecto creado", {
                description: `El proyecto "${projectName}" ha sido creado exitosamente.`,
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

    // Función para agregar una nueva columna
    const addColumn = async () => {
        if (!activeProjectId || newColumnTitle.trim() === "") return;

        try {
            const position = activeProject?.columns.length || 0;
            const newColumn = await clientDbService.createColumn(
                activeProjectId,
                newColumnTitle,
                position
            );

            setProjects(
                projects.map((project) =>
                    project.id === activeProjectId
                        ? {
                              ...project,
                              columns: [
                                  ...project.columns,
                                  {
                                      id: newColumn.id,
                                      title: newColumn.title,
                                      tasks: [],
                                  },
                              ],
                          }
                        : project
                )
            );

            setNewColumnTitle("");

            toast.success("Columna creada", {
                description: `La columna "${newColumnTitle}" ha sido creada exitosamente.`,
            });
        } catch (error) {
            console.error("Error al crear columna:", error);
            toast.error("Error", {
                description:
                    "No se pudo crear la columna. Por favor, intenta de nuevo.",
            });
        }
    };

    // Función para eliminar una columna
    const deleteColumn = async (columnId: string) => {
        if (!activeProjectId) return;

        try {
            await clientDbService.deleteColumn(columnId);

            setProjects(
                projects.map((project) =>
                    project.id === activeProjectId
                        ? {
                              ...project,
                              columns: project.columns.filter(
                                  (column) => column.id !== columnId
                              ),
                          }
                        : project
                )
            );

            toast.success("Columna eliminada", {
                description: "La columna ha sido eliminada exitosamente.",
            });
        } catch (error) {
            console.error("Error al eliminar columna:", error);
            toast.error("Error", {
                description:
                    "No se pudo eliminar la columna. Por favor, intenta de nuevo.",
            });
        }
    };

    // Función para preparar la creación de una nueva tarea
    const prepareNewTask = (columnId: string) => {
        setNewTaskColumnId(columnId);
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskAssignedUsers([]);
    };

    // Función para agregar una nueva tarea
    const addTask = async () => {
        if (!activeProjectId || !newTaskColumnId || newTaskTitle.trim() === "")
            return;

        try {
            const column = activeProject?.columns.find(
                (c) => c.id === newTaskColumnId
            );
            if (!column) return;

            const position = column.tasks.length;
            const newTask = await clientDbService.createTask(
                newTaskColumnId,
                newTaskTitle,
                newTaskDescription || null,
                position
            );

            // Crear asignaciones de usuarios
            const assignedUsers = await Promise.all(
                newTaskAssignedUsers.map(async (user) => {
                    await clientDbService.assignUserToTask(newTask.id, user.id);
                    return user;
                })
            );

            setProjects(
                projects.map((project) =>
                    project.id === activeProjectId
                        ? {
                              ...project,
                              columns: project.columns.map((column) => {
                                  if (column.id === newTaskColumnId) {
                                      return {
                                          ...column,
                                          tasks: [
                                              ...column.tasks,
                                              {
                                                  id: newTask.id,
                                                  title: newTask.title,
                                                  description:
                                                      newTask.description ||
                                                      undefined,
                                                  assignedUsers,
                                              },
                                          ],
                                      };
                                  }
                                  return column;
                              }),
                          }
                        : project
                )
            );

            setNewTaskTitle("");
            setNewTaskDescription("");
            setNewTaskAssignedUsers([]);
            setNewTaskColumnId("");

            toast.success("Tarea creada", {
                description: `La tarea "${newTaskTitle}" ha sido creada exitosamente.`,
            });
        } catch (error) {
            console.error("Error al crear tarea:", error);
            toast.error("Error", {
                description:
                    "No se pudo crear la tarea. Por favor, intenta de nuevo.",
            });
        }
    };

    // Función para preparar la edición de una tarea
    const prepareEditTask = (task: Task, columnId: string) => {
        setEditingTask(task);
        setEditingColumnId(columnId);
        setNewTaskTitle(task.title);
        setNewTaskDescription(task.description || "");
        setNewTaskAssignedUsers([...task.assignedUsers]);
    };

    // Función para actualizar una tarea
    const updateTask = async () => {
        if (
            !activeProjectId ||
            !editingTask ||
            !editingColumnId ||
            newTaskTitle.trim() === ""
        )
            return;

        try {
            // Actualizar tarea
            await clientDbService.updateTask(
                editingTask.id,
                newTaskTitle,
                newTaskDescription || null
            );

            // Actualizar asignaciones
            // Primero, obtener asignaciones actuales
            const currentAssignments = await clientDbService.getTaskAssignments(
                editingTask.id
            );
            const currentUserIds = currentAssignments.map((a) => a.user_id);
            const newUserIds = newTaskAssignedUsers.map((u) => u.id);

            // Eliminar asignaciones que ya no existen
            for (const userId of currentUserIds) {
                if (!newUserIds.includes(userId)) {
                    await clientDbService.removeUserFromTask(
                        editingTask.id,
                        userId
                    );
                }
            }

            // Agregar nuevas asignaciones
            for (const userId of newUserIds) {
                if (!currentUserIds.includes(userId)) {
                    await clientDbService.assignUserToTask(
                        editingTask.id,
                        userId
                    );
                }
            }

            setProjects(
                projects.map((project) =>
                    project.id === activeProjectId
                        ? {
                              ...project,
                              columns: project.columns.map((column) => {
                                  if (column.id === editingColumnId) {
                                      return {
                                          ...column,
                                          tasks: column.tasks.map((task) => {
                                              if (task.id === editingTask.id) {
                                                  return {
                                                      ...task,
                                                      title: newTaskTitle,
                                                      description:
                                                          newTaskDescription,
                                                      assignedUsers:
                                                          newTaskAssignedUsers,
                                                  };
                                              }
                                              return task;
                                          }),
                                      };
                                  }
                                  return column;
                              }),
                          }
                        : project
                )
            );

            setEditingTask(null);
            setEditingColumnId("");

            toast.success("Tarea actualizada", {
                description: "La tarea ha sido actualizada exitosamente.",
            });
        } catch (error) {
            console.error("Error al actualizar tarea:", error);
            toast.error("Error", {
                description:
                    "No se pudo actualizar la tarea. Por favor, intenta de nuevo.",
            });
        }
    };

    // Función para eliminar una tarea
    const deleteTask = async (taskId: string, columnId: string) => {
        if (!activeProjectId) return;

        try {
            await clientDbService.deleteTask(taskId);

            setProjects(
                projects.map((project) =>
                    project.id === activeProjectId
                        ? {
                              ...project,
                              columns: project.columns.map((column) => {
                                  if (column.id === columnId) {
                                      return {
                                          ...column,
                                          tasks: column.tasks.filter(
                                              (task) => task.id !== taskId
                                          ),
                                      };
                                  }
                                  return column;
                              }),
                          }
                        : project
                )
            );

            toast.success("Tarea eliminada", {
                description: "La tarea ha sido eliminada exitosamente.",
            });
        } catch (error) {
            console.error("Error al eliminar tarea:", error);
            toast.error("Error", {
                description:
                    "No se pudo eliminar la tarea. Por favor, intenta de nuevo.",
            });
        }
    };

    // Función para asignar/desasignar un usuario a una tarea
    const toggleUserAssignment = (user: User) => {
        const isAssigned = newTaskAssignedUsers.some((u) => u.id === user.id);

        if (isAssigned) {
            setNewTaskAssignedUsers(
                newTaskAssignedUsers.filter((u) => u.id !== user.id)
            );
        } else {
            setNewTaskAssignedUsers([...newTaskAssignedUsers, user]);
        }
    };

    // Extraer proyectos para el sidebar
    const sidebarProjects: Project[] = projects.map((p) => ({
        id: p.id,
        name: p.name,
    }));

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando tablero...</p>
                </div>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <ProjectSidebar
                projects={sidebarProjects}
                activeProjectId={activeProjectId || ""}
                onProjectSelect={handleProjectSelect}
                onProjectCreate={handleProjectCreate}
                onProjectUpdate={handleProjectUpdate}
                onProjectDelete={handleProjectDelete}
                userEmail={user?.email || ""}
                onSignOut={handleSignOut}
            />

            <SidebarInset>
                <div className="container mx-auto p-4">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <SidebarTrigger className="mr-4" />
                            <h1 className="text-2xl font-bold">
                                {activeProject?.name || "Sin proyectos"}
                            </h1>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSignOut}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Cerrar sesión
                        </Button>
                    </div>{" "}
                    {activeProject ? (
                        <div
                            className="flex gap-4 overflow-x-auto pb-4"
                            ref={columnsParent}
                        >
                            {activeProject.columns.map((column) => (
                                <div
                                    key={column.id}
                                    className="flex-shrink-0 w-80"
                                >
                                    <div className="bg-muted rounded-lg shadow-sm">
                                        <div className="p-3 flex justify-between items-center border-b">
                                            <h2 className="font-semibold">
                                                {column.title}
                                            </h2>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            Acciones
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            deleteColumn(
                                                                column.id
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>
                                                            Eliminar columna
                                                        </span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div
                                            className="p-2 min-h-[200px]"
                                            onDragOver={(e) =>
                                                e.preventDefault()
                                            }
                                            onDrop={(e) =>
                                                handleTaskDrop(e, column.id)
                                            }
                                        >
                                            {column.tasks.map((task, index) => (
                                                <div
                                                    key={task.id}
                                                    draggable
                                                    onDragStart={(e) =>
                                                        handleTaskDragStart(
                                                            e,
                                                            task.id,
                                                            column.id,
                                                            index
                                                        )
                                                    }
                                                    className="mb-2"
                                                >
                                                    {" "}
                                                    <Card className="relative">
                                                        <div className="absolute left-2 top-3 cursor-grab touch-none">
                                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <CardHeader className="p-3 pb-0 pl-8">
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="font-medium">
                                                                    {task.title}
                                                                </h3>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                        >
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                            <span className="sr-only">
                                                                                Acciones
                                                                            </span>
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <Dialog>
                                                                            <DialogTrigger
                                                                                asChild
                                                                            >
                                                                                <DropdownMenuItem
                                                                                    onSelect={(
                                                                                        e
                                                                                    ) => {
                                                                                        e.preventDefault();
                                                                                        prepareEditTask(
                                                                                            task,
                                                                                            column.id
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                                    <span>
                                                                                        Editar
                                                                                        tarea
                                                                                    </span>
                                                                                </DropdownMenuItem>
                                                                            </DialogTrigger>
                                                                            <DialogContent>
                                                                                <DialogHeader>
                                                                                    <DialogTitle>
                                                                                        Editar
                                                                                        tarea
                                                                                    </DialogTitle>
                                                                                </DialogHeader>
                                                                                <div className="grid gap-4 py-4">
                                                                                    <div className="grid gap-2">
                                                                                        <Label htmlFor="edit-title">
                                                                                            Título
                                                                                        </Label>
                                                                                        <Input
                                                                                            id="edit-title"
                                                                                            value={
                                                                                                newTaskTitle
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) =>
                                                                                                setNewTaskTitle(
                                                                                                    e
                                                                                                        .target
                                                                                                        .value
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    </div>
                                                                                    <div className="grid gap-2">
                                                                                        <Label htmlFor="edit-description">
                                                                                            Descripción
                                                                                        </Label>
                                                                                        <Textarea
                                                                                            id="edit-description"
                                                                                            value={
                                                                                                newTaskDescription
                                                                                            }
                                                                                            onChange={(
                                                                                                e
                                                                                            ) =>
                                                                                                setNewTaskDescription(
                                                                                                    e
                                                                                                        .target
                                                                                                        .value
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    </div>
                                                                                    <div className="grid gap-2">
                                                                                        <Label>
                                                                                            Asignar
                                                                                            usuarios
                                                                                        </Label>
                                                                                        <div className="flex flex-wrap gap-2">
                                                                                            {users.map(
                                                                                                (
                                                                                                    user
                                                                                                ) => {
                                                                                                    const isAssigned =
                                                                                                        newTaskAssignedUsers.some(
                                                                                                            (
                                                                                                                u
                                                                                                            ) =>
                                                                                                                u.id ===
                                                                                                                user.id
                                                                                                        );
                                                                                                    return (
                                                                                                        <Button
                                                                                                            key={
                                                                                                                user.id
                                                                                                            }
                                                                                                            variant={
                                                                                                                isAssigned
                                                                                                                    ? "default"
                                                                                                                    : "outline"
                                                                                                            }
                                                                                                            size="sm"
                                                                                                            onClick={() =>
                                                                                                                toggleUserAssignment(
                                                                                                                    user
                                                                                                                )
                                                                                                            }
                                                                                                            className="flex items-center gap-2"
                                                                                                        >
                                                                                                            <Avatar className="h-6 w-6">
                                                                                                                <AvatarImage
                                                                                                                    src={
                                                                                                                        user.avatar ||
                                                                                                                        "/placeholder.svg"
                                                                                                                    }
                                                                                                                    alt={
                                                                                                                        user.name
                                                                                                                    }
                                                                                                                />
                                                                                                                <AvatarFallback>
                                                                                                                    {user.name.charAt(
                                                                                                                        0
                                                                                                                    )}
                                                                                                                </AvatarFallback>
                                                                                                            </Avatar>
                                                                                                            <span>
                                                                                                                {
                                                                                                                    user.name
                                                                                                                }
                                                                                                            </span>
                                                                                                            {isAssigned && (
                                                                                                                <X className="h-4 w-4" />
                                                                                                            )}
                                                                                                        </Button>
                                                                                                    );
                                                                                                }
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <DialogFooter>
                                                                                    <Button
                                                                                        onClick={
                                                                                            updateTask
                                                                                        }
                                                                                    >
                                                                                        Guardar
                                                                                        cambios
                                                                                    </Button>
                                                                                </DialogFooter>
                                                                            </DialogContent>
                                                                        </Dialog>
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                deleteTask(
                                                                                    task.id,
                                                                                    column.id
                                                                                )
                                                                            }
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                                            <span>
                                                                                Eliminar
                                                                                tarea
                                                                            </span>
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="p-3 pt-2">
                                                            {task.description && (
                                                                <p className="text-sm text-muted-foreground mb-2">
                                                                    {
                                                                        task.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </CardContent>
                                                        {task.assignedUsers
                                                            .length > 0 && (
                                                            <CardFooter className="p-3 pt-0 flex justify-between items-center">
                                                                <div className="flex -space-x-2">
                                                                    {task.assignedUsers.map(
                                                                        (
                                                                            user
                                                                        ) => (
                                                                            <Avatar
                                                                                key={
                                                                                    user.id
                                                                                }
                                                                                className="h-6 w-6 border-2 border-background"
                                                                            >
                                                                                <AvatarImage
                                                                                    src={
                                                                                        user.avatar ||
                                                                                        "/placeholder.svg"
                                                                                    }
                                                                                    alt={
                                                                                        user.name
                                                                                    }
                                                                                />
                                                                                <AvatarFallback>
                                                                                    {user.name.charAt(
                                                                                        0
                                                                                    )}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </CardFooter>
                                                        )}
                                                    </Card>
                                                </div>
                                            ))}

                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start text-muted-foreground mt-2"
                                                        onClick={() =>
                                                            prepareNewTask(
                                                                column.id
                                                            )
                                                        }
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Agregar tarea
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>
                                                            Nueva tarea
                                                        </DialogTitle>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="task-title">
                                                                Título
                                                            </Label>
                                                            <Input
                                                                id="task-title"
                                                                value={
                                                                    newTaskTitle
                                                                }
                                                                onChange={(e) =>
                                                                    setNewTaskTitle(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="task-description">
                                                                Descripción
                                                            </Label>
                                                            <Textarea
                                                                id="task-description"
                                                                value={
                                                                    newTaskDescription
                                                                }
                                                                onChange={(e) =>
                                                                    setNewTaskDescription(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label>
                                                                Asignar usuarios
                                                            </Label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {users.map(
                                                                    (user) => {
                                                                        const isAssigned =
                                                                            newTaskAssignedUsers.some(
                                                                                (
                                                                                    u
                                                                                ) =>
                                                                                    u.id ===
                                                                                    user.id
                                                                            );
                                                                        return (
                                                                            <Button
                                                                                key={
                                                                                    user.id
                                                                                }
                                                                                variant={
                                                                                    isAssigned
                                                                                        ? "default"
                                                                                        : "outline"
                                                                                }
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    toggleUserAssignment(
                                                                                        user
                                                                                    )
                                                                                }
                                                                                className="flex items-center gap-2"
                                                                            >
                                                                                <Avatar className="h-6 w-6">
                                                                                    <AvatarImage
                                                                                        src={
                                                                                            user.avatar ||
                                                                                            "/placeholder.svg"
                                                                                        }
                                                                                        alt={
                                                                                            user.name
                                                                                        }
                                                                                    />
                                                                                    <AvatarFallback>
                                                                                        {user.name.charAt(
                                                                                            0
                                                                                        )}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                                <span>
                                                                                    {
                                                                                        user.name
                                                                                    }
                                                                                </span>
                                                                                {isAssigned && (
                                                                                    <X className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                        );
                                                                    }
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button
                                                            onClick={addTask}
                                                        >
                                                            Crear tarea
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Agregar nueva columna */}
                            <div className="flex-shrink-0 w-80">
                                <div className="bg-muted rounded-lg shadow-sm p-3">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="Título de la columna"
                                            value={newColumnTitle}
                                            onChange={(e) =>
                                                setNewColumnTitle(
                                                    e.target.value
                                                )
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    addColumn();
                                                }
                                            }}
                                        />
                                        <Button onClick={addColumn} size="sm">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64">
                            <p className="text-muted-foreground mb-4">
                                No hay proyectos disponibles
                            </p>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Crear nuevo proyecto
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Nuevo proyecto
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="project-name">
                                                Nombre del proyecto
                                            </Label>
                                            <Input
                                                id="project-name"
                                                value={newColumnTitle}
                                                onChange={(e) =>
                                                    setNewColumnTitle(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Mi nuevo proyecto"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={() =>
                                                handleProjectCreate(
                                                    newColumnTitle
                                                )
                                            }
                                        >
                                            Crear proyecto
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
