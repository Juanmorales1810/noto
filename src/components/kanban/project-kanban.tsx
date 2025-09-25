'use client';

import * as React from 'react';
import { Kanban, KanbanBoard, KanbanOverlay } from '@/components/ui/kanban';
import { Task } from '@/types/kanban';
import { TaskColumn } from './task-column';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useSidebar } from '../ui/sidebar';
import { cn } from '@/lib/utils';

interface ProjectKanbanProps {
    columns: Record<string, Task[]>;
    onColumnsChange: (columns: Record<string, Task[]>) => void;
    onTaskAdd?: (columnId: string) => void;
    onColumnAdd?: () => void;
    onTaskMove?: (taskId: string, fromColumn: string, toColumn: string) => void;
    className?: string;
}

export function ProjectKanban({
    columns,
    onColumnsChange,
    onTaskAdd,
    onColumnAdd,
    onTaskMove,
    className,
}: ProjectKanbanProps) {
    const handleAddTask = React.useCallback(
        (columnId: string) => {
            onTaskAdd?.(columnId);
        },
        [onTaskAdd]
    );

    const { open } = useSidebar();

    return (
        <div
            className={cn(
                className,
                !open && 'max-w-full overflow-x-auto',
                open && 'max-w-[1660px] overflow-x-scroll'
            )}>
            <Kanban
                value={columns}
                onValueChange={onColumnsChange}
                getItemValue={(item) => item.id}>
                <KanbanBoard className="flex gap-3">
                    {Object.entries(columns).map(([columnValue, tasks]) => (
                        <TaskColumn
                            key={columnValue}
                            value={columnValue}
                            tasks={tasks}
                            onAddTask={() => handleAddTask(columnValue)}
                        />
                    ))}

                    {/* Add Column Button */}
                    {onColumnAdd && (
                        <div className="flex min-h-[400px] w-full max-w-[280px] items-center justify-center">
                            <Button
                                variant="outline"
                                onClick={onColumnAdd}
                                className="border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/30 h-12 w-full border-2 border-dashed">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Column
                            </Button>
                        </div>
                    )}
                </KanbanBoard>

                <KanbanOverlay>
                    {({ value, variant }) => (
                        <div className="bg-background/80 border-primary/50 flex size-full items-center justify-center rounded-lg border-2 border-dashed backdrop-blur-sm">
                            <span className="text-primary text-sm font-medium">
                                Moving {variant}: {value}
                            </span>
                        </div>
                    )}
                </KanbanOverlay>
            </Kanban>
        </div>
    );
}
