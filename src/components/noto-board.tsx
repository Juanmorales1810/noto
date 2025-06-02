"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, Plus } from "lucide-react";
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProjectSidebar } from "@/components/project-sidebar";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

// Hooks personalizados
import { useProjects } from "./kanban/hooks/useProjects";
import { useColumns } from "./kanban/hooks/useColumns";
import { useTasks } from "./kanban/hooks/useTasks";
import { useDragAndDrop } from "./kanban/hooks/useDragAndDrop";

// Componentes
import { KanbanBoard } from "./kanban/KanbanBoard";
import { Project } from "./kanban/types";

// Tipos
// import { Project } from "@/components/project-sidebar";

export default function NotoBoard() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    // Estado para nuevo proyecto
    const [newProjectName, setNewProjectName] = useState("");
    const [selectedUsersForProject, setSelectedUsersForProject] = useState<
        any[]
    >([]);

    // Hook para manejar proyectos (ahora pasa el user como parámetro)
    const {
        projects,
        setProjects,
        activeProject,
        users,
        isLoading,
        handleProjectCreate,
        handleProjectUpdate,
        handleProjectDelete,
        handleProjectSelect,
    } = useProjects(user); // Hooks para manejar columnas y tareas cuando hay un proyecto activo
    const {
        newColumnTitle,
        setNewColumnTitle,
        editingColumnTitle,
        setEditingColumnTitle,
        editingColumnForTitle,
        addColumn,
        updateColumnTitle,
        deleteColumn,
        prepareEditColumn,
    } = useColumns(
        activeProject?.id || "",
        activeProject || null,
        projects,
        setProjects
    );
    const {
        newTaskTitle,
        setNewTaskTitle,
        newTaskDescription,
        setNewTaskDescription,
        newTaskColumnId,
        setNewTaskColumnId,
        newTaskAssignedUsers,
        setNewTaskAssignedUsers,
        editingTask,
        editingColumnId,
        addTask,
        updateTask,
        deleteTask,
        prepareEditTask,
        toggleUserAssignment,
        prepareNewTask,
    } = useTasks(
        activeProject?.id || "",
        activeProject || null,
        projects,
        setProjects
    );
    const { handleTaskDrop, handleTaskDragStart } = useDragAndDrop(
        activeProject || null,
        activeProject?.id || "",
        setProjects
    );

    // Función para cerrar sesión
    const handleSignOut = async () => {
        try {
            await signOut();
            router.push("/login");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    }; // Función para crear nuevo proyecto
    const createNewProject = async () => {
        if (!newProjectName.trim()) return;

        try {
            const memberUserIds = selectedUsersForProject.map(
                (user) => user.id
            );
            await handleProjectCreate(newProjectName.trim(), memberUserIds);
            setNewProjectName("");
            setSelectedUsersForProject([]);
        } catch (error) {
            console.error("Error al crear proyecto:", error);
        }
    };

    const toggleUserForProject = (user: any) => {
        setSelectedUsersForProject((prev) => {
            const isSelected = prev.some((u) => u.id === user.id);
            if (isSelected) {
                return prev.filter((u) => u.id !== user.id);
            } else {
                return [...prev, user];
            }
        });
    }; // Preparar proyectos para la sidebar
    const sidebarProjects: Project[] = projects.map((p) => ({
        id: p.id,
        name: p.name,
        user_role: p.user_role,
    }));

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <ProjectSidebar
                projects={sidebarProjects}
                activeProjectId={activeProject?.id || ""}
                userEmail={user?.email || ""}
                users={users}
                onProjectSelect={handleProjectSelect}
                onProjectCreate={handleProjectCreate}
                onProjectUpdate={handleProjectUpdate}
                onProjectDelete={handleProjectDelete}
                onSignOut={handleSignOut}
            />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <div className="flex flex-1 items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <h1 className="text-lg font-semibold">
                                {activeProject?.name || "Noto"}
                            </h1>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Nuevo Proyecto
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Crear Nuevo Proyecto
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="project-name">
                                                Nombre del Proyecto
                                            </Label>
                                            <Input
                                                id="project-name"
                                                value={newProjectName}
                                                onChange={(e) =>
                                                    setNewProjectName(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Ingresa el nombre del proyecto"
                                            />
                                        </div>
                                        <div>
                                            <Label>
                                                Agregar miembros al proyecto
                                                (opcional)
                                            </Label>
                                            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2 mt-2">
                                                {users.length > 0 ? (
                                                    users.map((user) => {
                                                        const isSelected =
                                                            selectedUsersForProject.some(
                                                                (u) =>
                                                                    u.id ===
                                                                    user.id
                                                            );
                                                        return (
                                                            <div
                                                                key={user.id}
                                                                className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50 ${
                                                                    isSelected
                                                                        ? "bg-muted"
                                                                        : ""
                                                                }`}
                                                                onClick={() =>
                                                                    toggleUserForProject(
                                                                        user
                                                                    )
                                                                }
                                                            >
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback className="text-xs">
                                                                        {user.name
                                                                            .charAt(
                                                                                0
                                                                            )
                                                                            .toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 text-sm">
                                                                    <div className="font-medium">
                                                                        {
                                                                            user.name
                                                                        }
                                                                    </div>
                                                                    <div className="text-muted-foreground text-xs">
                                                                        {
                                                                            user.email
                                                                        }
                                                                    </div>
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                                                        <div className="h-2 w-2 rounded-full bg-white"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="text-sm text-muted-foreground text-center py-4">
                                                        No hay usuarios
                                                        disponibles
                                                    </div>
                                                )}
                                            </div>
                                            {selectedUsersForProject.length >
                                                0 && (
                                                <div className="text-sm text-muted-foreground mt-2">
                                                    {
                                                        selectedUsersForProject.length
                                                    }{" "}
                                                    usuario
                                                    {selectedUsersForProject.length ===
                                                    1
                                                        ? ""
                                                        : "s"}{" "}
                                                    seleccionado
                                                    {selectedUsersForProject.length ===
                                                    1
                                                        ? ""
                                                        : "s"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={createNewProject}
                                            disabled={!newProjectName.trim()}
                                        >
                                            Crear Proyecto
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSignOut}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Cerrar Sesión
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 space-y-4 p-6">
                    {activeProject ? (
                        <KanbanBoard
                            activeProject={activeProject}
                            users={users}
                            newColumnTitle={newColumnTitle}
                            editingColumnTitle={editingColumnTitle}
                            newTaskTitle={newTaskTitle}
                            newTaskDescription={newTaskDescription}
                            newTaskAssignedUsers={newTaskAssignedUsers}
                            onSetNewColumnTitle={setNewColumnTitle}
                            onAddColumn={addColumn}
                            onTaskDrop={handleTaskDrop}
                            onTaskDragStart={handleTaskDragStart}
                            onEditColumn={prepareEditColumn}
                            onDeleteColumn={deleteColumn}
                            onUpdateColumnTitle={updateColumnTitle}
                            onSetEditingColumnTitle={setEditingColumnTitle}
                            onPrepareNewTask={prepareNewTask}
                            onAddTask={addTask}
                            onEditTask={prepareEditTask}
                            onDeleteTask={deleteTask}
                            onUpdateTask={updateTask}
                            onSetNewTaskTitle={setNewTaskTitle}
                            onSetNewTaskDescription={setNewTaskDescription}
                            onToggleUserAssignment={toggleUserAssignment}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-96 space-y-4">
                            <h3 className="text-lg font-medium text-muted-foreground">
                                No hay proyectos
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Crea tu primer proyecto para comenzar
                            </p>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Crear Proyecto
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Crear Nuevo Proyecto
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="new-project-name">
                                                Nombre del Proyecto
                                            </Label>
                                            <Input
                                                id="new-project-name"
                                                value={newProjectName}
                                                onChange={(e) =>
                                                    setNewProjectName(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Ingresa el nombre del proyecto"
                                            />
                                        </div>
                                        <div>
                                            <Label>
                                                Agregar miembros al proyecto
                                                (opcional)
                                            </Label>
                                            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2 mt-2">
                                                {users.length > 0 ? (
                                                    users.map((user) => {
                                                        const isSelected =
                                                            selectedUsersForProject.some(
                                                                (u) =>
                                                                    u.id ===
                                                                    user.id
                                                            );
                                                        return (
                                                            <div
                                                                key={user.id}
                                                                className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50 ${
                                                                    isSelected
                                                                        ? "bg-muted"
                                                                        : ""
                                                                }`}
                                                                onClick={() =>
                                                                    toggleUserForProject(
                                                                        user
                                                                    )
                                                                }
                                                            >
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback className="text-xs">
                                                                        {user.name
                                                                            .charAt(
                                                                                0
                                                                            )
                                                                            .toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 text-sm">
                                                                    <div className="font-medium">
                                                                        {
                                                                            user.name
                                                                        }
                                                                    </div>
                                                                    <div className="text-muted-foreground text-xs">
                                                                        {
                                                                            user.email
                                                                        }
                                                                    </div>
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                                                                        <div className="h-2 w-2 rounded-full bg-white"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="text-sm text-muted-foreground text-center py-4">
                                                        No hay usuarios
                                                        disponibles
                                                    </div>
                                                )}
                                            </div>
                                            {selectedUsersForProject.length >
                                                0 && (
                                                <div className="text-sm text-muted-foreground mt-2">
                                                    {
                                                        selectedUsersForProject.length
                                                    }{" "}
                                                    usuario
                                                    {selectedUsersForProject.length ===
                                                    1
                                                        ? ""
                                                        : "s"}{" "}
                                                    seleccionado
                                                    {selectedUsersForProject.length ===
                                                    1
                                                        ? ""
                                                        : "s"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={createNewProject}
                                            disabled={!newProjectName.trim()}
                                        >
                                            Crear Proyecto
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
