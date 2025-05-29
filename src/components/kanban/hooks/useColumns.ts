import { useState } from "react";
import { toast } from "sonner";
import { clientDbService } from "@/lib/supabase/db-service";
import { NotoProject } from "../types";

export function useColumns(
    activeProjectId: string | null,
    activeProject: NotoProject | null,
    projects: NotoProject[],
    setProjects: React.Dispatch<React.SetStateAction<NotoProject[]>>
) {
    const [newColumnTitle, setNewColumnTitle] = useState("");
    const [editingColumnTitle, setEditingColumnTitle] = useState("");
    const [editingColumnForTitle, setEditingColumnForTitle] = useState<
        string | null
    >(null);

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

    const prepareEditColumn = (column: any) => {
        setEditingColumnForTitle(column.id);
        setEditingColumnTitle(column.title);
    };

    const updateColumnTitle = async () => {
        if (
            !activeProjectId ||
            !editingColumnForTitle ||
            editingColumnTitle.trim() === ""
        )
            return;

        try {
            await clientDbService.updateColumn(
                editingColumnForTitle,
                editingColumnTitle
            );

            setProjects(
                projects.map((project) =>
                    project.id === activeProjectId
                        ? {
                              ...project,
                              columns: project.columns.map((column) => {
                                  if (column.id === editingColumnForTitle) {
                                      return {
                                          ...column,
                                          title: editingColumnTitle,
                                      };
                                  }
                                  return column;
                              }),
                          }
                        : project
                )
            );

            setEditingColumnForTitle(null);
            setEditingColumnTitle("");

            toast.success("Columna actualizada", {
                description:
                    "El título de la columna ha sido actualizado exitosamente.",
            });
        } catch (error) {
            console.error("Error al actualizar columna:", error);
            toast.error("Error", {
                description:
                    "No se pudo actualizar la columna. Por favor, intenta de nuevo.",
            });
        }
    };

    return {
        newColumnTitle,
        setNewColumnTitle,
        editingColumnTitle,
        setEditingColumnTitle,
        editingColumnForTitle,
        addColumn,
        deleteColumn,
        prepareEditColumn,
        updateColumnTitle,
    };
}
