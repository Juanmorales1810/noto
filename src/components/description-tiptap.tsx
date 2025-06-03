"use client";

import { useCallback, useEffect, useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { BlockquoteToolbar } from "@/components/toolbars/blockquote";
import { BoldToolbar } from "@/components/toolbars/bold";
import { BulletListToolbar } from "@/components/toolbars/bullet-list";
import { CodeToolbar } from "@/components/toolbars/code";
import { CodeBlockToolbar } from "@/components/toolbars/code-block";
import { HardBreakToolbar } from "@/components/toolbars/hard-break";
import { HorizontalRuleToolbar } from "@/components/toolbars/horizontal-rule";
import { ItalicToolbar } from "@/components/toolbars/italic";
import { OrderedListToolbar } from "@/components/toolbars/ordered-list";
import { RedoToolbar } from "@/components/toolbars/redo";
import { StrikeThroughToolbar } from "@/components/toolbars/strikethrough";
import { ToolbarProvider } from "@/components/toolbars/toolbar-provider";
import { UndoToolbar } from "@/components/toolbars/undo";
import { EditorContent, type Extension, useEditor } from "@tiptap/react";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { ImageExtension } from "./extensions/image";
import { ImagePlaceholder } from "./extensions/image-placeholder";
import { ImagePlaceholderToolbar } from "./toolbars/image-placeholder-toolbar";
import { ColorHighlightToolbar } from "./toolbars/color-and-highlight";

const extensions = [
    StarterKit.configure({
        orderedList: {
            HTMLAttributes: {
                class: "list-decimal",
            },
        },
        bulletList: {
            HTMLAttributes: {
                class: "list-disc",
            },
        },
        code: {
            HTMLAttributes: {
                class: "bg-accent rounded-md p-1",
            },
        },
        horizontalRule: {
            HTMLAttributes: {
                class: "my-2",
            },
        },
        codeBlock: {
            HTMLAttributes: {
                class: "bg-primary text-primary-foreground p-2 text-sm rounded-md p-1",
            },
        },
        heading: {
            levels: [1, 2, 3, 4],
            HTMLAttributes: {
                class: "tiptap-heading",
            },
        },
    }),
    TextStyle,
    Color,
    Highlight.configure({
        multicolor: true,
    }),
    ImageExtension,
    ImagePlaceholder,
];

interface DescriptionTiptapProps {
    value?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
}

const DescriptionTiptap = ({
    value = "",
    onChange,
    placeholder,
}: DescriptionTiptapProps) => {
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const isUpdatingFromProps = useRef(false);

    // Función para manejar cambios con debounce solo para el callback externo
    const handleContentChange = useCallback(
        (content: string) => {
            if (isUpdatingFromProps.current) {
                return; // Evitar loops infinitos cuando actualizamos desde props
            }

            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }

            debounceTimer.current = setTimeout(() => {
                onChange?.(content);
            }, 1000); // Aumentado a 1000ms para evitar updates muy frecuentes
        },
        [onChange]
    );

    // Limpiar el timer al desmontar el componente
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);
    const editor = useEditor({
        extensions: extensions as Extension[],
        content: value,
        immediatelyRender: false,
        editable: true,
        injectCSS: false, // Evitar inyección de CSS adicional
        editorProps: {
            attributes: {
                class: "prose prose-sm focus:outline-none min-h-[200px] p-4",
                spellcheck: "false", // Desactivar spellcheck para mejor rendimiento
            },
            handleDOMEvents: {
                keydown: () => false, // Permitir que todos los eventos de teclado pasen directamente
            },
        },
        onUpdate: ({ editor }) => {
            const htmlContent = editor.getHTML();
            handleContentChange(htmlContent);
        },
        // Mejorar el enfoque del editor
        onFocus: ({ editor }) => {
            // El editor está enfocado, listo para escribir
        },
        onBlur: ({ editor }) => {
            // Cuando se pierde el foco, guardamos inmediatamente
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
            onChange?.(editor.getHTML());
        },
    });

    // Actualizar el contenido del editor cuando el prop value cambie externamente
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            isUpdatingFromProps.current = true;
            editor.commands.setContent(value, false); // false = no emitir update event
            isUpdatingFromProps.current = false;
        }
    }, [editor, value]);

    if (!editor) {
        return null;
    }
    return (
        <div className="border w-full relative rounded-md overflow-hidden pb-3">
            <div className="flex w-full items-center py-2 px-2 justify-between border-b  sticky top-0 left-0 bg-background z-20">
                <ToolbarProvider editor={editor}>
                    <div className="flex items-center gap-2">
                        <UndoToolbar />
                        <RedoToolbar />
                        <Separator orientation="vertical" className="h-7" />
                        <BoldToolbar />
                        <ItalicToolbar />
                        <StrikeThroughToolbar />
                        <BulletListToolbar />
                        <OrderedListToolbar />
                        <CodeToolbar />
                        <CodeBlockToolbar />
                        <HorizontalRuleToolbar />
                        <BlockquoteToolbar />
                        <HardBreakToolbar />
                        <ImagePlaceholderToolbar />
                        <ColorHighlightToolbar />
                    </div>
                </ToolbarProvider>
            </div>{" "}
            <div
                onClick={() => {
                    editor?.chain().focus().run();
                }}
                className="cursor-text bg-background p-2"
            >
                <EditorContent
                    className="outline-none min-h-[12rem]"
                    editor={editor}
                />
            </div>
        </div>
    );
};

export default DescriptionTiptap;
