import { Loader2, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function LoginPage() {
  const { status, login } = useAuth();

  const handleLogin = () => {
    login();
  };

  if (status === 'initializing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <Loader2 className="w-8 h-8 animate-spin text-mint-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-navy-950">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-mint-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-mint-500/3 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-mint-500 flex items-center justify-center">
              <span className="text-navy-950 font-bold text-2xl">M</span>
            </div>
            <div>
              <p className="font-bold text-white text-xl">Meridian</p>
              <p className="text-navy-400 text-sm">BankApp Console</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Banking operations,<br />unified and secure.
          </h1>
          <p className="text-navy-300 text-lg max-w-md">
            Manage employees, departments, missions, partners, and IBM MQ messaging — all through a single authenticated gateway.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div>
              <p className="text-mint-400 text-2xl font-bold">6</p>
              <p className="text-navy-400 text-xs uppercase tracking-wide">Microservices</p>
            </div>
            <div className="w-px h-10 bg-navy-700" />
            <div>
              <p className="text-mint-400 text-2xl font-bold">JWT</p>
              <p className="text-navy-400 text-xs uppercase tracking-wide">Secured</p>
            </div>
            <div className="w-px h-10 bg-navy-700" />
            <div>
              <p className="text-mint-400 text-2xl font-bold">MQ</p>
              <p className="text-navy-400 text-xs uppercase tracking-wide">Integrated</p>
            </div>
          </div>
        </div>

        <div className="relative text-navy-500 text-xs">
          <p>Spring Boot Microservices · Keycloak · IBM MQ · H2 Database</p>
        </div>
      </div>

      {/* Right — login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-12 justify-center">
            <div className="w-10 h-10 rounded-xl bg-mint-500 flex items-center justify-center">
              <span className="text-navy-950 font-bold text-xl">M</span>
            </div>
            <div>
              <p className="font-bold text-white text-lg">Meridian</p>
              <p className="text-navy-400 text-xs">BankApp Console</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-navy-800 items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-mint-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-navy-400 text-sm mt-2">Sign in with your Keycloak account to continue</p>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-3 mb-5 p-3 bg-navy-50 rounded-lg">
              <Lock className="w-5 h-5 text-navy-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-navy-800">Secure authentication</p>
                <p className="text-xs text-navy-400 mt-0.5">
                  You will be redirected to Keycloak to enter your credentials. Your password is never seen by this application.
                </p>
              </div>
            </div>

            <button onClick={handleLogin} className="btn-primary w-full justify-center text-base py-3">
              <ShieldCheck className="w-5 h-5" />
              Sign in with Keycloak
            </button>

            <p className="text-center text-xs text-navy-400 mt-4">
              Realm: <span className="font-mono text-navy-600">spring-app</span> · Client: <span className="font-mono text-navy-600">spring-boot-client</span>
            </p>
          </div>

          <p className="text-center text-navy-500 text-xs mt-8">
            Meridian BankApp Console · Protected by Keycloak JWT
          </p>
        </div>
      </div>
    </div>
  );
}
