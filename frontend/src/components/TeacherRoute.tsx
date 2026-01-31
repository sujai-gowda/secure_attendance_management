import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthPageSkeleton } from "@/components/ui/page-skeletons";

interface TeacherRouteProps {
  children: ReactNode;
}

export default function TeacherRoute({ children }: TeacherRouteProps) {
  const { isTeacher, loading } = useAuth();

  if (loading) {
    return <AuthPageSkeleton />;
  }

  if (!isTeacher) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
