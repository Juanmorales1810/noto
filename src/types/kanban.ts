export interface Task {
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    description?: string;
    assignee?: string;
    assigneeAvatar?: string;
    dueDate?: string;
}

export interface Column {
    id: string;
    title: string;
    tasks: Task[];
}

export interface KanbanData {
    columns: Record<string, Task[]>;
}

export const COLUMN_TITLES: Record<string, string> = {
    backlog: 'Backlog',
    inProgress: 'In Progress',
    review: 'Review',
    done: 'Done',
};

export const PRIORITY_COLORS: Record<Task['priority'], string> = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
};
