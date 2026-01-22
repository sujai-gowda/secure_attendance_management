import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface TeacherRouteProps {
  children: ReactNode;
}

export default function TeacherRoute({ children }: TeacherRouteProps) {
  const { isTeacher, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isTeacher) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
