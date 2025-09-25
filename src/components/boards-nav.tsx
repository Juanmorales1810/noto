'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Board } from '@/types/board';

interface BoardsNavProps {
    boards: Board[];
    activeBoard?: string;
    onBoardSelect?: (boardId: string) => void;
    onBoardCreate?: () => void;
}

export function BoardsNav({ boards, activeBoard, onBoardSelect, onBoardCreate }: BoardsNavProps) {
    return (
        <SidebarGroup>
            <SidebarGroupLabel>
                Boards
                <SidebarMenuAction
                    className="ml-auto"
                    onClick={onBoardCreate}
                    title="Create new board">
                    <Plus className="h-4 w-4" />
                </SidebarMenuAction>
            </SidebarGroupLabel>
            <SidebarMenu>
                {boards.map((board) => (
                    <SidebarMenuItem key={board.id}>
                        <SidebarMenuButton
                            onClick={() => onBoardSelect?.(board.id)}
                            isActive={board.id === activeBoard}
                            className="flex h-auto flex-col items-start py-2">
                            <div className="flex w-full items-center gap-2">
                                <div
                                    className="h-2 w-2 flex-shrink-0 rounded-full"
                                    style={{ backgroundColor: board.color || '#6b7280' }}
                                />
                                <span className="truncate text-sm font-medium">{board.name}</span>
                            </div>
                            {board.description && (
                                <span className="text-muted-foreground mt-1 ml-4 line-clamp-2 text-xs">
                                    {board.description}
                                </span>
                            )}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
