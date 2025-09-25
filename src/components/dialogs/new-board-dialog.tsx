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
import { FolderKanban } from 'lucide-react';
import { Board } from '@/types/board';

interface NewBoardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onBoardCreate: (board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const BOARD_COLORS = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ef4444', // red
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#ec4899', // pink
    '#6b7280', // gray
];

export function NewBoardDialog({ open, onOpenChange, onBoardCreate }: NewBoardDialogProps) {
    const [formData, setFormData] = React.useState({
        name: '',
        description: '',
        color: BOARD_COLORS[0],
    });

    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Board name is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Create board
        const newBoard: Omit<Board, 'id' | 'createdAt' | 'updatedAt'> = {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            color: formData.color,
            isActive: false,
            taskCount: 0,
            memberCount: 1,
        };

        onBoardCreate(newBoard);

        // Reset form
        setFormData({
            name: '',
            description: '',
            color: BOARD_COLORS[0],
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
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FolderKanban className="h-5 w-5" />
                        Create New Board
                    </DialogTitle>
                    <DialogDescription>
                        Create a new board to organize your projects and tasks.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="boardName">Board Name *</Label>
                        <Input
                            id="boardName"
                            placeholder="e.g., Mobile App Development"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="boardDescription">Description (Optional)</Label>
                        <Textarea
                            id="boardDescription"
                            placeholder="Describe your board..."
                            rows={2}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Board Color</Label>
                        <div className="flex flex-wrap gap-2">
                            {BOARD_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => handleInputChange('color', color)}
                                    className={`h-8 w-8 rounded-full border-2 transition-all hover:scale-110 ${
                                        formData.color === color
                                            ? 'border-foreground ring-ring ring-2 ring-offset-2'
                                            : 'border-muted-foreground/30'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Board</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
