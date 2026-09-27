import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState, useRef, useEffect } from 'react';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user
    ? (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '') || user.username?.[0]?.toUpperCase() || 'U'
    : 'U';

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-navy-100 h-16 flex items-center justify-between px-4 lg:px-6">
      <button onClick={onMenuClick} className="lg:hidden p-2 text-navy-600 hover:bg-navy-50 rounded-lg transition-colors">
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden sm:block">
        <p className="text-sm font-semibold text-navy-800">BankApp Microservices</p>
        <p className="text-xs text-navy-400">Spring Boot · Keycloak · IBM MQ</p>
      </div>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-navy-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-navy-900 text-mint-400 flex items-center justify-center text-sm font-bold">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-navy-800 leading-tight">{user?.fullName || 'User'}</p>
            <p className="text-xs text-navy-400 leading-tight">{user?.email || ''}</p>
          </div>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 card overflow-hidden animate-slide-up">
            <div className="px-4 py-3 border-b border-navy-100">
              <p className="text-sm font-semibold text-navy-900">{user?.fullName || 'User'}</p>
              <p className="text-xs text-navy-400">{user?.username}</p>
              {user && user.roles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.roles.slice(0, 3).map((role) => (
                    <span key={role} className="badge bg-mint-50 text-mint-700 text-[10px]">
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="py-1">
              <div className="px-4 py-2 flex items-center gap-2 text-sm text-navy-500">
                <User className="w-4 h-4" />
                <span className="truncate">{user?.email || 'No email'}</span>
              </div>
            </div>
            <div className="border-t border-navy-100 py-1">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
