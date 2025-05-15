import { ProtectedRoute } from "@/components/auth/protected-route";
import { UserDiagnostics } from "@/components/user-diagnostics";

export default function DiagnosticPage() {
    return (
        <ProtectedRoute>
            <div className="container mx-auto py-10">
                <h1 className="text-2xl font-bold mb-6">
                    Diagnóstico del Sistema
                </h1>
                <UserDiagnostics />
            </div>
        </ProtectedRoute>
    );
}
