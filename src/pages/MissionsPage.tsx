import { useEffect, useState, useCallback } from 'react';
import { Target, Edit2, Trash2, MapPin, Calendar, User, Eye } from 'lucide-react';
import { getMissions, createMission, updateMission, deleteMission, getMissionEmployee } from '@/api/missions';
import { getEmployees } from '@/api/employees';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ApiStateHandler } from '@/components/ApiState';
import { StatusBadge } from '@/components/Badges';
import { useAuth } from '@/hooks/useAuth';
import type { Mission, Employee } from '@/types';

export function MissionsPage() {
  const { login } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Mission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mission | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [viewEmployee, setViewEmployee] = useState<{ mission: Mission; employee: Employee | null; loading: boolean } | null>(null);
  const [form, setForm] = useState<Partial<Mission>>({ title: '', description: '', status: 'PENDING', priority: 'MEDIUM', employeeId: undefined, startDate: '', endDate: '', location: '', budget: undefined });

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getMissions(), getEmployees()])
      .then(([missionData, empData]) => {
        setMissions(Array.isArray(missionData) ? missionData : []);
        setEmployees(Array.isArray(empData) ? empData : []);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = missions.filter((m) => {
    const q = search.toLowerCase();
    return m.title?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q) || m.location?.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', status: 'PENDING', priority: 'MEDIUM', employeeId: undefined, startDate: '', endDate: '', location: '', budget: undefined });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (m: Mission) => {
    setEditing(m);
    setForm({ ...m });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      if (editing) {
        const updated = await updateMission(editing.id, form);
        setMissions((prev) => prev.map((m) => (m.id === editing.id ? updated : m)));
      } else {
        const created = await createMission(form);
        setMissions((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save mission');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteMission(deleteTarget.id);
      setMissions((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // noop
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewEmployee = async (m: Mission) => {
    setViewEmployee({ mission: m, employee: null, loading: true });
    try {
      const emp = await getMissionEmployee(m.id);
      setViewEmployee({ mission: m, employee: emp, loading: false });
    } catch {
      setViewEmployee({ mission: m, employee: null, loading: false });
    }
  };

  const employeeName = (id?: number) => employees.find((e) => e.id === id)?.fullName ?? '—';

  return (
    <div>
      <PageHeader
        title="Missions"
        subtitle="Operational tasks and assignments"
        onAdd={openCreate}
        addLabel="Add Mission"
        search={search}
        onSearchChange={setSearch}
      />

      <ApiStateHandler
        loading={loading}
        error={error}
        empty={!loading && filtered.length === 0}
        hasData={filtered.length > 0}
        onRetry={load}
        onLogin={login}
        emptyTitle={search ? "No matching missions" : "No missions yet"}
        emptyMessage={search ? "Try a different search term." : "Create your first mission to assign tasks."}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="card p-5 hover:shadow-card-hover transition-all duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-gold-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-900">{m.title}</h3>
                    <p className="text-xs text-navy-400">ID: {m.id}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="mr-2"><StatusBadge status={m.status} /></div>
                  <button onClick={() => openEdit(m)} className="p-2 text-navy-400 hover:bg-navy-100 hover:text-navy-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(m)} className="p-2 text-red-300 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {m.description && <p className="text-sm text-navy-500 mb-4 line-clamp-2">{m.description}</p>}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-navy-500">
                  <User className="w-4 h-4 text-navy-300" />
                  <button onClick={() => handleViewEmployee(m)} className="hover:text-mint-600 transition-colors">
                    {employeeName(m.employeeId)}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-navy-500">
                  <MapPin className="w-4 h-4 text-navy-300" />
                  <span>{m.location || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-navy-500">
                  <Calendar className="w-4 h-4 text-navy-300" />
                  <span>{m.startDate || '—'}{m.endDate ? ` → ${m.endDate}` : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-navy-500">
                  <span className="text-xs">Priority:</span>
                  <StatusBadge status={m.priority} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ApiStateHandler>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Mission' : 'Add Mission'}
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={formLoading}>Cancel</button>
            <button onClick={handleSubmit} className="btn-primary" disabled={formLoading || !form.title}>
              {formLoading ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>}
          <div>
            <label className="label-field">Title *</label>
            <input className="input-field" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label-field">Description</label>
            <textarea className="input-field min-h-[80px] resize-y" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Assigned Employee</label>
              <select className="input-field" value={form.employeeId ?? ''} onChange={(e) => setForm({ ...form, employeeId: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">—</option>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Location</label>
              <input className="input-field" value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Start Date</label>
              <input type="date" className="input-field" value={form.startDate ?? ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label-field">End Date</label>
              <input type="date" className="input-field" value={form.endDate ?? ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-field">Status</label>
              <select className="input-field" value={form.status ?? 'PENDING'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label-field">Priority</label>
              <select className="input-field" value={form.priority ?? 'MEDIUM'} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="label-field">Budget</label>
              <input type="number" className="input-field" value={form.budget ?? ''} onChange={(e) => setForm({ ...form, budget: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Mission"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* View assigned employee */}
      <Modal
        open={!!viewEmployee}
        title="Assigned Employee"
        onClose={() => setViewEmployee(null)}
        size="sm"
      >
        {viewEmployee?.loading ? (
          <p className="text-sm text-navy-400">Loading employee…</p>
        ) : viewEmployee?.employee ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-navy-900 text-mint-400 flex items-center justify-center font-bold">
                {viewEmployee.employee.fullName?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-navy-900">{viewEmployee.employee.fullName}</p>
                <p className="text-sm text-navy-400">{viewEmployee.employee.position || '—'}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {viewEmployee.employee.email && <p className="text-navy-600">Email: {viewEmployee.employee.email}</p>}
              {viewEmployee.employee.phone && <p className="text-navy-600">Phone: {viewEmployee.employee.phone}</p>}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 text-navy-400">
            <Eye className="w-8 h-8 mb-2 text-navy-300" />
            <p className="text-sm">No employee assigned to this mission.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
