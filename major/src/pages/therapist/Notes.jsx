import { useEffect, useState } from 'react';
import { FileText, Plus, Lock, Unlock, Trash2, X, User } from 'lucide-react';
import api from '../../api/axiosInstance';

const DEFAULT_NOTES_LIST = [
  {
    _id: 'note-demo-1',
    clientId: 'client-demo-1',
    type: 'private',
    content: 'Client reports improved sleep patterns following mindfulness exercises. Progressing well with cognitive behavioral goals.',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'note-demo-2',
    clientId: 'client-demo-2',
    type: 'shared',
    content: 'Discussed work-life balance boundaries. Recommended 15-minute daily breathing routines.',
    createdAt: new Date().toISOString(),
  }
];

const Notes = () => {
  const [notes, setNotes] = useState(DEFAULT_NOTES_LIST);
  const [clients, setClients] = useState([
    { _id: 'client-demo-1', name: 'Aarav Mehta' },
    { _id: 'client-demo-2', name: 'Ananya Sharma' },
  ]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ clientId: '', type: 'private', content: '', template: 'none' });
  const [filter, setFilter] = useState({ clientId: '', type: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = async () => {
    try {
      const params = {};
      if (filter.clientId) params.clientId = filter.clientId;
      if (filter.type) params.type = filter.type;
      const { data } = await api.get('/notes', { params, timeout: 3500 });
      if (Array.isArray(data) && data.length > 0) {
        setNotes(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    api.get('/clients', { timeout: 3500 }).then(r => {
      if (Array.isArray(r.data) && r.data.length > 0) setClients(r.data);
    }).catch(console.error);
  }, []);

  useEffect(() => { fetchNotes(); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/notes', form);
      setShowModal(false);
      setForm({ clientId: '', type: 'private', content: '', template: 'none' });
      fetchNotes();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    await api.delete(`/notes/${id}`);
    setNotes(prev => prev.filter(n => n._id !== id));
  };

  const clientName = (id) => clients.find(c => c._id === id)?.name || 'Unknown';

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Session Notes</h1>
          <p className="page-subtitle">{notes.length} confidential clinical notes</p>
        </div>
        <button className="btn btn-primary flex gap-2" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Note
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select className="form-input" style={{ maxWidth: 200 }}
          value={filter.clientId} onChange={e => setFilter({...filter, clientId: e.target.value})}>
          <option value="">All Clients</option>
          {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="form-input" style={{ maxWidth: 160 }}
          value={filter.type} onChange={e => setFilter({...filter, type: e.target.value})}>
          <option value="">All Types</option>
          <option value="private">Private</option>
          <option value="shared">Shared</option>
        </select>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : notes.length === 0 ? (
        <div className="empty-state card text-center" style={{ padding: 60 }}>
          <div className="empty-state-icon flex-center" style={{ margin: '0 auto 12px' }}><FileText size={44} color="var(--text-muted)" /></div>
          <h3>No notes recorded yet</h3>
          <p className="text-muted">Create your first session note to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {notes.map(note => (
            <div key={note._id} className="card" style={{ position: 'relative' }}>
              <div className="flex-between mb-3">
                <span className={`badge ${note.type === 'private' ? 'badge-amber' : 'badge-emerald'} flex gap-1`}>
                  {note.type === 'private' ? <Lock size={12} /> : <Unlock size={12} />}
                  {note.type === 'private' ? 'Private Note' : 'Shared Note'}
                </span>
                <button className="btn btn-secondary btn-sm" style={{ color: '#ef4444', padding: 6 }} onClick={() => handleDelete(note._id)}>
                  <Trash2 size={14} />
                </button>
              </div>
              <p style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem', color: '#0f172a' }} className="flex gap-1">
                <User size={14} style={{ marginTop: 2 }} /> {clientName(note.client_id)}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)', lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: note.content || '<i>No content</i>' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 14 }}>
                {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Note Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header flex-between mb-4">
              <h3 className="modal-title">Add Session Note</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Client *</label>
                <select className="form-input" value={form.clientId}
                  onChange={e => setForm({...form, clientId: e.target.value})} required>
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Note Type</label>
                  <select className="form-input" value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="private">Private (Doctor Only)</option>
                    <option value="shared">Shared with Client</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Template</label>
                  <select className="form-input" value={form.template}
                    onChange={e => setForm({...form, template: e.target.value})}>
                    <option value="none">None</option>
                    <option value="soap">SOAP Template</option>
                    <option value="dap">DAP Template</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea className="form-input" rows={6} placeholder="Write your clinical notes here..."
                  value={form.content} onChange={e => setForm({...form, content: e.target.value})}
                  style={{ resize: 'vertical' }} />
              </div>
              <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
