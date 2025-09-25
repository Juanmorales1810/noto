'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { KanbanItem, KanbanItemHandle } from '@/components/ui/kanban';
import { Task, PRIORITY_COLORS } from '@/types/kanban';

interface TaskCardProps
    extends Omit<React.ComponentProps<typeof KanbanItem>, 'value' | 'children'> {
    task: Task;
    asHandle?: boolean;
}

export function TaskCard({ task, asHandle, ...props }: TaskCardProps) {
    const cardContent = (
        <div className="bg-card rounded-md border p-2.5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm leading-tight font-medium">
                        {task.title}
                    </span>
                    <Badge
                        variant={PRIORITY_COLORS[task.priority] as any}
                        className="h-4 shrink-0 rounded px-1.5 text-[10px] capitalize">
                        {task.priority}
                    </Badge>
                </div>

                {task.description && (
                    <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                        {task.description}
                    </p>
                )}

                <div className="text-muted-foreground flex items-center justify-between text-xs">
                    {task.assignee && (
                        <div className="flex items-center gap-1.5">
                            <Avatar className="size-4">
                                <AvatarImage src={task.assigneeAvatar} />
                                <AvatarFallback className="text-[8px]">
                                    {task.assignee.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="line-clamp-1 text-[10px]">{task.assignee}</span>
                        </div>
                    )}
                    {task.dueDate && (
                        <time className="text-[10px] font-medium">{task.dueDate}</time>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <KanbanItem value={task.id} {...props}>
            {asHandle ? <KanbanItemHandle>{cardContent}</KanbanItemHandle> : cardContent}
        </KanbanItem>
    );
}
