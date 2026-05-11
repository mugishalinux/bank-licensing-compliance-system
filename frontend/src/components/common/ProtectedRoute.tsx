import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface Props {
  children: React.ReactNode;
  roles?: UserRole[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-6 w-6 rounded-full border-2 border-bnr border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && !roles.some((r) => hasRole(r))) {
    return (
      <div className="flex items-center justify-center h-screen px-6">
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-semibold">Access denied</h2>
          <p className="text-sm text-[color:var(--color-ink-soft)] mt-1">
            Your role does not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
