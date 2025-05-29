"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { ModeToggle } from "./toggle-mode";

export type Project = {
    id: string;
    name: string;
};

type ProjectSidebarProps = {
    projects: Project[];
    activeProjectId: string;
    userEmail: string;
    users: User[];
    onProjectSelect: (projectId: string) => void;
    onProjectCreate: (projectName: string, memberUserIds?: string[]) => void;
    onProjectUpdate: (projectId: string, projectName: string) => void;
    onProjectDelete: (projectId: string) => void;
    onSignOut: () => void;
};

export type User = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
};

export function ProjectSidebar({
    projects,
    activeProjectId,
    userEmail,
    users,
    onProjectSelect,
    onProjectCreate,
    onProjectUpdate,
    onProjectDelete,
    onSignOut,
}: ProjectSidebarProps) {
    const [newProjectName, setNewProjectName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [userName, setUserName] = useState("");
    const [userAvatar, setUserAvatar] = useState("");
    const [theme, setTheme] = useState("light");
    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            const memberUserIds = selectedUsers.map((user) => user.id);
            onProjectCreate(newProjectName, memberUserIds);
            setNewProjectName("");
            setSelectedUsers([]);
        }
    };

    const toggleUserSelection = (user: User) => {
        setSelectedUsers((prev) => {
            const isSelected = prev.some((u) => u.id === user.id);
            if (isSelected) {
                return prev.filter((u) => u.id !== user.id);
            } else {
                return [...prev, user];
            }
        });
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

    // Abrir modal de configuración
    const openConfigModal = () => {
        // Aquí podrías cargar los datos actuales del usuario desde la base de datos
        // Por ahora, inicializamos con valores por defecto
        setUserName(userEmail.split("@")[0]);
        setUserAvatar("");
        setTheme("light");
        setShowConfigModal(true);
    }; // Guardar configuración del usuario
    const saveUserConfig = async () => {
        try {
            // Aquí implementarías la lógica para guardar los cambios en la base de datos
            // Por ejemplo:
            // await userService.updateUserProfile(userId, { name: userName, avatar_url: userAvatar });

            // Por ahora, simplemente cerramos el modal
            setShowConfigModal(false);

            // Mostrar mensaje de éxito
            toast.success("Configuración guardada", {
                description:
                    "Tus preferencias de usuario se han guardado correctamente.",
            });
        } catch (error) {
            console.error("Error al guardar la configuración:", error);
            toast.error("Error", {
                description:
                    "No se pudo guardar la configuración. Por favor, intenta de nuevo.",
            });
        }
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
                            </DialogTrigger>{" "}
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
                                    <div className="grid gap-2">
                                        <Label>
                                            Agregar miembros al proyecto
                                            (opcional)
                                        </Label>
                                        <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                                            {users.length > 0 ? (
                                                users.map((user) => {
                                                    const isSelected =
                                                        selectedUsers.some(
                                                            (u) =>
                                                                u.id === user.id
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
                                                                toggleUserSelection(
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
                                                                    {user.name}
                                                                </div>
                                                                <div className="text-muted-foreground text-xs">
                                                                    {user.email}
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
                                                    No hay usuarios disponibles
                                                </div>
                                            )}
                                        </div>
                                        {selectedUsers.length > 0 && (
                                            <div className="text-sm text-muted-foreground">
                                                {selectedUsers.length} usuario
                                                {selectedUsers.length === 1
                                                    ? ""
                                                    : "s"}{" "}
                                                seleccionado
                                                {selectedUsers.length === 1
                                                    ? ""
                                                    : "s"}
                                            </div>
                                        )}
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
                        <SidebarMenuButton onClick={openConfigModal}>
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

            {/* Modal de configuración */}
            <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configuración de usuario</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="user-name">Nombre</Label>
                            <Input
                                id="user-name"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                            />
                        </div>{" "}
                        <div className="grid gap-2">
                            <Label htmlFor="user-avatar">Avatar URL</Label>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback>
                                        {getInitials(userName || userEmail)}
                                    </AvatarFallback>
                                </Avatar>
                                <Input
                                    id="user-avatar"
                                    value={userAvatar}
                                    onChange={(e) =>
                                        setUserAvatar(e.target.value)
                                    }
                                    placeholder="URL de tu avatar (opcional)"
                                />
                            </div>
                        </div>{" "}
                        <div className="grid gap-2">
                            <Label htmlFor="theme">Tema</Label>
                            <ModeToggle />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={saveUserConfig}>
                            Guardar cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Sidebar>
    );
}
