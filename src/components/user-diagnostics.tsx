"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userService } from "@/lib/supabase/user-service";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Separator } from "@/components/ui/separator";

export function UserDiagnostics() {
    const [authUser, setAuthUser] = useState<any>(null);
    const [dbUser, setDbUser] = useState<any>(null);
    const [errorLogs, setErrorLogs] = useState<any[]>([]);
    const [repairStatus, setRepairStatus] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Cargar errores del localStorage si existen
        try {
            const storedErrors = localStorage.getItem("userCreateErrors");
            if (storedErrors) {
                setErrorLogs(JSON.parse(storedErrors));
            }
        } catch (e) {
            console.error("Error al cargar errores del localStorage:", e);
        }
    }, []);

    const checkUserStatus = async () => {
        setLoading(true);
        try {
            const supabase = createClientSupabaseClient();

            // Obtener usuario de autenticación
            const { data } = await supabase.auth.getUser();
            setAuthUser(data.user);

            // Verificar si existe en la base de datos
            if (data.user) {
                const { data: dbUserData, error } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", data.user.id)
                    .single();

                if (error) {
                    console.error("Error al verificar usuario en DB:", error);
                    setDbUser(null);
                } else {
                    setDbUser(dbUserData);
                }
            }
        } catch (err) {
            console.error("Error en diagnóstico:", err);
        } finally {
            setLoading(false);
        }
    };

    const repairUser = async () => {
        setLoading(true);
        setRepairStatus("Intentando reparar usuario...");

        try {
            if (!authUser) {
                setRepairStatus("No hay usuario autenticado para reparar");
                return;
            }

            // Reintentar creación manual
            const supabase = createClientSupabaseClient();

            const newUser = {
                id: authUser.id,
                email: authUser.email || "",
                name:
                    authUser.user_metadata?.name ||
                    authUser.user_metadata?.full_name ||
                    authUser.email?.split("@")[0] ||
                    "",
                avatar_url: authUser.user_metadata?.avatar_url || null,
            };

            const { data, error } = await supabase
                .from("users")
                .upsert(newUser, { onConflict: "id", ignoreDuplicates: false })
                .select()
                .single();

            if (error) {
                setRepairStatus(`Error al reparar: ${error.message}`);
            } else {
                setRepairStatus("¡Usuario reparado correctamente!");
                setDbUser(data);
            }
        } catch (err: any) {
            setRepairStatus(
                `Error en reparación: ${err?.message || String(err)}`
            );
        } finally {
            setLoading(false);
        }
    };

    const clearErrorLogs = () => {
        localStorage.removeItem("userCreateErrors");
        setErrorLogs([]);
    };

    return (
        <Card className="w-full max-w-4xl mx-auto my-8">
            <CardHeader>
                <CardTitle>Diagnóstico de Usuario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4">
                    <Button
                        onClick={checkUserStatus}
                        disabled={loading}
                        variant="outline"
                    >
                        {loading
                            ? "Verificando..."
                            : "Verificar estado de usuario"}
                    </Button>

                    <Button
                        onClick={repairUser}
                        disabled={loading || !authUser}
                        variant="default"
                    >
                        Reparar usuario
                    </Button>

                    {errorLogs.length > 0 && (
                        <Button
                            onClick={clearErrorLogs}
                            variant="destructive"
                            size="sm"
                        >
                            Borrar registros de error
                        </Button>
                    )}
                </div>

                {repairStatus && (
                    <div
                        className={`p-4 rounded-md ${
                            repairStatus.includes("Error")
                                ? "bg-red-100 text-red-800"
                                : repairStatus.includes("reparado")
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                        }`}
                    >
                        {repairStatus}
                    </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-lg font-medium mb-2">
                            Usuario de Autenticación
                        </h3>
                        {authUser ? (
                            <div className="bg-slate-100 p-4 rounded-md">
                                <p>
                                    <strong>ID:</strong> {authUser.id}
                                </p>
                                <p>
                                    <strong>Email:</strong> {authUser.email}
                                </p>
                                <p>
                                    <strong>Creado:</strong>{" "}
                                    {new Date(
                                        authUser.created_at
                                    ).toLocaleString()}
                                </p>
                                <p>
                                    <strong>Último acceso:</strong>{" "}
                                    {authUser.last_sign_in_at
                                        ? new Date(
                                              authUser.last_sign_in_at
                                          ).toLocaleString()
                                        : "N/A"}
                                </p>
                            </div>
                        ) : (
                            <p className="text-slate-500">
                                No hay información de usuario autenticado
                            </p>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-medium mb-2">
                            Usuario en Base de Datos
                        </h3>
                        {dbUser ? (
                            <div className="bg-slate-100 p-4 rounded-md">
                                <p>
                                    <strong>ID:</strong> {dbUser.id}
                                </p>
                                <p>
                                    <strong>Email:</strong> {dbUser.email}
                                </p>
                                <p>
                                    <strong>Nombre:</strong>{" "}
                                    {dbUser.name || "N/A"}
                                </p>
                                <p>
                                    <strong>Creado:</strong>{" "}
                                    {new Date(
                                        dbUser.created_at
                                    ).toLocaleString()}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-red-100 p-4 rounded-md text-red-800">
                                {authUser ? (
                                    <p>
                                        ¡Usuario autenticado no encontrado en la
                                        base de datos!
                                    </p>
                                ) : (
                                    <p>
                                        Verifica primero el estado del usuario
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {errorLogs.length > 0 && (
                    <div>
                        <h3 className="text-lg font-medium mb-2">
                            Historial de Errores
                        </h3>
                        <div className="bg-slate-100 p-4 rounded-md max-h-60 overflow-y-auto">
                            {errorLogs.map((log, i) => (
                                <div
                                    key={i}
                                    className="mb-2 pb-2 border-b border-slate-200"
                                >
                                    <p>
                                        <strong>Fecha:</strong>{" "}
                                        {new Date(
                                            log.timestamp
                                        ).toLocaleString()}
                                    </p>
                                    <p>
                                        <strong>Usuario ID:</strong>{" "}
                                        {log.userId}
                                    </p>
                                    <p>
                                        <strong>Error:</strong> {log.error}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
