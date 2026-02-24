import { Navigate } from 'react-router-dom';
import apiService from '../services/apiService';

const AdminRoute = ({ children }) => {
  const token = apiService.token;
  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Try to parse user from local storage
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      // Ensure the role is explicit and 'admin'
      if (user.role === 'admin') {
        return children;
      }
    }
  } catch (e) {
    console.warn("Invalid user stored", e);
  }

  // Fallback: If logged in but not an admin, redirect to normal dashboard
  return <Navigate to="/dashboard" replace />;
};

export default AdminRoute;
