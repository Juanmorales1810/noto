import { Column, User } from "./types";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Edit, Trash2, Plus, X } from "lucide-react";
import { KanbanTask } from "./KanbanTask";
import DescriptionTiptap from "../description-tiptap";

interface KanbanColumnProps {
    column: Column;
    users: User[];
    editingColumnTitle: string;
    newTaskTitle: string;
    newTaskDescription: string;
    newTaskAssignedUsers: User[];
    onDrop: (e: React.DragEvent, columnId: string) => void;
    onTaskDragStart: (
        e: React.DragEvent,
        taskId: string,
        columnId: string,
        index: number
    ) => void;
    onEditColumn: (column: Column) => void;
    onDeleteColumn: (columnId: string) => void;
    onUpdateColumnTitle: () => void;
    onSetEditingColumnTitle: (title: string) => void;
    onPrepareNewTask: (columnId: string) => void;
    onAddTask: () => void;
    onEditTask: (task: any, columnId: string) => void;
    onDeleteTask: (taskId: string, columnId: string) => void;
    onUpdateTask: () => void;
    onSetNewTaskTitle: (title: string) => void;
    onSetNewTaskDescription: (description: string) => void;
    onToggleUserAssignment: (user: User) => void;
}

export function KanbanColumn({
    column,
    users,
    editingColumnTitle,
    newTaskTitle,
    newTaskDescription,
    newTaskAssignedUsers,
    onDrop,
    onTaskDragStart,
    onEditColumn,
    onDeleteColumn,
    onUpdateColumnTitle,
    onSetEditingColumnTitle,
    onPrepareNewTask,
    onAddTask,
    onEditTask,
    onDeleteTask,
    onUpdateTask,
    onSetNewTaskTitle,
    onSetNewTaskDescription,
    onToggleUserAssignment,
}: KanbanColumnProps) {
    return (
        <div className="flex-shrink-0 w-80">
            <div className="bg-muted rounded-lg shadow-sm">
                <div className="p-3 flex justify-between items-center border-b">
                    <h2 className="font-semibold">{column.title}</h2>
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
                                            onEditColumn(column);
                                        }}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Editar columna</span>
                                    </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Editar columna
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="column-title">
                                                Título de la columna
                                            </Label>
                                            <Input
                                                id="column-title"
                                                value={editingColumnTitle}
                                                onChange={(e) =>
                                                    onSetEditingColumnTitle(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={onUpdateColumnTitle}>
                                            Guardar cambios
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <DropdownMenuItem
                                onClick={() => onDeleteColumn(column.id)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Eliminar columna</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div
                    className="p-2 min-h-[200px]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDrop(e, column.id)}
                >
                    {column.tasks.map((task, index) => (
                        <KanbanTask
                            key={task.id}
                            task={task}
                            columnId={column.id}
                            index={index}
                            users={users}
                            newTaskTitle={newTaskTitle}
                            newTaskDescription={newTaskDescription}
                            newTaskAssignedUsers={newTaskAssignedUsers}
                            onDragStart={onTaskDragStart}
                            onEditTask={onEditTask}
                            onDeleteTask={onDeleteTask}
                            onUpdateTask={onUpdateTask}
                            onSetNewTaskTitle={onSetNewTaskTitle}
                            onSetNewTaskDescription={onSetNewTaskDescription}
                            onToggleUserAssignment={onToggleUserAssignment}
                        />
                    ))}

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-muted-foreground mt-2"
                                onClick={() => onPrepareNewTask(column.id)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar tarea
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Nueva tarea</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="task-title">Título</Label>
                                    <Input
                                        id="task-title"
                                        value={newTaskTitle}
                                        onChange={(e) =>
                                            onSetNewTaskTitle(e.target.value)
                                        }
                                    />
                                </div>{" "}
                                <div className="grid gap-2">
                                    <Label htmlFor="task-description">
                                        Descripción
                                    </Label>
                                    <DescriptionTiptap
                                        value={newTaskDescription}
                                        onChange={onSetNewTaskDescription}
                                        placeholder="Describe la tarea..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Asignar usuarios</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {users.map((user) => {
                                            const isAssigned =
                                                newTaskAssignedUsers.some(
                                                    (u) => u.id === user.id
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
                                                            alt={user.name}
                                                        />
                                                        <AvatarFallback>
                                                            {user.name.charAt(
                                                                0
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>{user.name}</span>
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
                                <Button onClick={onAddTask}>Crear tarea</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
