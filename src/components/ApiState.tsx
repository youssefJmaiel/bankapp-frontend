import { Loader2, AlertCircle, Inbox, ShieldX, Lock } from 'lucide-react';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-navy-400 animate-fade-in">
      <Loader2 className="w-8 h-8 animate-spin text-mint-500 mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-navy-500 animate-fade-in">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <p className="text-sm font-semibold text-navy-800 mb-1">Something went wrong</p>
      <p className="text-sm text-navy-400 mb-4 max-w-md text-center">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'No data yet', message, action }: { title?: string; message?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-navy-400 animate-fade-in">
      <div className="w-14 h-14 rounded-full bg-navy-50 flex items-center justify-center mb-4">
        <Inbox className="w-7 h-7 text-navy-300" />
      </div>
      <p className="text-sm font-semibold text-navy-700 mb-1">{title}</p>
      {message && <p className="text-sm text-navy-400 mb-4 max-w-sm text-center">{message}</p>}
      {action}
    </div>
  );
}

export function UnauthorizedState({ onLogin }: { onLogin?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-navy-500 animate-fade-in">
      <div className="w-14 h-14 rounded-full bg-gold-50 flex items-center justify-center mb-4">
        <Lock className="w-7 h-7 text-gold-500" />
      </div>
      <p className="text-sm font-semibold text-navy-800 mb-1">Authentication required</p>
      <p className="text-sm text-navy-400 mb-4">Your session has expired. Please log in again.</p>
      {onLogin && (
        <button onClick={onLogin} className="btn-primary">
          Log in
        </button>
      )}
    </div>
  );
}

export function ForbiddenState(): React.ReactNode {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-navy-500 animate-fade-in">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <ShieldX className="w-7 h-7 text-red-500" />
      </div>
      <p className="text-sm font-semibold text-navy-800 mb-1">Access denied</p>
      <p className="text-sm text-navy-400">You do not have permission to view this resource.</p>
    </div>
  );
}

export function ApiStateHandler({
  loading,
  error,
  empty,
  hasData,
  children,
  onRetry,
  onLogin,
  emptyTitle,
  emptyMessage,
}: {
  loading: boolean;
  error: unknown;
  empty: boolean;
  hasData: boolean;
  children: React.ReactNode;
  onRetry?: () => void;
  onLogin?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
}) {
  if (loading) return <LoadingState />;
  if (error) {
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred.';
    const status = (error as { status?: number })?.status;
    if (status === 401) return <UnauthorizedState onLogin={onLogin} />;
    if (status === 403) return <ForbiddenState />;
    return <ErrorState message={msg} onRetry={onRetry} />;
  }
  if (empty || !hasData) return <EmptyState title={emptyTitle} message={emptyMessage} />;
  return <>{children}</>;
}
