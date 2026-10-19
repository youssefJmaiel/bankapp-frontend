import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react';
import {
  createManagedAccount,
  getAccountsByOwner,
  getKeycloakUsers,
  type KeycloakUser,
  type ManagedAccount,
} from '@/api/accounts';
import { ApiError } from '@/api/client';
import { Modal } from '@/components/Modal';

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50';

const labelClass =
  'mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500';

function formatMoney(value: number | string, currency: string) {
  const amount = Number(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: /^[A-Z]{3}$/.test(currency) ? currency : 'TND',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function explainError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 403) {
    return 'Access denied: this action is restricted to administrators.';
  }
  return error instanceof Error && error.message
    ? error.message
    : fallback;
}

function displayName(user: KeycloakUser) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    || user.username;
}

export function AccountManagementPage() {
  const [users, setUsers] = useState<KeycloakUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const [currency, setCurrency] = useState('TND');
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedUser = users.find((user) => user.id === selectedId);

  async function loadUsers() {
    setUsersLoading(true);
    setUsersError('');
    try {
      const result = await getKeycloakUsers();
      setUsers(Array.isArray(result) ? result : []);
    } catch (error: unknown) {
      setUsersError(explainError(error, 'Unable to load Keycloak users.'));
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadAccounts(ownerId: string) {
    setAccountsLoading(true);
    setAccountsError('');
    try {
      const result = await getAccountsByOwner(ownerId);
      setAccounts(Array.isArray(result) ? result : []);
    } catch (error: unknown) {
      setAccounts([]);
      setAccountsError(explainError(error, "Unable to load this user's accounts."));
    } finally {
      setAccountsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    setAccounts([]);
    setAccountsError('');
    setSuccess('');
    if (users.some((user) => user.id === selectedId)) {
      void loadAccounts(selectedId);
    }
  }, [selectedId, users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users
      .filter((user) => !query || [
        user.username,
        user.email,
        user.firstName,
        user.lastName,
        user.id,
      ].some((value) => (value || '').toLowerCase().includes(query)))
      .sort((a, b) => a.username.localeCompare(b.username));
  }, [users, search]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser || !selectedUser.enabled || creating) return;

    setCreating(true);
    setCreateError('');
    setSuccess('');

    try {
      await createManagedAccount({
        // ownerId must be the actual Keycloak user ID.
        ownerId: selectedUser.id,
        currency,
      });
      setModalOpen(false);
      setSuccess(`The ${currency} account was created for ${selectedUser.username}.`);
      await loadAccounts(selectedUser.id);
    } catch (error: unknown) {
      setCreateError(explainError(error, 'Account creation failed.'));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-full space-y-7 pb-8 text-slate-900">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Administration</span>
            <span>/</span>
            <span className="text-blue-600">Bank Accounts</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Bank account management
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Select an existing Keycloak user to view their accounts or open a new one.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          Administrator access
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm font-medium text-slate-500">
            Keycloak users <UserRound className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 text-3xl font-bold">{usersLoading ? '—' : users.length}</p>
          <p className="mt-1 text-xs text-slate-400">Users available in the list</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm font-medium text-slate-500">
            Selected user's accounts <Wallet className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 text-3xl font-bold">
            {selectedUser && !accountsLoading && !accountsError ? accounts.length : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-400">Accounts linked to the selected identity</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm font-medium text-slate-500">
            Opening balance <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 text-3xl font-bold">0.00</p>
          <p className="mt-1 text-xs text-slate-400">Every new account starts with a zero balance</p>
        </div>
      </section>

      {usersError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span className="flex-1">{usersError}</span>
          <button onClick={() => void loadUsers()} className="font-semibold underline">Retry</button>
        </div>
      )}
      {success && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-900">Select a user</h2>
            <p className="mt-1 text-sm text-slate-500">Choose the account owner from Keycloak.</p>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Search Keycloak users"
                className={`${fieldClass} pl-9`}
                placeholder="Name, username, or email…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[540px] overflow-y-auto p-2">
            {usersLoading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin" /> Loading…
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                {users.length ? 'No users match your search.' : 'No users returned.'}
              </p>
            ) : filteredUsers.map((user) => {
              const selected = user.id === selectedId;
              return (
                <button
                  key={user.id}
                  type="button"
                  disabled={!user.enabled}
                  onClick={() => setSelectedId(user.id)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                    selected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                  } ${!user.enabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                    selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {(user.username || '?').slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{displayName(user)}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">@{user.username}</span>
                    <span className="mt-1 block truncate text-xs text-slate-400">{user.email || 'No email provided'}</span>
                    {!user.enabled && <span className="mt-1 block text-xs font-semibold text-amber-700">Keycloak account disabled</span>}
                  </span>
                  {selected && <ChevronRight className="h-4 w-4 shrink-0 text-blue-600" />}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            <span>Users: {filteredUsers.length}</span>
            <button
              type="button"
              onClick={() => void loadUsers()}
              disabled={usersLoading}
              className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-blue-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-slate-900">Bank accounts</h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedUser ? `Accounts for ${selectedUser.username}` : 'Select a user.'}
              </p>
            </div>
            <button
              type="button"
              disabled={!selectedUser || !selectedUser.enabled || accountsLoading || !!accountsError}
              onClick={() => { setCreateError(''); setModalOpen(true); }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" /> Open account
            </button>
          </div>

          {!selectedUser ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <CreditCard className="h-8 w-8 text-slate-400" />
              <h3 className="mt-4 font-semibold text-slate-800">No user selected</h3>
              <p className="mt-1 max-w-xs text-sm text-slate-500">Choose a user from the list.</p>
            </div>
          ) : accountsLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin" /> Loading accounts…
            </div>
          ) : accountsError ? (
            <div role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>{accountsError}</p>
              <button onClick={() => void loadAccounts(selectedUser.id)} className="mt-2 font-semibold underline">Retry</button>
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <Wallet className="h-8 w-8 text-blue-600" />
              <h3 className="mt-4 font-semibold text-slate-800">No bank accounts</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                This user does not have any accounts linked to their Keycloak identity yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {accounts.map((account) => (
                <div key={account.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-xl bg-slate-100 p-3"><CreditCard className="h-5 w-5 text-slate-600" /></div>
                    <div className="min-w-0">
                      <p className="break-all font-mono text-sm font-semibold text-slate-900">{account.accountNumber}</p>
                      <p className="mt-1 text-xs text-slate-500">ID : {account.id} · {account.currency}</p>
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        account.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>{account.status || 'INCONNU'}</span>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Balance</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{formatMoney(account.balance, account.currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Access permissions and account ownership are enforced by the backend.
          </div>
        </section>
      </div>

      <Modal
        open={modalOpen}
        title="Open a bank account"
        onClose={() => { if (!creating) setModalOpen(false); }}
        size="md"
        footer={
          <>
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              onClick={() => setModalOpen(false)}
              disabled={creating}
            >Cancel</button>
            <button
              type="submit"
              form="open-bank-account-form"
              disabled={creating || !selectedUser?.enabled}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {creating ? 'Creating…' : 'Confirm creation'}
            </button>
          </>
        }
      >
        {selectedUser && (
          <form id="open-bank-account-form" onSubmit={handleCreate} className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account owner</p>
              <p className="mt-1 font-semibold text-slate-900">{displayName(selectedUser)}</p>
              <p className="mt-0.5 text-sm text-slate-500">@{selectedUser.username}</p>
              <p className="mt-2 break-all font-mono text-[11px] text-slate-400">Keycloak ID: {selectedUser.id}</p>
            </div>

            {accounts.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                This user already has {accounts.length} account(s). Review the list before continuing.
              </div>
            )}

            <div>
              <label htmlFor="account-currency" className={labelClass}>Account currency</label>
              <select
                id="account-currency"
                className={fieldClass}
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                disabled={creating}
              >
                <option value="TND">TND — Tunisian dinar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — US dollar</option>
              </select>
              <p className="mt-2 text-xs text-slate-500">The new account will be created with a zero balance.</p>
            </div>

            {createError && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{createError}
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}
