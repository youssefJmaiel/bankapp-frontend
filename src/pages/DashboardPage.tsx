import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, Target, MessageSquare, Handshake, ArrowRight, CheckCircle2, Clock, Activity } from 'lucide-react';
import { getEmployees } from '@/api/employees';
import { getDepartments } from '@/api/departments';
import { getMissions } from '@/api/missions';
import { getPartners } from '@/api/partners';
import { getMessages } from '@/api/messages';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/permissions';
import { LoadingState, ErrorState } from '@/components/ApiState';
import type { DashboardStats } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();
  const admin = isAdmin(user?.roles ?? []);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);

    Promise.all([
      getEmployees().catch(() => null),
      getDepartments().catch(() => null),
      getMissions().catch(() => null),
      getPartners().catch(() => null),
      admin ? getMessages().catch(() => null) : Promise.resolve(null),
    ])
      .then(([employees, departments, missions, partners, messages]) => {
        const empCount = employees ? Array.isArray(employees) ? employees.length : 0 : null;
        const deptCount = departments ? Array.isArray(departments) ? departments.length : 0 : null;
        const missionCount = missions ? Array.isArray(missions) ? missions.length : 0 : null;
        const partnerCount = partners ? Array.isArray(partners) ? partners.length : 0 : null;
        const msgCount = messages ? Array.isArray(messages) ? messages.length : 0 : null;
        const processedCount = messages && Array.isArray(messages)
          ? messages.filter((m) => m.processed === true).length
          : null;

        setStats({
          employees: empCount ?? 0,
          departments: deptCount ?? 0,
          missions: missionCount ?? 0,
          partners: partnerCount ?? 0,
          messages: msgCount ?? 0,
          processedMessages: processedCount ?? 0,
        });

        const dashboardData = admin
          ? [employees, departments, missions, partners, messages]
          : [employees, departments, missions, partners];

        const allFailed = dashboardData.every((v) => v === null);
        if (allFailed) {
          setError('Unable to load dashboard data. Check that the API Gateway is running.');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [admin]);

  if (loading) return <LoadingState message="Loading dashboard…" />;
  if (error && !stats) return <ErrorState message={error} onRetry={load} />;

  const cards = [
    { label: 'Employees', value: stats?.employees, to: '/employees', icon: Users, color: 'mint' as const },
    { label: 'Departments', value: stats?.departments, to: '/departments', icon: Building2, color: 'navy' as const },
    { label: 'Missions', value: stats?.missions, to: '/missions', icon: Target, color: 'gold' as const },
    { label: 'Partners', value: stats?.partners, to: '/partners', icon: Handshake, color: 'mint' as const },
  ];

  const colorMap = {
    mint: { bg: 'bg-mint-50', text: 'text-mint-600', ring: 'ring-mint-200' },
    navy: { bg: 'bg-navy-100', text: 'text-navy-700', ring: 'ring-navy-200' },
    gold: { bg: 'bg-gold-50', text: 'text-gold-600', ring: 'ring-gold-200' },
  };

  const messageProcessingRate = stats && stats.messages > 0
    ? Math.round((stats.processedMessages / stats.messages) * 100)
    : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
        <p className="text-sm text-navy-400 mt-1">
          Welcome back, {user?.fullName || user?.username || 'User'} — here's your operations overview.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => {
          const c = colorMap[card.color];
          return (
            <Link
              key={card.label}
              to={card.to}
              className="card p-5 hover:shadow-card-hover transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center ring-4 ${c.ring}/30`}>
                  <card.icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-navy-200 group-hover:text-navy-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-3xl font-bold text-navy-900">
                {card.value !== undefined ? card.value : '—'}
              </p>
              <p className="text-sm text-navy-400 mt-1">{card.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Messages + processing */}
      {admin && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-navy-600" />
            <h2 className="text-lg font-bold text-navy-900">IBM MQ Message Flow</h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-navy-50">
              <p className="text-2xl font-bold text-navy-900">{stats?.messages ?? '—'}</p>
              <p className="text-xs text-navy-400 mt-1 uppercase tracking-wide">Total Messages</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-mint-50">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle2 className="w-5 h-5 text-mint-500" />
              </div>
              <p className="text-2xl font-bold text-mint-700">{stats?.processedMessages ?? '—'}</p>
              <p className="text-xs text-mint-600/70 mt-1 uppercase tracking-wide">Processed</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gold-50">
              <div className="flex items-center justify-center mb-1">
                <Clock className="w-5 h-5 text-gold-500" />
              </div>
              <p className="text-2xl font-bold text-gold-700">
                {stats ? stats.messages - stats.processedMessages : '—'}
              </p>
              <p className="text-xs text-gold-600/70 mt-1 uppercase tracking-wide">Pending</p>
            </div>
          </div>

          {messageProcessingRate !== null && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-navy-500 font-medium">Processing rate</span>
                <span className="text-navy-800 font-bold">{messageProcessingRate}%</span>
              </div>
              <div className="h-2.5 bg-navy-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-mint-400 to-mint-500 rounded-full transition-all duration-700"
                  style={{ width: `${messageProcessingRate}%` }}
                />
              </div>
            </div>
          )}

          <Link to="/messages" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-mint-600 hover:text-mint-700 transition-colors">
            View all messages
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      )}

      <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-navy-600" />
            <h2 className="text-lg font-bold text-navy-900">System Status</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-navy-50">
              <span className="text-sm text-navy-600 font-medium">API Gateway</span>
              <span className="badge bg-mint-50 text-mint-700">
                <span className="w-1.5 h-1.5 rounded-full bg-mint-500" />
                :8082
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-navy-50">
              <span className="text-sm text-navy-600 font-medium">Keycloak</span>
              <span className="badge bg-mint-50 text-mint-700">
                <span className="w-1.5 h-1.5 rounded-full bg-mint-500" />
                :8081
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-navy-50">
              <span className="text-sm text-navy-600 font-medium">IBM MQ</span>
              <span className="badge bg-mint-50 text-mint-700">
                <span className="w-1.5 h-1.5 rounded-full bg-mint-500" />
                :1414
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-navy-50">
              <span className="text-sm text-navy-600 font-medium">Database</span>
              <span className="badge bg-mint-50 text-mint-700">
                <span className="w-1.5 h-1.5 rounded-full bg-mint-500" />
                H2
              </span>
            </div>
          </div>
        </div>
    </div>
  );
}
