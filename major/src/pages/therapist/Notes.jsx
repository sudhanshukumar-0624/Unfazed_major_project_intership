import { useEffect, useState } from 'react';
import { FileText, Plus, Lock, Unlock, Trash2, X, User } from 'lucide-react';
import api from '../../api/axiosInstance';

const DEFAULT_NOTES_LIST = [
  {
    _id: 'note-demo-1',
    clientId: 'client-demo-1',
    clientName: 'Aarav Mehta',
    type: 'private',
    content: 'Client reports improved sleep patterns following mindfulness exercises. Progressing well with cognitive behavioral goals.',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'note-demo-2',
    clientId: 'client-demo-2',
    clientName: 'Ananya Sharma',
    type: 'shared',
    content: 'Discussed work-life balance boundaries. Recommended 15-minute daily breathing routines.',
    createdAt: new Date().toISOString(),
  }
];

const Notes = () => {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('unfazed_session_notes') || '[]');
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch (e) {}
    return DEFAULT_NOTES_LIST;
  });

  const [clients, setClients] = useState([
    { _id: 'client-demo-1', name: 'Aarav Mehta' },
    { _id: 'client-demo-2', name: 'Ananya Sharma' },
    { _id: 'client-demo-3', name: 'Rohan Verma' },
  ]);

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ clientId: '', type: 'private', content: '', template: 'none' });
  const [filter, setFilter] = useState({ clientId: '', type: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const syncRealtimeClients = () => {
      try {
        const rawDocSessions = JSON.parse(localStorage.getItem('unfazed_doctor_sessions') || '[]');
        const rawClientAppts = JSON.parse(localStorage.getItem('client_appointments') || '[]');
        const clientList = [
          { _id: 'client-demo-1', name: 'Aarav Mehta' },
          { _id: 'client-demo-2', name: 'Ananya Sharma' },
          { _id: 'client-demo-3', name: 'Rohan Verma' },
        ];

        rawDocSessions.forEach(s => {
          const name = s.client?.name || 'Aarav Mehta';
          if (!clientList.some(c => c.name === name)) {
            clientList.unshift({ _id: s._id || ('client-' + Date.now()), name });
          }
        });

        rawClientAppts.forEach(a => {
          const name = a.patientName || 'Aarav Mehta';
          if (!clientList.some(c => c.name === name)) {
            clientList.unshift({ _id: a._id || ('client-' + Date.now()), name });
          }
        });

        setClients(clientList);
        if (!form.clientId && clientList.length > 0) {
          setForm(f => ({ ...f, clientId: clientList[0]._id }));
        }
      } catch (e) {}
    };

    syncRealtimeClients();
    window.addEventListener('storage', syncRealtimeClients);
    return () => window.removeEventListener('storage', syncRealtimeClients);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('unfazed_session_notes', JSON.stringify(notes));
    } catch (e) {}
  }, [notes]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const targetClient = clients.find(c => c._id === form.clientId) || clients[0];
    const newNote = {
      _id: 'note-' + Date.now(),
      clientId: form.clientId || targetClient?._id || 'client-demo-1',
      clientName: targetClient?.name || 'Aarav Mehta',
      type: form.type || 'private',
      content: form.content || 'Clinical session note recorded.',
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    try {
      localStorage.setItem('unfazed_session_notes', JSON.stringify(updatedNotes));
      await api.post('/notes', form, { timeout: 2000 });
    } catch (err) {}

    setShowModal(false);
    setForm({ clientId: clients[0]?._id || '', type: 'private', content: '', template: 'none' });
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this confidential note?')) return;
    const updated = notes.filter(n => n._id !== id);
    setNotes(updated);
    try {
      localStorage.setItem('unfazed_session_notes', JSON.stringify(updated));
      await api.delete(`/notes/${id}`, { timeout: 2000 });
    } catch (e) {}
  };

  const getNoteClientName = (note) => {
    if (note.clientName) return note.clientName;
    const id = note.clientId || note.client_id;
    const found = clients.find(c => c._id === id);
    if (found) return found.name;
    if (id === 'client-demo-1') return 'Aarav Mehta';
    if (id === 'client-demo-2') return 'Ananya Sharma';
    return clients[0]?.name || 'Aarav Mehta';
  };

  const filteredNotes = notes.filter(n => {
    const matchClient = !filter.clientId || n.clientId === filter.clientId || n.client_id === filter.clientId;
    const matchType = !filter.type || n.type === filter.type;
    return matchClient && matchType;
  });

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Session Notes</h1>
          <p className="page-subtitle">{filteredNotes.length} confidential clinical notes</p>
        </div>
        <button className="btn btn-primary flex gap-2" onClick={() => {
          if (clients.length > 0 && !form.clientId) {
            setForm(f => ({ ...f, clientId: clients[0]._id }));
          }
          setShowModal(true);
        }}>
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
      {filteredNotes.length === 0 ? (
        <div className="empty-state card text-center" style={{ padding: 60 }}>
          <div className="empty-state-icon flex-center" style={{ margin: '0 auto 12px' }}><FileText size={44} color="var(--text-muted)" /></div>
          <h3>No session notes found</h3>
          <p className="text-muted">Create a new confidential session note to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredNotes.map(note => (
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
              <p style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem', color: '#0f172a' }} className="flex gap-1.5 align-center">
                <User size={15} color="var(--accent-indigo, #6366f1)" />
                <span>{getNoteClientName(note)}</span>
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
                    onChange={e => {
                      const t = e.target.value;
                      let content = form.content;
                      if (t === 'soap') content = '<b>Subjective:</b> Client reports...<br/><b>Objective:</b> Observed calm affect...<br/><b>Assessment:</b> Progressing with goals...<br/><b>Plan:</b> Continue weekly CBT.';
                      if (t === 'dap') content = '<b>Data:</b> Patient discussed work stress...<br/><b>Assessment:</b> Mild anxiety symptoms...<br/><b>Plan:</b> Practice 15-min mindfulness daily.';
                      setForm({ ...form, template: t, content });
                    }}>
                    <option value="none">None</option>
                    <option value="soap">SOAP Template</option>
                    <option value="dap">DAP Template</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Content *</label>
                <textarea className="form-input" rows={6} placeholder="Write your clinical notes here..." required
                  value={form.content} onChange={e => setForm({...form, content: e.target.value})}
                  style={{ resize: 'vertical' }} />
              </div>
              <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving Note...' : 'Save Note'}
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
