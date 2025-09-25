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
import { Columns, AlertCircle } from 'lucide-react';

interface NewColumnDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onColumnCreate: (columnData: { id: string; title: string; description?: string }) => void;
    existingColumnIds: string[];
}

export function NewColumnDialog({
    open,
    onOpenChange,
    onColumnCreate,
    existingColumnIds,
}: NewColumnDialogProps) {
    const [formData, setFormData] = React.useState({
        title: '',
        description: '',
    });

    const [errors, setErrors] = React.useState<Record<string, string>>({});

    const generateColumnId = (title: string): string => {
        // Generate ID from title (lowercase, no spaces, no special chars)
        let baseId = title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '')
            .substring(0, 20);

        if (!baseId) {
            baseId = 'column';
        }

        // Ensure uniqueness
        let finalId = baseId;
        let counter = 1;
        while (existingColumnIds.includes(finalId)) {
            finalId = `${baseId}${counter}`;
            counter++;
        }

        return finalId;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Column title is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const columnId = generateColumnId(formData.title);

        // Create column
        const columnData = {
            id: columnId,
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
        };

        onColumnCreate(columnData);

        // Reset form
        setFormData({
            title: '',
            description: '',
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
                        <Columns className="h-5 w-5" />
                        Create New Column
                    </DialogTitle>
                    <DialogDescription>
                        Add a new column to organize your tasks. This will appear as a new section
                        in your board.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="columnTitle">Column Title *</Label>
                        <Input
                            id="columnTitle"
                            placeholder="e.g., Testing, Blocked, Ready for Deploy..."
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className={errors.title ? 'border-destructive' : ''}
                        />
                        {errors.title && <p className="text-destructive text-sm">{errors.title}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="columnDescription">Description (Optional)</Label>
                        <Textarea
                            id="columnDescription"
                            placeholder="Describe what tasks belong in this column..."
                            rows={2}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                        />
                    </div>

                    {formData.title && (
                        <div className="bg-muted/50 rounded-md p-3">
                            <p className="text-muted-foreground text-sm">
                                <strong>Column ID:</strong> {generateColumnId(formData.title)}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                                This ID will be used internally to identify the column.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Column</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
