import { useEffect, useState, useCallback } from 'react';
import { Building2, Edit2, Trash2, Users } from 'lucide-react';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/api/departments';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ApiStateHandler } from '@/components/ApiState';
import { useAuth } from '@/hooks/useAuth';
import type { Department } from '@/types';

export function DepartmentsPage() {
  const { login } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Department>>({ name: '', code: '', description: '' });

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getDepartments()
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = departments.filter((d) => {
    const q = search.toLowerCase();
    return d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', description: '' });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({ ...dept });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      if (editing) {
        const updated = await updateDepartment(editing.id, form);
        setDepartments((prev) => prev.map((d) => (d.id === editing.id ? updated : d)));
      } else {
        const created = await createDepartment(form);
        setDepartments((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save department');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteDepartment(deleteTarget.id);
      setDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // noop
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Organizational units and teams"
        onAdd={openCreate}
        addLabel="Add Department"
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
        emptyTitle={search ? "No matching departments" : "No departments yet"}
        emptyMessage={search ? "Try a different search term." : "Create your first department to organize employees."}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dept) => (
            <div key={dept.id} className="card p-5 hover:shadow-card-hover transition-all duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-navy-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-navy-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(dept)} className="p-2 text-navy-400 hover:bg-navy-100 hover:text-navy-700 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(dept)} className="p-2 text-red-300 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-navy-900 text-base mb-1">{dept.name}</h3>
              {dept.code && <p className="text-xs text-navy-400 font-mono mb-2">{dept.code}</p>}
              {dept.description && <p className="text-sm text-navy-500 line-clamp-2">{dept.description}</p>}
              <div className="mt-4 pt-3 border-t border-navy-50 flex items-center gap-2 text-sm text-navy-400">
                <Users className="w-4 h-4" />
                <span>{dept.employeeCount ?? '—'} employees</span>
              </div>
            </div>
          ))}
        </div>
      </ApiStateHandler>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Department' : 'Add Department'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={formLoading}>Cancel</button>
            <button onClick={handleSubmit} className="btn-primary" disabled={formLoading || !form.name}>
              {formLoading ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>}
          <div>
            <label className="label-field">Department Name *</label>
            <input className="input-field" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label-field">Code</label>
            <input className="input-field font-mono" value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. RISK-001" />
          </div>
          <div>
            <label className="label-field">Description</label>
            <textarea className="input-field min-h-[80px] resize-y" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Department"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
