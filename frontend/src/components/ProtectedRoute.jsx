import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * ProtectedRoute - guards routes based on authentication and optional role restrictions.
 * @param {string[]} allowedRoles - If provided, only users with these roles can access.
 *   If not provided, any authenticated user can access.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading VendorBridge...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to dashboard with a message
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
