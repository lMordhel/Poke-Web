import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { protectedRouteDecision } from '@/features/auth/session';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  const decision = protectedRouteDecision(user, loading);

  if (decision === 'wait') return null;

  if (decision === 'login') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
