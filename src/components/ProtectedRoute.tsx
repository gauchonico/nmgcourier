import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">
          Checking authentication...
        </div>
      </div>
    );
  }

  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}