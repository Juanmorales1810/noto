"use client";

import { useState, useEffect } from "react";
import { AlertCircle, XCircle } from "lucide-react";

export default function ErrorPolicy() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Comprobar si hay un error en el localStorage (lo guardaría noto-board.tsx)
        const hasRLSError = localStorage.getItem("rls_policy_error") === "true";
        setVisible(hasRLSError);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg p-4 shadow-lg max-w-lg w-full">
            <div className="flex">
                <div className="flex-shrink-0">
                    <AlertCircle
                        className="h-5 w-5 text-red-500"
                        aria-hidden="true"
                    />
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Error de política RLS en Supabase
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                        <p>
                            Se ha detectado un error de recursión infinita en
                            las políticas de seguridad de la tabla "projects".
                            Para solucionarlo, sigue las instrucciones en el
                            archivo INSTRUCCIONES_SUPABASE.md.
                        </p>
                    </div>
                    <div className="mt-4">
                        <div className="-mx-2 -my-1.5 flex">
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.removeItem("rls_policy_error");
                                    setVisible(false);
                                }}
                                className="ml-auto bg-red-50 dark:bg-red-900 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
