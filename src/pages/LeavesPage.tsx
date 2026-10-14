import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import {
  cancelLeaveRequest,
  createLeaveRequest,
  decideLeaveRequest,
  getAllLeaveRequests,
  getMyLeaveRequests,
  type LeaveDecision,
  type LeaveRequest,
  type LeaveStatus,
} from '@/api/leaves';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/permissions';
import { Modal } from '@/components/Modal';
import { StatusBadge } from '@/components/Badges';

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50';

const labelClass =
  'mb-2 block text-xs font-semibold text-slate-600';

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function StatusPill({ status }: { status: LeaveStatus }) {
  const styles: Record<LeaveStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200',
    CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof CalendarDays;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function LeavesPage() {
  const { user } = useAuth();
  const admin = isAdmin(user?.roles ?? []);

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [reason, setReason] = useState('');

  const [confirmTarget, setConfirmTarget] = useState<{
    request: LeaveRequest;
    action: 'CANCEL' | LeaveDecision;
  } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadRequests = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setPageError('');

    try {
      const data = admin
        ? await getAllLeaveRequests()
        : await getMyLeaveRequests();

      setRequests(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      setPageError(
        getErrorMessage(error, 'Unable to load leave requests. Please try again.'),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [admin]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((item) => item.status === 'PENDING').length,
      approved: requests.filter((item) => item.status === 'APPROVED').length,
      rejected: requests.filter(
        (item) => item.status === 'REJECTED' || item.status === 'CANCELLED',
      ).length,
    }),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === 'ALL' || request.status === statusFilter;

      const matchesSearch =
        !query ||
        request.requesterUsername.toLowerCase().includes(query) ||
        request.reason.toLowerCase().includes(query) ||
        String(request.id).includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  function openCreateForm() {
    setStartDate(today());
    setEndDate(today());
    setReason('');
    setActionError('');
    setSuccess('');
    setFormOpen(true);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError('');
    setSuccess('');

    if (startDate < today()) {
      setActionError('The start date cannot be in the past.');
      return;
    }

    if (endDate < startDate) {
      setActionError('The end date must be on or after the start date.');
      return;
    }

    if (!reason.trim()) {
      setActionError('Please enter a reason for your leave request.');
      return;
    }

    setSubmitting(true);

    try {
      await createLeaveRequest({
        startDate,
        endDate,
        reason: reason.trim(),
      });

      setFormOpen(false);
      setSuccess('Your leave request has been submitted successfully.');
      await loadRequests(true);
    } catch (error: unknown) {
      setActionError(
        getErrorMessage(error, 'Unable to submit the request. Please try again.'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecision() {
    if (!confirmTarget) return;

    const { request, action } = confirmTarget;
    setProcessingId(request.id);
    setActionError('');
    setSuccess('');

    try {
      if (action === 'CANCEL') {
        await cancelLeaveRequest(request.id);
        setSuccess('The leave request has been cancelled.');
      } else {
        await decideLeaveRequest(request.id, action);
        setSuccess(
          action === 'APPROVED'
            ? 'The leave request has been approved.'
            : 'The leave request has been rejected.',
        );
      }

      setConfirmTarget(null);
      await loadRequests(true);
    } catch (error: unknown) {
      setActionError(
        getErrorMessage(error, 'The action failed. Please refresh and try again.'),
      );
    } finally {
      setProcessingId(null);
    }
  }

  const confirmTitle =
    confirmTarget?.action === 'CANCEL'
      ? 'Cancel leave request'
      : confirmTarget?.action === 'APPROVED'
        ? 'Approve leave request'
        : 'Reject leave request';

  const confirmMessage =
    confirmTarget?.action === 'CANCEL'
      ? 'Are you sure you want to cancel this leave request?'
      : confirmTarget?.action === 'APPROVED'
        ? 'Confirm that you want to approve this leave request.'
        : 'Confirm that you want to reject this leave request.';

  return (
    <div className="min-h-full space-y-7 pb-8 text-slate-900">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Human Resources</span>
            <span>/</span>
            <span className="text-blue-600">Leave Management</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Leave Management
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {admin
              ? 'Review, approve and manage employee leave requests.'
              : 'Submit a leave request and keep track of its status.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadRequests(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {!admin && (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New request
            </button>
          )}
        </div>
      </header>

      {success && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span className="flex-1">{success}</span>
          <button type="button" onClick={() => setSuccess('')} aria-label="Dismiss success message">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span className="flex-1">{actionError}</span>
          <button type="button" onClick={() => setActionError('')} aria-label="Dismiss error message">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={admin ? 'All requests' : 'My requests'}
          value={stats.total}
          icon={FileText}
          tone="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Pending review"
          value={stats.pending}
          icon={Clock3}
          tone="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Rejected / cancelled"
          value={stats.rejected}
          icon={XCircle}
          tone="bg-rose-50 text-rose-600"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {admin ? 'Employee requests' : 'Request history'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredRequests.length} request{filteredRequests.length === 1 ? '' : 's'} displayed
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Search leave requests"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={admin ? 'Search employee or reason…' : 'Search requests…'}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64"
              />
            </div>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-slate-500">
            <RefreshCw className="mb-3 h-7 w-7 animate-spin text-blue-500" />
            <p className="text-sm">Loading leave requests…</p>
          </div>
        ) : pageError ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <XCircle className="mb-3 h-9 w-9 text-rose-500" />
            <p className="font-semibold text-slate-800">Could not load requests</p>
            <p className="mt-2 max-w-lg text-sm text-slate-500">{pageError}</p>
            <button
              type="button"
              onClick={() => void loadRequests()}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Try again
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <CalendarDays className="h-7 w-7" />
            </div>
            <p className="font-semibold text-slate-800">No leave requests found</p>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {requests.length === 0
                ? admin
                  ? 'Employee leave requests will appear here.'
                  : 'Your requests will appear here after you submit one.'
                : 'Try changing your search or status filter.'}
            </p>
            {!admin && requests.length === 0 && (
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Submit a request
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Request</th>
                  {admin && <th className="px-5 py-4">Employee</th>}
                  <th className="px-5 py-4">Leave period</th>
                  <th className="px-5 py-4">Reason</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">#{request.id}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Submitted {formatDate(request.createdAt)}
                      </p>
                    </td>

                    {admin && (
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {request.requesterUsername}
                        </p>
                      </td>
                    )}

                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap text-sm font-medium text-slate-800">
                        {formatDate(request.startDate)}
                      </p>
                      <p className="mt-1 whitespace-nowrap text-xs text-slate-500">
                        to {formatDate(request.endDate)}
                      </p>
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      <p className="line-clamp-2 text-sm text-slate-600" title={request.reason}>
                        {request.reason}
                      </p>
                      {request.decisionBy && (
                        <p className="mt-1 text-xs text-slate-400">
                          Decision by {request.decisionBy}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <StatusPill status={request.status} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {admin && request.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setConfirmTarget({ request, action: 'APPROVED' })}
                              disabled={processingId === request.id}
                              title="Approve request"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmTarget({ request, action: 'REJECTED' })}
                              disabled={processingId === request.id}
                              title="Reject request"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </>
                        )}

                        {!admin && request.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ request, action: 'CANCEL' })}
                            disabled={processingId === request.id}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}

                        {request.status !== 'PENDING' && (
                          <span className="px-2 py-2 text-xs text-slate-400">No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {admin && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Administrator view</p>
            <p className="mt-1 text-sm text-blue-800/80">
              Only pending requests can be approved or rejected. The backend enforces the final authorization and decision rules.
            </p>
          </div>
        </div>
      )}

      <Modal
        open={formOpen}
        title="Submit a leave request"
        onClose={() => {
          if (!submitting) setFormOpen(false);
        }}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="leave-request-form"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
          </>
        }
      >
        <form id="leave-request-form" onSubmit={handleCreate} className="space-y-5">
          <p className="text-sm leading-6 text-slate-500">
            Enter the period and reason for your leave. Your request will be sent for review.
          </p>

          {actionError && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {actionError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="leave-start-date" className={labelClass}>Start date</label>
              <input
                id="leave-start-date"
                type="date"
                min={today()}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
                disabled={submitting}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="leave-end-date" className={labelClass}>End date</label>
              <input
                id="leave-end-date"
                type="date"
                min={startDate || today()}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
                disabled={submitting}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="leave-reason" className={labelClass}>Reason for leave</label>
            <textarea
              id="leave-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Briefly explain the reason for your request…"
              rows={4}
              maxLength={1000}
              required
              disabled={submitting}
              className={`${fieldClass} resize-y`}
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {reason.length}/1000
            </p>
          </div>
        </form>
      </Modal>

      <Modal
        open={confirmTarget !== null}
        title={confirmTitle}
        onClose={() => {
          if (processingId === null) setConfirmTarget(null);
        }}
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmTarget(null)}
              disabled={processingId !== null}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Keep request
            </button>
            <button
              type="button"
              onClick={() => void handleDecision()}
              disabled={processingId !== null}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                confirmTarget?.action === 'APPROVED'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {processingId !== null
                ? 'Processing…'
                : confirmTarget?.action === 'CANCEL'
                  ? 'Confirm cancellation'
                  : confirmTarget?.action === 'APPROVED'
                    ? 'Approve request'
                    : 'Reject request'}
            </button>
          </>
        }
      >
        <p className="text-sm leading-6 text-slate-600">{confirmMessage}</p>
        {confirmTarget && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">
              Request #{confirmTarget.request.id}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {formatDate(confirmTarget.request.startDate)} – {formatDate(confirmTarget.request.endDate)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {confirmTarget.request.reason}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
