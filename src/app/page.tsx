import { ProtectedRoute } from "@/components/auth/protected-route";
import NotoBoard from "@/components/noto-board";

export default function HomePage() {
    return (
        <ProtectedRoute>
            <NotoBoard />
        </ProtectedRoute>
    );
}
