'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KanbanColumn, KanbanColumnContent, KanbanColumnHandle } from '@/components/ui/kanban';
import { GripVertical, Plus } from 'lucide-react';
import { Task, COLUMN_TITLES } from '@/types/kanban';
import { TaskCard } from './task-card';

interface TaskColumnProps extends Omit<React.ComponentProps<typeof KanbanColumn>, 'children'> {
    tasks: Task[];
    isOverlay?: boolean;
    onAddTask?: () => void;
}

export function TaskColumn({ value, tasks, isOverlay, onAddTask, ...props }: TaskColumnProps) {
    return (
        <KanbanColumn
            value={value}
            {...props}
            className="bg-muted/30 flex max-h-[900px] min-h-[400px] w-full min-w-[280px] flex-col rounded-lg border p-3">
            {/* Header */}
            <div className="mb-3 flex shrink-0 items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-foreground text-sm font-semibold">
                        {COLUMN_TITLES[value]}
                    </span>
                    <Badge variant="outline" className="h-5 px-1.5 text-xs">
                        {tasks.length}
                    </Badge>
                </div>
                <KanbanColumnHandle asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-50 hover:opacity-100">
                        <GripVertical className="h-3 w-3" />
                    </Button>
                </KanbanColumnHandle>
            </div>

            {/* Content */}
            <KanbanColumnContent
                value={value}
                className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
                {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} asHandle={!isOverlay} />
                ))}

                {/* Add Task Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAddTask}
                    className="text-muted-foreground hover:text-foreground mt-1 h-8 justify-start border border-dashed">
                    <Plus className="mr-1.5 h-3 w-3" />
                    Add task
                </Button>
            </KanbanColumnContent>
        </KanbanColumn>
    );
}
