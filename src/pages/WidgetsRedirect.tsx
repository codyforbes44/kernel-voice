import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/layout/LoadingScreen";

const WidgetsRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/auth?redirect=/admin/widgets" replace />;
  }

  return <Navigate to="/admin/widgets" replace />;
};

export default WidgetsRedirect;
