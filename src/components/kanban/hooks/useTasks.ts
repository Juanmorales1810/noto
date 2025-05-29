import { useState } from "react";
import { toast } from "sonner";
import { clientDbService } from "@/lib/supabase/db-service";
import { NotoProject, User, Task } from "../types";

export function useTasks(
    activeProjectId: string | null,
    activeProject: NotoProject | null,
    projects: NotoProject[],
    setProjects: React.Dispatch<React.SetStateAction<NotoProject[]>>
) {
    // Estados para nueva tarea
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [newTaskColumnId, setNewTaskColumnId] = useState("");
    const [newTaskAssignedUsers, setNewTaskAssignedUsers] = useState<User[]>(
        []
    );

    // Estados para editar tarea
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editingColumnId, setEditingColumnId] = useState("");

    const prepareNewTask = (columnId: string) => {
        setNewTaskColumnId(columnId);
        setNewTaskTitle("");
        setNewTaskDescription("");
        setNewTaskAssignedUsers([]);
    };

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

    const prepareEditTask = (task: Task, columnId: string) => {
        setEditingTask(task);
        setEditingColumnId(columnId);
        setNewTaskTitle(task.title);
        setNewTaskDescription(task.description || "");
        setNewTaskAssignedUsers([...task.assignedUsers]);
    };

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

    return {
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
        prepareNewTask,
        addTask,
        prepareEditTask,
        updateTask,
        deleteTask,
        toggleUserAssignment,
    };
}
