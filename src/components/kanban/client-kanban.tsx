'use client';

import dynamic from 'next/dynamic';
import { Task } from '@/types/kanban';

// Loading skeleton component
function KanbanSkeleton({
    columns = {},
    onColumnAdd,
}: {
    columns?: Record<string, Task[]>;
    onColumnAdd?: () => void;
}) {
    // Use sample structure if columns is not available
    const skeletonColumns =
        Object.keys(columns).length > 0
            ? columns
            : {
                  backlog: [],
                  inProgress: [],
                  review: [],
                  done: [],
              };

    return (
        <div className="grid auto-rows-fr grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(skeletonColumns).map(([columnValue, tasks]) => (
                <div
                    key={columnValue}
                    className="bg-muted/30 min-h-[400px] animate-pulse rounded-lg border p-3">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="bg-muted-foreground/20 h-4 w-20 rounded"></div>
                            <div className="bg-muted-foreground/20 h-5 w-6 rounded"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {Array.from({ length: Math.min(3, tasks.length || 2) }).map((_, index) => (
                            <div key={index} className="bg-card h-16 rounded-md border p-2.5"></div>
                        ))}
                    </div>
                </div>
            ))}
            {onColumnAdd && (
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="border-muted-foreground/25 bg-muted/30 h-12 w-full max-w-[280px] animate-pulse rounded border-2 border-dashed"></div>
                </div>
            )}
        </div>
    );
}

interface ProjectKanbanProps {
    columns: Record<string, Task[]>;
    onColumnsChange: (columns: Record<string, Task[]>) => void;
    onTaskAdd?: (columnId: string) => void;
    onColumnAdd?: () => void;
    onTaskMove?: (taskId: string, fromColumn: string, toColumn: string) => void;
    className?: string;
}

// Dynamic import without loading component passing props
const DynamicProjectKanban = dynamic(
    () => import('./project-kanban').then((mod) => ({ default: mod.ProjectKanban })),
    {
        ssr: false,
        loading: () => <KanbanSkeleton />,
    }
);

// Wrapper component to handle loading state properly
export function ProjectKanban(props: ProjectKanbanProps) {
    return <DynamicProjectKanban {...props} />;
}
