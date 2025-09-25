'use client';

import * as React from 'react';
import { Command, LifeBuoy, Send } from 'lucide-react';

import { BoardsNav } from '@/components/boards-nav';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { userBoards } from '@/data/user-boards';

const data = {
    user: {
        name: 'Juan Morales',
        email: 'juan@example.com',
        avatar: '/avatars/juan.jpg',
    },
    navSecondary: [
        {
            title: 'Support',
            url: '/support',
            icon: LifeBuoy,
        },
        {
            title: 'Feedback',
            url: '/feedback',
            icon: Send,
        },
    ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    activeBoard?: string;
    onBoardSelect?: (boardId: string) => void;
    onBoardCreate?: () => void;
}

export function AppSidebar({
    activeBoard = 'main-project',
    onBoardSelect,
    onBoardCreate,
    ...props
}: AppSidebarProps) {
    return (
        <Sidebar
            className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
            {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="/">
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">Noto</span>
                                    <span className="truncate text-xs">Project Management</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <BoardsNav
                    boards={userBoards}
                    activeBoard={activeBoard}
                    onBoardSelect={onBoardSelect}
                    onBoardCreate={onBoardCreate}
                />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
        </Sidebar>
    );
}
