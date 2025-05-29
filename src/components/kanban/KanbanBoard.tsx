import { NotoProject, User } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { KanbanColumn } from "./KanbanColumn";
import { useAutoAnimate } from "@formkit/auto-animate/react";

interface KanbanBoardProps {
    activeProject: NotoProject;
    users: User[];
    newColumnTitle: string;
    editingColumnTitle: string;
    newTaskTitle: string;
    newTaskDescription: string;
    newTaskAssignedUsers: User[];
    onSetNewColumnTitle: (title: string) => void;
    onAddColumn: () => void;
    onTaskDrop: (e: React.DragEvent, columnId: string) => void;
    onTaskDragStart: (
        e: React.DragEvent,
        taskId: string,
        columnId: string,
        index: number
    ) => void;
    onEditColumn: (column: any) => void;
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

export function KanbanBoard({
    activeProject,
    users,
    newColumnTitle,
    editingColumnTitle,
    newTaskTitle,
    newTaskDescription,
    newTaskAssignedUsers,
    onSetNewColumnTitle,
    onAddColumn,
    onTaskDrop,
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
}: KanbanBoardProps) {
    const [columnsParent] = useAutoAnimate();

    return (
        <div className="flex gap-4 overflow-x-auto pb-4" ref={columnsParent}>
            {activeProject.columns.map((column) => (
                <KanbanColumn
                    key={column.id}
                    column={column}
                    users={users}
                    editingColumnTitle={editingColumnTitle}
                    newTaskTitle={newTaskTitle}
                    newTaskDescription={newTaskDescription}
                    newTaskAssignedUsers={newTaskAssignedUsers}
                    onDrop={onTaskDrop}
                    onTaskDragStart={onTaskDragStart}
                    onEditColumn={onEditColumn}
                    onDeleteColumn={onDeleteColumn}
                    onUpdateColumnTitle={onUpdateColumnTitle}
                    onSetEditingColumnTitle={onSetEditingColumnTitle}
                    onPrepareNewTask={onPrepareNewTask}
                    onAddTask={onAddTask}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                    onUpdateTask={onUpdateTask}
                    onSetNewTaskTitle={onSetNewTaskTitle}
                    onSetNewTaskDescription={onSetNewTaskDescription}
                    onToggleUserAssignment={onToggleUserAssignment}
                />
            ))}

            {/* Agregar nueva columna */}
            <div className="flex-shrink-0 w-80">
                <div className="bg-muted rounded-lg shadow-sm p-3">
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Título de la columna"
                            value={newColumnTitle}
                            onChange={(e) =>
                                onSetNewColumnTitle(e.target.value)
                            }
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    onAddColumn();
                                }
                            }}
                        />
                        <Button onClick={onAddColumn} size="sm">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
