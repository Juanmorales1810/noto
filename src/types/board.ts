export interface Board {
    id: string;
    name: string;
    description?: string;
    color?: string;
    isActive?: boolean;
    createdAt: string;
    updatedAt: string;
    taskCount: number;
    memberCount: number;
}

export interface BoardSummary {
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    overdueTasks: number;
}
