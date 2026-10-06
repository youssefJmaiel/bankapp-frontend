import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Send, Trash2, RefreshCw, CheckCircle2, Clock, Mail } from 'lucide-react';
import { getMessages, getMyMessages, sendMessage, deleteMessage } from '@/api/messages';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ApiStateHandler } from '@/components/ApiState';
import { ProcessedBadge } from '@/components/Badges';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/permissions';
import type { Message } from '@/types';

export function MessagesPage() {
  const { login, user } = useAuth();
  const admin = isAdmin(user?.roles ?? []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState('');
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [form, setForm] = useState<Partial<Message>>({ content: '', sender: '', receiver: '' });

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const request = admin ? getMessages() : getMyMessages();

    request
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
        setSendSuccess(false);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [admin]);

  useEffect(() => { load(); }, [load]);

  const filtered = messages.filter((m) => {
    const q = search.toLowerCase();
    return m.content?.toLowerCase().includes(q) || m.sender?.toLowerCase().includes(q) || m.receiver?.toLowerCase().includes(q);
  });

  const processedCount = messages.filter((m) => m.processed === true).length;
  const pendingCount = messages.length - processedCount;

  const openSend = () => {
    setForm({ content: '', sender: user?.email || user?.username || '', receiver: '' });
    setSendError(null);
    setSendSuccess(false);
    setSendModalOpen(true);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendLoading(true);
    setSendError(null);
    try {
      await sendMessage(form);
      setSendSuccess(true);
      setForm({ content: '', sender: user?.email || user?.username || '', receiver: '' });
      // Reload messages after a brief delay to show the new message
      setTimeout(() => {
        load();
        setSendModalOpen(false);
        setSendSuccess(false);
      }, 2000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSendLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteMessage(deleteTarget.id);
      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
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
        title="Messages"
        subtitle={admin ? "IBM MQ banking message flow" : "Your banking messages"}
        {...(admin ? { onAdd: openSend, addLabel: "Send Message" } : {})}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-navy-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-navy-900">{messages.length}</p>
            <p className="text-xs text-navy-400">Total</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-mint-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-mint-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-navy-900">{processedCount}</p>
            <p className="text-xs text-navy-400">Processed</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-gold-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-navy-900">{pendingCount}</p>
            <p className="text-xs text-navy-400">Pending</p>
          </div>
        </div>
      </div>

      <ApiStateHandler
        loading={loading}
        error={error}
        empty={!loading && filtered.length === 0}
        hasData={filtered.length > 0}
        onRetry={load}
        onLogin={login}
        emptyTitle={search ? "No matching messages" : "No messages yet"}
        emptyMessage={search ? "Try a different search term." : "Send your first banking message through IBM MQ."}
      >
        <div className="space-y-3">
          {filtered.map((msg) => (
            <div key={msg.id} className="card p-4 hover:shadow-card-hover transition-all duration-200 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-navy-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-navy-400">#{msg.id}</span>
                      <ProcessedBadge processed={msg.processed} />
                    </div>
                    <p className="text-sm text-navy-800 font-medium line-clamp-2">{msg.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-navy-400">
                      {msg.sender && <span>From: {msg.sender}</span>}
                      {msg.receiver && <span>To: {msg.receiver}</span>}
                      {msg.createdAt && <span>{new Date(msg.createdAt).toLocaleString()}</span>}
                      {msg.processedAt && <span className="text-mint-600">Processed: {new Date(msg.processedAt).toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
                {admin && (
                  <button onClick={() => setDeleteTarget(msg)} className="p-2 text-red-300 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ApiStateHandler>

      {/* Send Message Modal */}
      {admin && <Modal
        open={sendModalOpen}
        title="Send Banking Message"
        onClose={() => { setSendModalOpen(false); setSendSuccess(false); }}
        size="lg"
        footer={
          <>
            <button onClick={() => { setSendModalOpen(false); setSendSuccess(false); }} className="btn-secondary" disabled={sendLoading}>Close</button>
            <button onClick={handleSend} className="btn-primary" disabled={sendLoading || !form.content || sendSuccess}>
              {sendLoading ? 'Sending…' : sendSuccess ? 'Sent' : 'Send via IBM MQ'}
            </button>
          </>
        }
      >
        {sendSuccess ? (
          <div className="flex flex-col items-center py-8 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-mint-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-mint-500" />
            </div>
            <p className="text-lg font-bold text-navy-900 mb-1">Message sent</p>
            <p className="text-sm text-navy-400 text-center max-w-sm">
              Your message has been sent to IBM MQ. The backend listener will process it and update the processed status.
            </p>
            <div className="flex items-center gap-2 mt-4 text-sm text-navy-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Refreshing messages…</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            {sendError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{sendError}</div>}

            <div className="p-3 bg-navy-50 rounded-lg flex items-start gap-3">
              <Send className="w-5 h-5 text-navy-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-navy-800">IBM MQ Message Flow</p>
                <p className="text-xs text-navy-400 mt-0.5">
                  POST → Database → IBM MQ → MQ Listener → processed=true
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">Sender</label>
                <input className="input-field" value={form.sender ?? ''} onChange={(e) => setForm({ ...form, sender: e.target.value })} placeholder="sender@bank.com" />
              </div>
              <div>
                <label className="label-field">Receiver</label>
                <input className="input-field" value={form.receiver ?? ''} onChange={(e) => setForm({ ...form, receiver: e.target.value })} placeholder="receiver@bank.com" />
              </div>
            </div>
            <div>
              <label className="label-field">Message Content *</label>
              <textarea className="input-field min-h-[120px] resize-y" value={form.content ?? ''} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Enter your banking message…" required />
            </div>
          </form>
        )}
      </Modal>}

      {admin && <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Message"
        message={`Are you sure you want to delete message #${deleteTarget?.id}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />}
    </div>
  );
}
