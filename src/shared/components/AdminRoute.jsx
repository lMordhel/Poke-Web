import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { adminRouteDecision } from '@/features/auth/session';
import SessionUnavailable from '@/shared/components/SessionUnavailable';

const AdminRoute = ({ children }) => {
  const { user, loading, unavailable } = useAuth();

  const decision = adminRouteDecision(user, loading, unavailable);

  if (decision === 'wait') return null;

  if (decision === 'login') {
    return <Navigate to="/login" replace />;
  }

  // Sesión no verificada: ni se abre la ruta ni se cierra la sesión.
  if (decision === 'unavailable') {
    return <SessionUnavailable />;
  }

  // Autenticado pero sin rol admin: al panel normal.
  if (decision === 'dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
