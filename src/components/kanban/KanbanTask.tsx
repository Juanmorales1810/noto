import { Task, User } from "./types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Edit, Trash2, X, GripVertical } from "lucide-react";

interface KanbanTaskProps {
    task: Task;
    columnId: string;
    index: number;
    users: User[];
    newTaskTitle: string;
    newTaskDescription: string;
    newTaskAssignedUsers: User[];
    onDragStart: (
        e: React.DragEvent,
        taskId: string,
        columnId: string,
        index: number
    ) => void;
    onEditTask: (task: Task, columnId: string) => void;
    onDeleteTask: (taskId: string, columnId: string) => void;
    onUpdateTask: () => void;
    onSetNewTaskTitle: (title: string) => void;
    onSetNewTaskDescription: (description: string) => void;
    onToggleUserAssignment: (user: User) => void;
}

export function KanbanTask({
    task,
    columnId,
    index,
    users,
    newTaskTitle,
    newTaskDescription,
    newTaskAssignedUsers,
    onDragStart,
    onEditTask,
    onDeleteTask,
    onUpdateTask,
    onSetNewTaskTitle,
    onSetNewTaskDescription,
    onToggleUserAssignment,
}: KanbanTaskProps) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id, columnId, index)}
            className="mb-2"
        >
            <Card className="relative flex-row justify-between items-center gap-2 py-2.5 px-1.5">
                <div className="cursor-grab touch-none">
                    <GripVertical className="size-6 text-muted-foreground" />
                </div>

                <div className="flex flex-1 justify-between items-start">
                    <h3 className="font-medium">{task.title}</h3>
                </div>
                <div className="flex flex-col gap-1.5 justify-center items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Acciones</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <DropdownMenuItem
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            onEditTask(task, columnId);
                                        }}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Editar tarea</span>
                                    </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Editar tarea</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-title">
                                                Título
                                            </Label>
                                            <Input
                                                id="edit-title"
                                                value={newTaskTitle}
                                                onChange={(e) =>
                                                    onSetNewTaskTitle(
                                                        e.target.value
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
                                                value={newTaskDescription}
                                                onChange={(e) =>
                                                    onSetNewTaskDescription(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Asignar usuarios</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {users.map((user) => {
                                                    const isAssigned =
                                                        newTaskAssignedUsers.some(
                                                            (u) =>
                                                                u.id === user.id
                                                        );
                                                    return (
                                                        <Button
                                                            key={user.id}
                                                            variant={
                                                                isAssigned
                                                                    ? "default"
                                                                    : "outline"
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                onToggleUserAssignment(
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
                                                                {user.name}
                                                            </span>
                                                            {isAssigned && (
                                                                <X className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={onUpdateTask}>
                                            Guardar cambios
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <DropdownMenuItem
                                onClick={() => onDeleteTask(task.id, columnId)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Eliminar tarea</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {task.assignedUsers.length > 0 && (
                        <div className="flex justify-end items-center">
                            <div className="flex -space-x-2">
                                {task.assignedUsers.map((user) => (
                                    <Avatar
                                        key={user.id}
                                        className="h-6 w-6 border-2 border-background"
                                    >
                                        <AvatarImage
                                            src={
                                                user.avatar ||
                                                "/placeholder.svg"
                                            }
                                            alt={user.name}
                                        />
                                        <AvatarFallback>
                                            {user.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {/* <CardContent className="p-3 pt-2">
                        {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                                {task.description}
                            </p>
                        )}
                    </CardContent> */}
            </Card>
        </div>
    );
}
