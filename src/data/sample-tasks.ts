import { Task } from '@/types/kanban';

export const sampleTasks: Record<string, Task[]> = {
    backlog: [
        {
            id: '1',
            title: 'Add authentication',
            priority: 'high',
            description: 'Implement JWT authentication system',
            assignee: 'John Doe',
            assigneeAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
            dueDate: 'Jan 10',
        },
        {
            id: '2',
            title: 'Create API endpoints',
            priority: 'medium',
            description: 'Build REST API for the application',
            assignee: 'Jane Smith',
            assigneeAvatar: 'https://randomuser.me/api/portraits/women/2.jpg',
            dueDate: 'Jan 15',
        },
        {
            id: '3',
            title: 'Write documentation',
            priority: 'low',
            assignee: 'Bob Johnson',
            assigneeAvatar: 'https://randomuser.me/api/portraits/men/3.jpg',
            dueDate: 'Jan 20',
        },
    ],
    inProgress: [
        {
            id: '4',
            title: 'Design system updates',
            priority: 'high',
            description: 'Update design tokens and components',
            assignee: 'Alice Brown',
            assigneeAvatar: 'https://randomuser.me/api/portraits/women/4.jpg',
            dueDate: 'Dec 25',
        },
        {
            id: '5',
            title: 'Implement dark mode',
            priority: 'medium',
            assignee: 'Charlie Wilson',
            assigneeAvatar: 'https://randomuser.me/api/portraits/men/5.jpg',
            dueDate: 'Dec 28',
        },
    ],
    review: [
        {
            id: '6',
            title: 'Code review fixes',
            priority: 'medium',
            description: 'Address feedback from code review',
            assignee: 'Diana Prince',
            assigneeAvatar: 'https://randomuser.me/api/portraits/women/8.jpg',
            dueDate: 'Dec 20',
        },
    ],
    done: [
        {
            id: '7',
            title: 'Setup project',
            priority: 'high',
            assignee: 'Eve Davis',
            assigneeAvatar: 'https://randomuser.me/api/portraits/women/6.jpg',
            dueDate: 'Sep 25',
        },
        {
            id: '8',
            title: 'Initial commit',
            priority: 'low',
            assignee: 'Frank White',
            assigneeAvatar: 'https://randomuser.me/api/portraits/men/7.jpg',
            dueDate: 'Sep 20',
        },
    ],
};
