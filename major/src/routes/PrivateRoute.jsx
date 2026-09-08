import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirect to login if not authenticated
const PrivateRoute = ({ children }) => {
  const { therapist, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return therapist ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
