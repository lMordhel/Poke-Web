import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { adminRouteDecision } from '@/features/auth/session';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  const decision = adminRouteDecision(user, loading);

  if (decision === 'wait') return null;

  if (decision === 'login') {
    return <Navigate to="/login" replace />;
  }

  // Autenticado pero sin rol admin: al panel normal.
  if (decision === 'dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
