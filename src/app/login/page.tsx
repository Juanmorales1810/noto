"use client";

import type React from "react";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Github, Mail } from "lucide-react";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProviderLoading, setIsProviderLoading] = useState<string | null>(
        null
    );
    const { signIn, signInWithProvider, user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Verificar si el usuario viene de registrarse
        const registered = searchParams.get("registered");
        if (registered === "true") {
            setSuccess("Registro exitoso. Por favor, inicia sesión.");
        }

        // Redirigir si ya está autenticado
        if (user) {
            router.push("/");
        }
    }, [searchParams, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            const { error, success } = await signIn(email, password);

            if (error) {
                setError(error.message || "Credenciales inválidas");
                return;
            }

            if (success) {
                router.push("/");
            }
        } catch (err) {
            setError("Ocurrió un error inesperado");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProviderSignIn = async (provider: "github" | "google") => {
        setError(null);
        setSuccess(null);
        setIsProviderLoading(provider);

        try {
            const { error } = await signInWithProvider(provider);

            if (error) {
                setError(
                    `Error al iniciar sesión con ${provider}: ${error.message}`
                );
            }
        } catch (err) {
            setError("Ocurrió un error inesperado");
            console.error(err);
        } finally {
            setIsProviderLoading(null);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
                    <CardDescription>
                        Ingresa tus credenciales para acceder a tu cuenta
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {success && (
                            <Alert
                                variant="default"
                                className="border-green-500 bg-green-50 text-green-800"
                            >
                                <AlertDescription>{success}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex flex-col space-y-2">
                            <Button
                                variant="outline"
                                onClick={() => handleProviderSignIn("github")}
                                disabled={isProviderLoading !== null}
                                className="w-full"
                            >
                                {isProviderLoading === "github" ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Github className="mr-2 h-4 w-4" />
                                )}
                                Continuar con GitHub
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => handleProviderSignIn("google")}
                                disabled={isProviderLoading !== null}
                                className="w-full"
                            >
                                {isProviderLoading === "google" ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <svg
                                        className="mr-2 h-4 w-4"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                        <path d="M1 1h22v22H1z" fill="none" />
                                    </svg>
                                )}
                                Continuar con Google
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    O continúa con
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Correo electrónico
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={
                                    isLoading || isProviderLoading !== null
                                }
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Iniciar sesión con Email
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </CardContent>{" "}
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        ¿No tienes una cuenta?{" "}
                        <Link
                            href="/register"
                            className="text-primary hover:underline"
                        >
                            Registrarse
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-screen w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
