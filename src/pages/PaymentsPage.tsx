import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  CreditCard,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import {
  createPayment,
  getAccountByNumber,
  getMyAccounts,
  getMyPayments,
  type Account,
  type PaymentHistoryItem,
} from '@/api/payments';

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50';

const labelClass =
  'mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500';

function formatMoney(value: number | string | undefined, currency = 'TND') {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function maskAccount(value: string | undefined) {
  if (!value) return 'Select an account';
  return `${value.slice(0, 5)} •••• •••• ${value.slice(-4)}`;
}

export function PaymentsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationDigits, setDestinationDigits] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState('');

  async function loadPayments() {
    setPaymentsLoading(true);
    setPaymentsError('');

    try {
      const data = await getMyPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch {
      setPaymentsError(
        'We could not load your transaction history. Please try again.',
      );
    } finally {
      setPaymentsLoading(false);
    }
  }

  async function loadAccounts() {
    setAccountsLoading(true);
    setAccountsError('');

    try {
      const data = await getMyAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch {
      setAccountsError(
        'We could not load your accounts. Please refresh the page and try again.',
      );
    } finally {
      setAccountsLoading(false);
    }
  }

  useEffect(() => {
    void loadAccounts();
    void loadPayments();
  }, []);

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.status === 'ACTIVE'),
    [accounts],
  );

  const paymentStats = useMemo(() => {
    const completedPayments = payments.filter(
      (payment) => (payment.status || '').toUpperCase() === 'COMPLETED',
    );

    const totalsByCurrency = completedPayments.reduce<Record<string, number>>(
      (totals, payment) => {
        const paymentCurrency = payment.currency || 'TND';
        const paymentAmount = Number(payment.amount);

        if (Number.isFinite(paymentAmount)) {
          totals[paymentCurrency] = (totals[paymentCurrency] || 0) + paymentAmount;
        }

        return totals;
      },
      {},
    );

    return {
      transactionCount: payments.length,
      completedCount: completedPayments.length,
      totalsByCurrency,
    };
  }, [payments]);

  const sourceAccount = activeAccounts.find(
    (account) => account.id === Number(sourceAccountId),
  );

  const currency = sourceAccount?.currency || 'TND';
  const numericAmount = Number(amount);
  const validAmount =
    amount.trim() !== '' &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    /^\d+(\.\d{1,2})?$/.test(amount);

  const validDestination = /^\d{22}$/.test(destinationDigits);
  const destinationNumber = `TN${destinationDigits}`;

  function handleDestinationChange(value: string) {
    const normalized = value
      .trim()
      .replace(/^TN/i, '')
      .replace(/\D/g, '')
      .slice(0, 22);

    setDestinationDigits(normalized);
    setError('');
    setSuccess('');
    setPaymentReference('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setPaymentReference('');

    if (!sourceAccount) {
      setError('Please select an active source account.');
      return;
    }

    if (!validDestination) {
      setError('Enter the 22 digits of the recipient account number.');
      return;
    }

    if (sourceAccount.accountNumber === destinationNumber) {
      setError('The source and recipient accounts must be different.');
      return;
    }

    if (!validAmount) {
      setError('Enter a valid amount greater than zero, with up to two decimal places.');
      return;
    }

    if (numericAmount > Number(sourceAccount.balance)) {
      setError('The transfer amount exceeds the displayed available balance.');
      return;
    }

    setLoading(true);

    try {
      const recipient = await getAccountByNumber(destinationNumber);

      if (recipient.id === sourceAccount.id) {
        throw new Error('The source and recipient accounts must be different.');
      }

      if (recipient.currency !== sourceAccount.currency) {
        throw new Error('The source and recipient accounts must use the same currency.');
      }

      const payment = await createPayment({
        sourceAccountId: sourceAccount.id,
        destinationAccountId: recipient.id,
        amount: numericAmount,
        currency: sourceAccount.currency,
      });

      if (payment.status !== 'COMPLETED') {
        throw new Error(
          `The transfer has not been confirmed. Current status: ${payment.status || 'Unknown'}.`,
        );
      }

      setPaymentReference(payment.reference || '');
      setSuccess('Your transfer has been completed successfully.');
      setDestinationDigits('');
      setAmount('');
      await Promise.all([loadAccounts(), loadPayments()]);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'The transfer could not be completed. Please check the details and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full space-y-7 pb-8 text-slate-900">
      {/* Page heading */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Banking</span>
            <span>/</span>
            <span className="text-blue-600">Payments</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <ArrowLeftRight size={23} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Payments
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Move money securely, wherever life takes you.
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Secure banking session
        </div>
      </header>

      {/* Premium hero banner */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#101c3a] via-[#173b76] to-[#2563eb] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-24 -z-10 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-1 -top-14 -z-10 h-52 w-52 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-[-90px] right-[24%] -z-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100">
              <Sparkles size={13} />
              Simple. Fast. Secure.
            </div>

            <h2 className="max-w-lg text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              Your money, moving
              <span className="block text-cyan-300">in the right direction.</span>
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-blue-100/80">
              Send a payment with confidence. Review your details before you
              submit and keep track of your confirmation.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs text-blue-100/90">
              <span className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-cyan-300" />
                Protected transactions
              </span>
              <span className="flex items-center gap-2">
                <Clock3 size={15} className="text-cyan-300" />
                Fast processing
              </span>
            </div>
          </div>

          <div className="hidden w-64 rounded-2xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-sm sm:block">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <CreditCard size={20} />
              </div>
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                Protected
              </span>
            </div>
            <p className="mt-6 text-xs text-blue-100/70">Transfer currency</p>
            <p className="mt-1 text-2xl font-semibold">{currency}</p>
            <div className="mt-4 h-px bg-white/15" />
            <p className="mt-3 text-[11px] leading-5 text-blue-100/70">
              Your account currency is selected automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Feedback banners */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <CircleAlert size={19} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">We couldn't complete the request</p>
            <p className="mt-1 leading-5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold">{success}</p>
            {paymentReference && (
              <p className="mt-1 break-all text-xs">
                Confirmation reference: <span className="font-bold">{paymentReference}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,0.8fr)]">
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                Payment details
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Make a transfer
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Complete the details below to prepare your payment.
              </p>
            </div>
            <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:flex">
              <ArrowUpRight size={22} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7 p-5 sm:p-7">
            {/* Source account */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  1
                </span>
                <h3 className="text-sm font-bold text-slate-800">Choose source account</h3>
              </div>

              <label htmlFor="sourceAccountId" className={labelClass}>
                Pay from
              </label>

              <div className="relative">
                <select
                  id="sourceAccountId"
                  className={`${fieldClass} appearance-none pr-11`}
                  required
                  value={sourceAccountId}
                  onChange={(event) => {
                    setSourceAccountId(event.target.value);
                    setError('');
                    setSuccess('');
                    setPaymentReference('');
                  }}
                  disabled={accountsLoading || activeAccounts.length === 0}
                >
                  <option value="">
                    {accountsLoading
                      ? 'Loading your accounts...'
                      : activeAccounts.length === 0
                        ? 'No active accounts available'
                        : 'Select an account'}
                  </option>
                  {activeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {maskAccount(account.accountNumber)} — {formatMoney(account.balance, account.currency)}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              {accountsError && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3.5 py-3 text-xs text-amber-800">
                  <span>{accountsError}</span>
                  <button
                    type="button"
                    onClick={() => void loadAccounts()}
                    className="inline-flex shrink-0 items-center gap-1.5 font-bold"
                  >
                    <RefreshCw size={13} />
                    Retry
                  </button>
                </div>
              )}

              {sourceAccount && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                      <Wallet size={19} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500">Available account</p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {maskAccount(sourceAccount.accountNumber)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Balance
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatMoney(sourceAccount.balance, sourceAccount.currency)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Recipient account */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  2
                </span>
                <h3 className="text-sm font-bold text-slate-800">Recipient details</h3>
              </div>

              <label htmlFor="destinationDigits" className={labelClass}>
                Recipient account number
              </label>

              <div
                className={`flex overflow-hidden rounded-xl border bg-white transition focus-within:ring-4 ${
                  destinationDigits.length > 0 && !validDestination
                    ? 'border-amber-300 focus-within:ring-amber-500/10'
                    : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-500/10'
                }`}
              >
                <span className="flex items-center border-r border-slate-200 bg-slate-50 px-4 text-sm font-bold tracking-wide text-blue-700">
                  TN
                </span>
                <input
                  id="destinationDigits"
                  className="min-w-0 flex-1 px-4 py-3.5 text-sm tracking-[0.08em] text-slate-900 outline-none placeholder:tracking-normal placeholder:text-slate-400"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  maxLength={24}
                  value={destinationDigits}
                  onChange={(event) => handleDestinationChange(event.target.value)}
                  placeholder="Enter 22 account digits"
                  aria-describedby="recipient-help recipient-count"
                />
                {validDestination && (
                  <div className="flex items-center pr-4 text-emerald-600">
                    <CheckCircle2 size={18} />
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <p id="recipient-help" className="text-xs leading-5 text-slate-500">
                  Enter the 22 digits. The TN prefix is added automatically.
                </p>
                <span
                  id="recipient-count"
                  className={`shrink-0 text-xs font-semibold ${
                    validDestination ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {destinationDigits.length}/22
                </span>
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  3
                </span>
                <h3 className="text-sm font-bold text-slate-800">Transfer amount</h3>
              </div>

              <label htmlFor="amount" className={labelClass}>
                Amount to send
              </label>

              <div className="relative">
                <input
                  id="amount"
                  className={`${fieldClass} py-4 pr-20 text-lg font-semibold`}
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setError('');
                    setSuccess('');
                    setPaymentReference('');
                  }}
                  placeholder="0.00"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">
                  {currency}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Use up to two decimal places. Your account currency is applied automatically.
              </p>
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                <LockKeyhole size={17} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Secure transfer</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  The server validates account ownership, account status, currency and available funds.
                  Always verify the recipient details before submitting.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || accountsLoading || !sourceAccount || !validDestination || !validAmount}
              className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  Processing payment...
                </>
              ) : (
                <>
                  <LockKeyhole size={17} />
                  Review and send payment
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            <p className="text-center text-[11px] leading-5 text-slate-400">
              By continuing, you confirm that the payment details are correct.
            </p>
          </form>
        </section>

        {/* Transfer summary */}
        <aside className="space-y-5">
          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                At a glance
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Transfer summary</h2>
            </div>

            <div className="p-5">
              <div className="rounded-2xl bg-gradient-to-br from-[#101c3a] to-[#2458ad] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                    <ArrowUpRight size={19} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-100">
                    Outgoing payment
                  </span>
                </div>
                <p className="mt-6 text-xs text-blue-100/75">You are sending</p>
                <p className="mt-1 break-words text-3xl font-bold tracking-tight">
                  {formatMoney(validAmount ? numericAmount : 0, currency)}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-blue-100/80">
                  <ShieldCheck size={14} />
                  Secure account-to-account transfer
                </div>
              </div>

              <div className="relative my-5 space-y-5">
                <div className="absolute bottom-7 left-[17px] top-7 border-l border-dashed border-slate-300" />

                <div className="relative flex items-start gap-3">
                  <div className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                    <ArrowUpRight size={17} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      From account
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                      {sourceAccount ? maskAccount(sourceAccount.accountNumber) : 'Not selected'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {sourceAccount
                        ? formatMoney(sourceAccount.balance, sourceAccount.currency)
                        : 'Choose your source account'}
                    </p>
                  </div>
                </div>

                <div className="relative flex items-start gap-3">
                  <div className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                    <ArrowDownLeft size={17} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      To recipient
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                      {destinationDigits ? maskAccount(destinationNumber) : 'Recipient not entered'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {validDestination ? 'Account number format looks correct' : 'Waiting for account details'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-4">
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-500">Transfer amount</span>
                  <span className="font-semibold text-slate-800">
                    {formatMoney(validAmount ? numericAmount : 0, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-500">Currency</span>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    {currency}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-3">
                  <span className="text-sm font-bold text-slate-700">Total to send</span>
                  <span className="text-base font-bold text-blue-700">
                    {formatMoney(validAmount ? numericAmount : 0, currency)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Your security matters</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Never share your login credentials or authentication codes. Check the recipient
                  account before confirming a payment.
                </p>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-center gap-2 px-3 text-[11px] text-slate-400">
            <LockKeyhole size={13} />
            <span>BankApp secure payment experience</span>
          </div>
        </aside>
      </div>

      {/* Transaction history */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
              Your activity
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Transaction History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review the transfers associated with your account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadPayments()}
            disabled={paymentsLoading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw size={15} className={paymentsLoading ? 'animate-spin' : ''} />
            Refresh history
          </button>
        </div>

        <div className="p-5 sm:p-7">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total transactions
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ArrowLeftRight size={19} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                {paymentStats.transactionCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Transactions in your history
              </p>
            </article>

            <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Successful payments
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={19} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                {paymentStats.completedCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Completed transfers
              </p>
            </article>

            <article className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total transferred
                </p>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <Wallet size={19} />
                </span>
              </div>
              <div className="mt-4 space-y-1">
                {Object.entries(paymentStats.totalsByCurrency).length > 0 ? (
                  Object.entries(paymentStats.totalsByCurrency).map(([code, total]) => (
                    <p key={code} className="text-xl font-bold tracking-tight text-slate-950">
                      {formatMoney(total, code)}
                    </p>
                  ))
                ) : (
                  <p className="text-2xl font-bold tracking-tight text-slate-950">
                    {formatMoney(0, 'TND')}
                  </p>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Completed transfers only
              </p>
            </article>
          </div>

          {paymentsError ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
              <p>{paymentsError}</p>
              <button
                type="button"
                onClick={() => void loadPayments()}
                className="font-bold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          ) : paymentsLoading && payments.length === 0 ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50 p-10 text-sm text-slate-500">
              <RefreshCw size={17} className="animate-spin" />
              Loading your transactions...
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ArrowLeftRight size={22} />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900">
                No transactions yet
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Completed transfers will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    <th className="px-3 py-3">Transaction</th>
                    <th className="px-3 py-3">Accounts</th>
                    <th className="px-3 py-3 text-right">Amount</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => {
                    const status = (payment.status || 'UNKNOWN').toUpperCase();
                    const statusClass =
                      status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
                        : status === 'FAILED'
                          ? 'bg-red-50 text-red-700 ring-red-600/15'
                          : 'bg-amber-50 text-amber-700 ring-amber-600/15';

                    const formattedDate = payment.createdAt
                      ? new Date(payment.createdAt).toLocaleString()
                      : '—';

                    return (
                      <tr key={payment.id} className="transition hover:bg-slate-50/70">
                        <td className="px-3 py-4">
                          <p className="text-sm font-semibold text-slate-900">
                            Transfer #{payment.id}
                          </p>
                          <p className="mt-1 max-w-[190px] break-all text-xs text-slate-500">
                            {payment.reference || 'No reference'}
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="text-xs text-slate-500">From: #{payment.sourceAccountId}</p>
                          <p className="mt-1 text-xs text-slate-500">To: #{payment.destinationAccountId}</p>
                        </td>
                        <td className="px-3 py-4 text-right">
                          <span className="whitespace-nowrap text-sm font-bold text-slate-900">
                            {formatMoney(payment.amount, payment.currency || 'TND')}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${statusClass}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-xs text-slate-500">
                          {formattedDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!paymentsError && payments.length > 0 && (
            <p className="mt-4 text-xs text-slate-400">
              Showing {payments.length} transaction{payments.length === 1 ? '' : 's'}.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
