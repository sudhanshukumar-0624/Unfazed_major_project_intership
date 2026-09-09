import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, User, X, Check, Clock } from 'lucide-react';
import api from '../../api/axiosInstance';
import './Clients.css';

const statusColors = { active: 'badge-emerald', inactive: 'badge-neutral', waitlist: 'badge-amber' };

const DEFAULT_CLIENT_LIST = [
  {
    _id: 'client-demo-1',
    name: 'Aarav Mehta',
    email: 'aarav@demo.com',
    phone: '+91 98765 43210',
    status: 'active',
    presentingConcern: 'Anxiety, Workplace Stress',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'client-demo-2',
    name: 'Ananya Sharma',
    email: 'ananya@demo.com',
    phone: '+91 98123 45678',
    status: 'active',
    presentingConcern: 'Sleep Disorders, Burnout',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'client-demo-3',
    name: 'Rohan Verma',
    email: 'rohan@demo.com',
    phone: '+91 99887 76655',
    status: 'active',
    presentingConcern: 'Mild Depression, Life Coaching',
    createdAt: new Date().toISOString(),
  }
];

const Clients = () => {
  const [clients, setClients] = useState(DEFAULT_CLIENT_LIST);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', age: '', gender: '', presentingConcern: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const syncRealtimeClients = () => {
      try {
        const rawDocSessions = JSON.parse(localStorage.getItem('unfazed_doctor_sessions') || '[]');
        const rawClientAppts = JSON.parse(localStorage.getItem('client_appointments') || '[]');

        const realTimeClients = [];

        rawDocSessions.forEach((s, idx) => {
          const name = s.client?.name || 'Client User';
          const email = s.client?.email || 'client@unfazed.com';
          const phone = s.client?.phone || '+91 98765 43210';
          if (!realTimeClients.some(item => item.email === email || item.name === name)) {
            realTimeClients.push({
              _id: s._id || ('client-rt-' + idx),
              name,
              email,
              phone,
              status: 'active',
              consentGiven: true,
              presentingConcern: 'Anxiety & CBT Support',
              createdAt: s.startTime || new Date().toISOString(),
            });
          }
        });

        rawClientAppts.forEach((c, idx) => {
          const name = c.patientName || 'Client User';
          const email = c.patientEmail || 'client@unfazed.com';
          const phone = c.patientPhone || '+91 98765 43210';
          if (!realTimeClients.some(item => item.email === email || item.name === name)) {
            realTimeClients.push({
              _id: c._id || ('client-rt-appt-' + idx),
              name,
              email,
              phone,
              status: 'active',
              consentGiven: true,
              presentingConcern: 'Mental Health Consultation',
              createdAt: c.createdAt || new Date().toISOString(),
            });
          }
        });

        if (realTimeClients.length > 0) {
          const combined = [...realTimeClients];
          DEFAULT_CLIENT_LIST.forEach(d => {
            if (!combined.some(item => item.email === d.email)) {
              combined.push(d);
            }
          });
          setClients(combined);
        }
      } catch (e) {}
    };

    syncRealtimeClients();

    const fetchClients = async () => {
      try {
        const params = {};
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        const { data } = await api.get('/clients', { params, timeout: 2500 });
        if (Array.isArray(data) && data.length > 0) {
          setClients(prev => [...data, ...prev]);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchClients();

    window.addEventListener('storage', syncRealtimeClients);
    return () => window.removeEventListener('storage', syncRealtimeClients);
  }, [search, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await api.post('/clients', form);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', age: '', gender: '', presentingConcern: '' });
      fetchClients();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add client');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this client?')) return;
    await api.delete(`/clients/${id}`);
    setClients(prev => prev.filter(c => c._id !== id));
  };

  return (
    <div className="clients-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} total registered clients</p>
        </div>
        <button id="add-client-btn" className="btn btn-primary flex gap-2" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="clients-filters">
        <div style={{ position: 'relative', maxWidth: 300, flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>
        <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="waitlist">Waitlist</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="flex-center" style={{ padding: 60 }}><div className="spinner" /></div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><User size={40} /></div>
            <h3>No clients found</h3>
            <p>Add your first client to get started.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Consent</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div className="client-name-cell">
                        <div className="client-avatar">{c.name[0]}</div>
                        <div>
                          <strong>{c.name}</strong>
                          {c.tags?.map(t => <span key={t} className="badge badge-primary" style={{ marginLeft: 6, fontSize: '0.7rem' }}>{t}</span>)}
                        </div>
                      </div>
                    </td>
                    <td>{c.email}</td>
                    <td>{c.phone || '—'}</td>
                    <td><span className={`badge ${statusColors[c.status]}`}>{c.status}</span></td>
                    <td>{c.consentGiven ? <span className="badge badge-emerald flex gap-1"><Check size={12} /> Given</span> : <span className="badge badge-amber flex gap-1"><Clock size={12} /> Pending</span>}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm flex gap-1" style={{ color: '#ef4444' }} onClick={() => handleDelete(c._id)}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header flex-between mb-4">
              <h3 className="modal-title">Add New Client</h3>
              <button className="modal-close" style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Rahul Verma" value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="rahul@email.com" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="9876543210" value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" type="number" placeholder="28" value={form.age}
                    onChange={e => setForm({...form, age: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-input" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Presenting Concern</label>
                <input className="form-input" placeholder="Anxiety, Depression, etc." value={form.presentingConcern}
                  onChange={e => setForm({...form, presentingConcern: e.target.value})} />
              </div>
              <div className="flex gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
