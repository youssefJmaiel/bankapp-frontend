import { useEffect, useState, useCallback } from 'react';
import { Users, Phone, Briefcase, Edit2, Trash2 } from 'lucide-react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/api/employees';
import { getDepartments } from '@/api/departments';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ApiStateHandler } from '@/components/ApiState';
import { useAuth } from '@/hooks/useAuth';
import type { Employee, Department } from '@/types';
import { isAdmin } from '@/lib/permissions';

export function EmployeesPage() {
  const { login, user } = useAuth();
  const admin = isAdmin(user?.roles ?? []);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<Employee>>({
    firstName: '',
  lastName: '',
    email: '',
    phone: '',
    position: '',
    departmentId: undefined,
    hireDate: '',
    salary: undefined,
    status: 'ACTIVE',
  });

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getEmployees(), getDepartments()])
      .then(([empData, deptData]) => {
        setEmployees(Array.isArray(empData) ? empData : []);
        setDepartments(Array.isArray(deptData) ? deptData : []);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      `${e.firstName ?? ''} ${e.lastName ?? ''}`.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.position?.toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ firstName: '', lastName: '', email: '', phone: '', position: '', departmentId: undefined, hireDate: '', salary: undefined, status: 'ACTIVE' });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({ ...emp });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      if (editing) {
        const updated = await updateEmployee(editing.id, form);
        setEmployees((prev) => prev.map((e) => (e.id === editing.id ? updated : e)));
      } else {
        const employeeData: Partial<Employee> = {
        ...form,
        firstName: form.firstName?.trim() ?? '',
        lastName: form.lastName?.trim() ?? '',
        email: form.email?.trim() ?? '',
      };
      const created = await createEmployee(employeeData);
        setEmployees((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteEmployee(deleteTarget.id);
      setEmployees((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // error shown via state
    } finally {
      setDeleteLoading(false);
    }
  };

  const deptName = (id?: number) => departments.find((d) => d.id === id)?.name ?? '—';

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage your workforce records"
        onAdd={admin ? openCreate : undefined}
        addLabel={admin ? 'Add Employee' : undefined}
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
        emptyTitle={search ? "No matching employees" : "No employees yet"}
        emptyMessage={search ? "Try a different search term." : "Add your first employee to get started."}
      >
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="bg-navy-50 text-navy-500 text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-semibold">Name</th>
                  <th className="px-5 py-3 text-left font-semibold">Contact</th>
                  <th className="px-5 py-3 text-left font-semibold">Position</th>
                  <th className="px-5 py-3 text-left font-semibold">Department</th>
                  <th className="px-5 py-3 text-left font-semibold">Hire Date</th>
                  <th className="px-5 py-3 text-right font-semibold">Salary</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  {admin && (
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-navy-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-navy-900 text-mint-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {emp.firstName?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-navy-800 text-sm">{`${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim()}</p>
                          <p className="text-xs text-navy-400">ID: {emp.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-navy-600">
                      <span className="flex items-center gap-1.5">
                        {emp.phone ? (
                          <><Phone className="w-3.5 h-3.5 text-navy-300" />{emp.phone}</>
                        ) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-navy-600">
                      <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-navy-300" />{emp.position || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-navy-600">{deptName(emp.departmentId)}</td>
                    <td className="px-5 py-3.5 text-sm text-navy-600">{emp.hireDate || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-right text-navy-600">
                      {emp.salary != null ? emp.salary.toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      {emp.status ? (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          emp.status === 'ACTIVE'
                            ? 'bg-green-50 text-green-700'
                            : emp.status === 'INACTIVE'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}>
                          {emp.status}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {admin && (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(emp)} className="p-2 text-navy-400 hover:bg-navy-100 hover:text-navy-700 rounded-lg transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(emp)} className="p-2 text-red-300 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ApiStateHandler>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Employee' : 'Add Employee'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={formLoading}>Cancel</button>
            <button onClick={handleSubmit} className="btn-primary" disabled={formLoading || !form.firstName?.trim() || !form.lastName?.trim() || !form.email?.trim()}>
              {formLoading ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">First Name *</label>
              <input className="input-field" value={form.firstName ?? ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div>
              <label className="label-field">Last Name *</label>
              <input className="input-field" value={form.lastName ?? ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Email *</label>
              <input type="email" className="input-field" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label-field">Phone</label>
              <input className="input-field" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Position</label>
              <input className="input-field" value={form.position ?? ''} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Department</label>
              <select className="input-field" value={form.departmentId ?? ''} onChange={(e) => setForm({ ...form, departmentId: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">—</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Hire Date</label>
              <input type="date" className="input-field" value={form.hireDate ?? ''} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Salary</label>
              <input type="number" className="input-field" value={form.salary ?? ''} onChange={(e) => setForm({ ...form, salary: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
          </div>
          <div>
            <label className="label-field">Status</label>
            <select className="input-field" value={form.status ?? 'ACTIVE'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Employee"
        message={`Are you sure you want to delete ${`${deleteTarget?.firstName ?? ''} ${deleteTarget?.lastName ?? ''}`.trim()}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
