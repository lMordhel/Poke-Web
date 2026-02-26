import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // Or a spinner

  if (!user || (!user.loggedIn && !user.token_version)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;