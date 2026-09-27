import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, login } = useAuth();
  const [loginStarted, setLoginStarted] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated' && !loginStarted) {
      setLoginStarted(true);
      login().catch((error) => {
        console.error('[ProtectedRoute] Login failed', error);
        setLoginStarted(false);
      });
    }
  }, [status, login, loginStarted]);

  if (status === 'initializing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <Loader2 className="w-8 h-8 animate-spin text-mint-400" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-mint-400 mx-auto mb-4" />
          <p className="text-navy-300 text-sm">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === 'initializing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <Loader2 className="w-8 h-8 animate-spin text-mint-400" />
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
