import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // Or a spinner

  if (!user || (!user.loggedIn && !user.token_version)) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return children;
  }

  // Fallback: If logged in but not an admin, redirect to normal dashboard
  return <Navigate to="/dashboard" replace />;
};

export default AdminRoute;
