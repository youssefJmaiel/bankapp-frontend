import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Target, MessageSquare, Handshake, X } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/departments', label: 'Departments', icon: Building2 },
  { to: '/missions', label: 'Missions', icon: Target },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/partners', label: 'Partners', icon: Handshake },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {


  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-navy-950/40 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-navy-950 text-navy-100 flex flex-col
          transition-transform duration-300 lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-navy-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-mint-500 flex items-center justify-center flex-shrink-0">
              <span className="text-navy-950 font-bold text-lg">M</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Meridian</p>
              <p className="text-navy-400 text-[10px] leading-tight">BankApp Console</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-navy-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          <p className="px-3 text-[10px] font-semibold text-navy-500 uppercase tracking-wider mb-2">Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-mint-500/10 text-mint-400 border-l-2 border-mint-400'
                    : 'text-navy-300 hover:bg-navy-800/50 hover:text-white border-l-2 border-transparent'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-navy-800/60 flex-shrink-0">
          <div className="flex items-center gap-2 text-navy-500 text-xs">
            <div className="w-2 h-2 rounded-full bg-mint-400 animate-pulse-soft" />
            <span>API Gateway :8082</span>
          </div>
        </div>
      </aside>
    </>
  );
}
