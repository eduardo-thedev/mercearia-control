import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // TODO: skeleton/spinner quando tivermos identidade visual de loading
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
