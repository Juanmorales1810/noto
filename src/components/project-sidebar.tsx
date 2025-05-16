"use client";

import { useState } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenuAction,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Plus,
    MoreHorizontal,
    Edit,
    Trash2,
    Settings,
    LogOut,
    StickyNote,
} from "lucide-react";

export type Project = {
    id: string;
    name: string;
};

type ProjectSidebarProps = {
    projects: Project[];
    activeProjectId: string;
    userEmail: string;
    onProjectSelect: (projectId: string) => void;
    onProjectCreate: (projectName: string) => void;
    onProjectUpdate: (projectId: string, projectName: string) => void;
    onProjectDelete: (projectId: string) => void;
    onSignOut: () => void;
};

export function ProjectSidebar({
    projects,
    activeProjectId,
    userEmail,
    onProjectSelect,
    onProjectCreate,
    onProjectUpdate,
    onProjectDelete,
    onSignOut,
}: ProjectSidebarProps) {
    const [newProjectName, setNewProjectName] = useState("");
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            onProjectCreate(newProjectName);
            setNewProjectName("");
        }
    };

    const handleUpdateProject = () => {
        if (editingProject && newProjectName.trim()) {
            onProjectUpdate(editingProject.id, newProjectName);
            setEditingProject(null);
            setNewProjectName("");
        }
    };

    const prepareEditProject = (project: Project) => {
        setEditingProject(project);
        setNewProjectName(project.name);
    };

    // Obtener las iniciales del correo electrónico
    const getInitials = (email: string) => {
        if (!email) return "U";
        const parts = email.split("@");
        return parts[0].charAt(0).toUpperCase();
    };

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-4 py-2">
                    <StickyNote className="size-5" />
                    <h1 className="text-xl font-bold">Noto App</h1>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <div className="flex items-center justify-between px-4 py-2">
                        <SidebarGroupLabel>Proyectos</SidebarGroupLabel>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="sr-only">
                                        Nuevo proyecto
                                    </span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nuevo proyecto</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="project-name">
                                            Nombre del proyecto
                                        </Label>
                                        <Input
                                            id="project-name"
                                            value={newProjectName}
                                            onChange={(e) =>
                                                setNewProjectName(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Mi nuevo proyecto"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateProject}>
                                        Crear proyecto
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <SidebarGroupContent>
                        <SidebarMenu>
                            {projects.map((project) => (
                                <SidebarMenuItem key={project.id}>
                                    <SidebarMenuButton
                                        isActive={
                                            project.id === activeProjectId
                                        }
                                        onClick={() =>
                                            onProjectSelect(project.id)
                                        }
                                    >
                                        <span>{project.name}</span>
                                    </SidebarMenuButton>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <SidebarMenuAction>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </SidebarMenuAction>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <DropdownMenuItem
                                                        onSelect={(e) => {
                                                            e.preventDefault();
                                                            prepareEditProject(
                                                                project
                                                            );
                                                        }}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>
                                                            Editar proyecto
                                                        </span>
                                                    </DropdownMenuItem>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>
                                                            Editar proyecto
                                                        </DialogTitle>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="edit-project-name">
                                                                Nombre del
                                                                proyecto
                                                            </Label>
                                                            <Input
                                                                id="edit-project-name"
                                                                value={
                                                                    newProjectName
                                                                }
                                                                onChange={(e) =>
                                                                    setNewProjectName(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button
                                                            onClick={
                                                                handleUpdateProject
                                                            }
                                                        >
                                                            Guardar cambios
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                            <DropdownMenuItem
                                                onSelect={() =>
                                                    onProjectDelete(project.id)
                                                }
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Eliminar proyecto</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton>
                            <Avatar className="h-6 w-6 mr-2">
                                <AvatarFallback>
                                    {getInitials(userEmail)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{userEmail}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton>
                            <Settings className="h-4 w-4 mr-2" />
                            <span>Configuración</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={onSignOut}>
                            <LogOut className="h-4 w-4 mr-2" />
                            <span>Cerrar sesión</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
