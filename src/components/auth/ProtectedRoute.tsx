import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, session } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !session) {
    // Redirect them to the /auth page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they log in, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.user_metadata?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
