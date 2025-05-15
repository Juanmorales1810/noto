import type React from "react";
import "@/styles/globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { Toaster } from "@/components/ui/sonner";
import ErrorPolicy from "@/components/error-policy";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Tablero de Tareas",
    description: "Aplicación de gestión de tareas con columnas y drag and drop",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <ErrorPolicy />
                        {children}
                        <Toaster />
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
