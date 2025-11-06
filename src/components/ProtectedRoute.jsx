import { Navigate } from 'react-router-dom';
import { getCurrentUser } from './auth';

export default function ProtectedRoute({ children }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
