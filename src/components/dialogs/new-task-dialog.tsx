'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Task, COLUMN_TITLES } from '@/types/kanban';
import { Calendar, User, AlertCircle } from 'lucide-react';

interface NewTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTaskCreate: (task: Omit<Task, 'id'>, columnId: string) => void;
    defaultColumnId?: string;
    availableColumns: string[];
    hideColumnSelector?: boolean;
}

export function NewTaskDialog({
    open,
    onOpenChange,
    onTaskCreate,
    defaultColumnId,
    availableColumns,
    hideColumnSelector = false,
}: NewTaskDialogProps) {
    const [formData, setFormData] = React.useState({
        title: '',
        description: '',
        priority: 'medium' as Task['priority'],
        assignee: '',
        dueDate: '',
        columnId: defaultColumnId || availableColumns[0] || '',
    });

    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }
        if (!hideColumnSelector && !formData.columnId) {
            newErrors.columnId = 'Column is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Use defaultColumnId if hideColumnSelector is true
        const targetColumnId = hideColumnSelector ? defaultColumnId! : formData.columnId;

        // Create task
        const newTask: Omit<Task, 'id'> = {
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            priority: formData.priority,
            assignee: formData.assignee.trim() || undefined,
            assigneeAvatar: formData.assignee.trim()
                ? `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'women' : 'men'}/${Math.floor(Math.random() * 99) + 1}.jpg`
                : undefined,
            dueDate: formData.dueDate || undefined,
        };

        onTaskCreate(newTask, targetColumnId);

        // Reset form
        setFormData({
            title: '',
            description: '',
            priority: 'medium',
            assignee: '',
            dueDate: '',
            columnId: defaultColumnId || availableColumns[0] || '',
        });
        setErrors({});
        onOpenChange(false);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Create New Task
                        {hideColumnSelector && defaultColumnId && (
                            <span className="text-muted-foreground text-sm font-normal">
                                in {COLUMN_TITLES[defaultColumnId] || defaultColumnId}
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {hideColumnSelector
                            ? `Add a new task to the ${COLUMN_TITLES[defaultColumnId!] || defaultColumnId} column.`
                            : 'Add a new task to your project board. Fill in the details below.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            placeholder="Enter task title..."
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className={errors.title ? 'border-destructive' : ''}
                        />
                        {errors.title && <p className="text-destructive text-sm">{errors.title}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the task..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                        />
                    </div>

                    <div className={hideColumnSelector ? 'grid gap-2' : 'grid grid-cols-2 gap-4'}>
                        <div className="grid gap-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) => handleInputChange('priority', value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">🟢 Low</SelectItem>
                                    <SelectItem value="medium">🟡 Medium</SelectItem>
                                    <SelectItem value="high">🔴 High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {!hideColumnSelector && (
                            <div className="grid gap-2">
                                <Label htmlFor="column">Column *</Label>
                                <Select
                                    value={formData.columnId}
                                    onValueChange={(value) => handleInputChange('columnId', value)}>
                                    <SelectTrigger
                                        className={errors.columnId ? 'border-destructive' : ''}>
                                        <SelectValue placeholder="Select column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableColumns.map((columnId) => (
                                            <SelectItem key={columnId} value={columnId}>
                                                {COLUMN_TITLES[columnId] || columnId}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.columnId && (
                                    <p className="text-destructive text-sm">{errors.columnId}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="assignee" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Assignee
                            </Label>
                            <Input
                                id="assignee"
                                placeholder="Assign to someone..."
                                value={formData.assignee}
                                onChange={(e) => handleInputChange('assignee', e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="dueDate" className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Due Date
                            </Label>
                            <Input
                                id="dueDate"
                                placeholder="e.g., Jan 15"
                                value={formData.dueDate}
                                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Task</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
