'use client';

import * as React from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ProjectKanban } from '@/components/kanban';
import { NewTaskDialog, NewColumnDialog, NewBoardDialog } from '@/components/dialogs';
import { Plus, Filter, Search, Columns } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { sampleTasks } from '@/data/sample-tasks';
import { userBoards } from '@/data/user-boards';
import { Task, COLUMN_TITLES } from '@/types/kanban';
import { Board } from '@/types/board';

export const iframeHeight = '800px';
export const description = 'A Kanban board with sidebar and header.';

export default function Page() {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [boards, setBoards] = React.useState<Board[]>(userBoards);
    const [activeBoard, setActiveBoard] = React.useState<string>('main-project');
    const [columns, setColumns] = React.useState<Record<string, Task[]>>(sampleTasks);
    const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);
    const [isColumnDialogOpen, setIsColumnDialogOpen] = React.useState(false);
    const [isBoardDialogOpen, setIsBoardDialogOpen] = React.useState(false);
    const [selectedColumnId, setSelectedColumnId] = React.useState<string>('');

    // Get current board
    const currentBoard = React.useMemo(
        () => boards.find((board) => board.id === activeBoard),
        [boards, activeBoard]
    );

    // Generate unique ID for new tasks
    const generateTaskId = React.useCallback(() => {
        const allTasks = Object.values(columns).flat();
        const maxId = Math.max(0, ...allTasks.map((task) => parseInt(task.id) || 0));
        return (maxId + 1).toString();
    }, [columns]);

    const handleTaskAdd = React.useCallback((columnId: string) => {
        setSelectedColumnId(columnId);
        setIsTaskDialogOpen(true);
    }, []);

    const handleTaskCreate = React.useCallback(
        (taskData: Omit<Task, 'id'>, columnId: string) => {
            const newTask: Task = {
                ...taskData,
                id: generateTaskId(),
            };

            setColumns((prev) => ({
                ...prev,
                [columnId]: [...(prev[columnId] || []), newTask],
            }));
        },
        [generateTaskId]
    );

    const handleColumnAdd = React.useCallback(() => {
        setIsColumnDialogOpen(true);
    }, []);

    const handleColumnCreate = React.useCallback(
        (columnData: { id: string; title: string; description?: string }) => {
            // Update COLUMN_TITLES dynamically
            (COLUMN_TITLES as any)[columnData.id] = columnData.title;

            setColumns((prev) => ({
                ...prev,
                [columnData.id]: [],
            }));
        },
        []
    );

    const handleTaskMove = React.useCallback(
        (taskId: string, fromColumn: string, toColumn: string) => {
            console.log('Moving task:', taskId, 'from', fromColumn, 'to', toColumn);
            // This would be handled automatically by the Kanban component's onValueChange
        },
        []
    );

    const handleBoardSelect = React.useCallback((boardId: string) => {
        setActiveBoard(boardId);
        // In a real app, you would load the board's tasks here
        // For now, we'll keep using the sample tasks
    }, []);

    const handleBoardCreate = React.useCallback(() => {
        setIsBoardDialogOpen(true);
    }, []);

    const handleBoardCreateSubmit = React.useCallback(
        (boardData: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>) => {
            const newBoard: Board = {
                ...boardData,
                id: `board-${Date.now()}`,
                createdAt: new Date().toISOString().split('T')[0],
                updatedAt: new Date().toISOString().split('T')[0],
            };

            setBoards((prev) => [...prev, newBoard]);
            setActiveBoard(newBoard.id);
        },
        []
    );

    const availableColumnIds = React.useMemo(() => Object.keys(columns), [columns]);

    return (
        <div className="[--header-height:calc(--spacing(14))]">
            <SidebarProvider className="flex flex-col">
                <SiteHeader />
                <div className="flex flex-1">
                    <AppSidebar
                        activeBoard={activeBoard}
                        onBoardSelect={handleBoardSelect}
                        onBoardCreate={handleBoardCreate}
                    />
                    <SidebarInset className="flex flex-1 flex-col">
                        {/* Page Header */}
                        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
                            <div className="flex h-16 items-center justify-between px-6">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <h1 className="flex items-center gap-2 text-xl font-semibold">
                                            {currentBoard && (
                                                <div
                                                    className="h-3 w-3 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            currentBoard.color || '#6b7280',
                                                    }}
                                                />
                                            )}
                                            {currentBoard?.name || 'Project Board'}
                                        </h1>
                                        <p className="text-muted-foreground text-sm">
                                            {currentBoard?.description ||
                                                'Manage tasks and track progress'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                                        <Input
                                            placeholder="Search tasks..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-64 pl-9"
                                        />
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filter
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={handleColumnAdd}>
                                        <Columns className="mr-2 h-4 w-4" />
                                        Add Column
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setSelectedColumnId('');
                                            setIsTaskDialogOpen(true);
                                        }}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        New Task
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Kanban Board */}
                        <div className="flex-1 overflow-hidden" suppressHydrationWarning>
                            <ProjectKanban
                                columns={columns}
                                onColumnsChange={setColumns}
                                onTaskAdd={handleTaskAdd}
                                onColumnAdd={handleColumnAdd}
                                onTaskMove={handleTaskMove}
                                className="h-full p-6"
                            />
                        </div>

                        {/* Dialogs */}
                        <NewTaskDialog
                            open={isTaskDialogOpen}
                            onOpenChange={(open) => {
                                setIsTaskDialogOpen(open);
                                if (!open) setSelectedColumnId('');
                            }}
                            onTaskCreate={handleTaskCreate}
                            defaultColumnId={selectedColumnId}
                            availableColumns={availableColumnIds}
                            hideColumnSelector={!!selectedColumnId}
                        />

                        <NewColumnDialog
                            open={isColumnDialogOpen}
                            onOpenChange={setIsColumnDialogOpen}
                            onColumnCreate={handleColumnCreate}
                            existingColumnIds={availableColumnIds}
                        />
                        <NewBoardDialog
                            open={isBoardDialogOpen}
                            onOpenChange={setIsBoardDialogOpen}
                            onBoardCreate={handleBoardCreateSubmit}
                        />
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
}
