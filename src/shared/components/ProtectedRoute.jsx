import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { protectedRouteDecision } from '@/features/auth/session';
import SessionUnavailable from '@/shared/components/SessionUnavailable';

const ProtectedRoute = ({ children }) => {
  const { user, loading, unavailable } = useAuth();

  const decision = protectedRouteDecision(user, loading, unavailable);

  if (decision === 'wait') return null;

  if (decision === 'login') {
    return <Navigate to="/login" replace />;
  }

  // Sesión no verificada: ni se abre la ruta ni se cierra la sesión.
  if (decision === 'unavailable') {
    return <SessionUnavailable />;
  }

  return children;
};

export default ProtectedRoute;
