import { useEffect, useState, useCallback } from 'react';
import { Handshake, Trash2, Mail, Phone, MapPin, Plus } from 'lucide-react';
import { getPartners, createPartner, deletePartner } from '@/api/partners';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ApiStateHandler } from '@/components/ApiState';
import { StatusBadge } from '@/components/Badges';
import { useAuth } from '@/hooks/useAuth';
import type { Partner } from '@/types';
import { isAdmin } from '@/lib/permissions';

export function PartnersPage() {
  const { login, user } = useAuth();
  const admin = isAdmin(user?.roles ?? []);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Partner>>({ alias: '', type: 'MESSAGE', direction: 'OUTBOUND', application: 'BankApp', processedFlowType: 'MESSAGE', description: '' });

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getPartners()
      .then((data) => setPartners(Array.isArray(data) ? data : []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = partners.filter((p) => {
    const q = search.toLowerCase();
    return p.alias?.toLowerCase().includes(q) || p.type?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setForm({ alias: '', type: 'MESSAGE', direction: 'OUTBOUND', application: 'BankApp', processedFlowType: 'MESSAGE', description: '' });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const created = await createPartner(form);
      setPartners((prev) => [...prev, created]);
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create partner');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deletePartner(deleteTarget.id);
      setPartners((prev) => prev.filter((p) => p.id !== deleteTarget.id));
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
        title="Partners"
        subtitle="Banking partners and external organizations"
        onAdd={admin ? openCreate : undefined}
        addLabel={admin ? 'Add Partner' : undefined}
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
        emptyTitle={search ? "No matching partners" : "No partners yet"}
        emptyMessage={search ? "Try a different search term." : "Add your first partner to get started."}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="card p-5 hover:shadow-card-hover transition-all duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-mint-50 flex items-center justify-center">
                    <Handshake className="w-5 h-5 text-mint-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-900">{p.alias}</h3>
                    {p.type && <p className="text-xs text-navy-400 mt-0.5">{p.type}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.direction} />
                  {admin && (
                    <button onClick={() => setDeleteTarget(p)} className="p-2 text-red-300 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-navy-500">
                {p.application && (
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-navy-300" /><span className="truncate">{p.application}</span></div>
                )}
                {p.direction && (
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-navy-300" /><span>{p.direction}</span></div>
                )}
                {p.description && (
                  <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-navy-300 mt-0.5" /><span className="line-clamp-2">{p.description}</span></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ApiStateHandler>

      <Modal
        open={modalOpen}
        title="Add Partner"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={formLoading}>Cancel</button>
            <button onClick={handleSubmit} className="btn-primary" disabled={formLoading || !form.alias || !form.description}>
              {formLoading ? 'Creating…' : 'Create'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{formError}</div>}
          <div>
            <label className="label-field">Partner Alias *</label>
            <input
              className="input-field"
              value={form.alias ?? ''}
              onChange={(e) => setForm({ ...form, alias: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Type *</label>
              <select
                className="input-field"
                value={form.type ?? 'MESSAGE'}
                onChange={(e) => setForm({ ...form, type: e.target.value as Partner['type'] })}
              >
                <option value="MESSAGE">Message</option>
                <option value="ALERTING">Alerting</option>
                <option value="NOTIFICATION">Notification</option>
              </select>
            </div>

            <div>
              <label className="label-field">Direction *</label>
              <select
                className="input-field"
                value={form.direction ?? 'OUTBOUND'}
                onChange={(e) => setForm({ ...form, direction: e.target.value as Partner['direction'] })}
              >
                <option value="INBOUND">Inbound</option>
                <option value="OUTBOUND">Outbound</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-field">Application</label>
            <input
              className="input-field"
              value={form.application ?? ''}
              onChange={(e) => setForm({ ...form, application: e.target.value })}
              placeholder="BankApp"
            />
          </div>

          <div>
            <label className="label-field">Processed Flow Type *</label>
            <select
              className="input-field"
              value={form.processedFlowType ?? 'MESSAGE'}
              onChange={(e) => setForm({ ...form, processedFlowType: e.target.value as Partner['processedFlowType'] })}
            >
              <option value="MESSAGE">Message</option>
              <option value="ALERTING">Alerting</option>
              <option value="NOTIFICATION">Notification</option>
            </select>
          </div>

          <div>
            <label className="label-field">Description *</label>
            <textarea
              className="input-field min-h-[80px] resize-y"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this partner..."
              required
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Partner"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
