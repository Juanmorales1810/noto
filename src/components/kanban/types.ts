// Tipos compartidos para el sistema Kanban
export type User = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
};

export type Task = {
    id: string;
    title: string;
    description?: string;
    assignedUsers: User[];
};

export type Column = {
    id: string;
    title: string;
    tasks: Task[];
};

export type NotoProject = {
    id: string;
    name: string;
    columns: Column[];
    user_role?: "owner" | "member";
};

export type Project = {
    id: string;
    name: string;
    user_role?: "owner" | "member";
};

export type TaskFormData = {
    title: string;
    description: string;
    assignedUsers: User[];
    columnId: string;
};

export type DragData = {
    taskId: string;
    sourceColumnId: string;
    sourceIndex: number;
};

export type TaskAssignment = {
    user_id: string;
};
