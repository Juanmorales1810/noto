import { toast } from "sonner";
import { clientDbService } from "@/lib/supabase/db-service";
import { NotoProject, User } from "../types";

export function useDragAndDrop(
    activeProject: NotoProject | null,
    activeProjectId: string | null,
    setProjects: React.Dispatch<React.SetStateAction<NotoProject[]>>
) {
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
                    let taskToMove: any;
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

    return {
        handleTaskDrop,
        handleTaskDragStart,
    };
}
