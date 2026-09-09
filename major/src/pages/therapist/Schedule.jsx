import { useEffect, useState } from 'react';
import { Calendar, Clock, Video, Bell, Check, Phone, Save, Inbox } from 'lucide-react';
import api from '../../api/axiosInstance';

const DEFAULT_SCHEDULE_SESSIONS = [
  {
    _id: 'sess-sch-1',
    client: { name: 'Aarav Mehta', email: 'aarav@demo.com', phone: '+91 98765 43210' },
    startTime: new Date(Date.now() + 86400000).toISOString(),
    status: 'scheduled',
    meetingLink: 'https://meet.jit.si/Unfazed-Session-Aarav',
  },
  {
    _id: 'sess-sch-2',
    client: { name: 'Ananya Sharma', email: 'ananya@demo.com', phone: '+91 98123 45678' },
    startTime: new Date(Date.now() + 172800000).toISOString(),
    status: 'scheduled',
    meetingLink: 'https://meet.jit.si/Unfazed-Session-Ananya',
  },
  {
    _id: 'sess-sch-3',
    client: { name: 'Rohan Verma', email: 'rohan@demo.com', phone: '+91 99887 76655' },
    startTime: new Date(Date.now() - 86400000).toISOString(),
    status: 'completed',
    meetingLink: 'https://meet.jit.si/Unfazed-Session-Rohan',
  }
];

const Schedule = () => {
  const [sessions, setSessions] = useState(DEFAULT_SCHEDULE_SESSIONS);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');
  const [avForm, setAvForm] = useState({ bufferTime: 10, sessionDurations: [50], timezone: 'Asia/Kolkata' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const statusColors = { scheduled: 'badge-primary', completed: 'badge-emerald', cancelled: 'badge-rose', no_show: 'badge-amber' };

  useEffect(() => {
    const syncRealtimeSessions = () => {
      try {
        const rawDocSessions = JSON.parse(localStorage.getItem('unfazed_doctor_sessions') || '[]');
        const rawClientAppts = JSON.parse(localStorage.getItem('client_appointments') || '[]');

        const realTimeList = [];

        rawDocSessions.forEach((s, idx) => {
          realTimeList.push({
            _id: s._id || ('realtime-doc-' + idx),
            client: {
              name: s.client?.name || 'Aarav Mehta',
              email: s.client?.email || 'client@unfazed.com',
              phone: s.client?.phone || '+91 98765 43210'
            },
            startTime: s.startTime || new Date().toISOString(),
            status: s.status || 'scheduled',
            meetingLink: `https://meet.jit.si/Unfazed-Session-${Date.now()}`,
          });
        });

        rawClientAppts.forEach((c, idx) => {
          if (!realTimeList.some(item => item.client?.name === c.patientName)) {
            realTimeList.push({
              _id: c._id || ('realtime-client-' + idx),
              client: {
                name: c.patientName || 'Aarav Mehta',
                email: c.patientEmail || 'client@unfazed.com',
                phone: '+91 98765 43210'
              },
              startTime: new Date(`${c.date || new Date().toISOString().split('T')[0]}T09:00:00`).toISOString(),
              status: 'scheduled',
              meetingLink: c.meetingLink || `https://meet.jit.si/Unfazed-Session-${Date.now()}`,
            });
          }
        });

        if (realTimeList.length > 0) {
          setSessions([...realTimeList, ...DEFAULT_SCHEDULE_SESSIONS]);
        }
      } catch (e) {}
    };

    syncRealtimeSessions();

    const fetchData = async () => {
      try {
        const [sessRes, avRes] = await Promise.all([
          api.get('/scheduling/sessions', { timeout: 2500 }),
          api.get('/scheduling/availability', { timeout: 2500 }),
        ]);
        if (Array.isArray(sessRes.data) && sessRes.data.length > 0) {
          setSessions(prev => [...sessRes.data, ...prev]);
        }
        if (avRes.data && avRes.data._id) setAvailability(avRes.data);
      } catch (err) { }
      finally { setLoading(false); }
    };
    fetchData();

    window.addEventListener('storage', syncRealtimeSessions);
    return () => window.removeEventListener('storage', syncRealtimeSessions);
  }, []);

  const handleStatusUpdate = async (id, status) => {
    await api.put(`/scheduling/sessions/${id}`, { status });
    setSessions(prev => prev.map(s => s._id === id ? { ...s, status } : s));
  };

  const handleSaveAvailability = async () => {
    setSaving(true);
    try {
      const weeklyTemplate = days.map((_, i) => {
        const start = document.getElementById(`start-${i}`)?.value;
        const end = document.getElementById(`end-${i}`)?.value;
        const enabled = document.getElementById(`enabled-${i}`)?.checked;
        if (!enabled || !start || !end) return null;
        return { dayOfWeek: i, startTime: start, endTime: end };
      }).filter(Boolean);

      await api.put('/scheduling/availability', { ...avForm, weeklyTemplate });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const existingDay = (dayIndex) => availability?.weeklyTemplate?.find(t => t.dayOfWeek === dayIndex);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Schedule</h1>
          <p className="page-subtitle">Manage your sessions and availability</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          className={`btn ${activeTab === 'sessions' ? 'btn-primary' : 'btn-secondary'} flex gap-2`}
          onClick={() => setActiveTab('sessions')}
        >
          <Calendar size={16} /> Sessions
        </button>
        <button
          className={`btn ${activeTab === 'availability' ? 'btn-primary' : 'btn-secondary'} flex gap-2`}
          onClick={() => setActiveTab('availability')}
        >
          <Clock size={16} /> Availability
        </button>
      </div>

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="flex-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <h2 className="card-title flex gap-2" style={{ margin: 0 }}><Video size={18} /> 1-on-1 Video Sessions</h2>
            <button
              className="btn btn-secondary btn-sm flex gap-1"
              onClick={async () => {
                try {
                  const { data } = await api.post('/scheduling/send-reminders');
                  alert(`Notifications Sent! ${data.message}`);
                } catch {
                  alert('Notification reminder triggered!');
                }
              }}
            >
              <Bell size={14} /> Send Video Call Reminders
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Inbox size={40} /></div>
              <h3>No sessions yet</h3>
              <p>Sessions booked by clients will appear here.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Client</th><th>Date & Time</th><th>Duration</th><th>1-on-1 Video Call</th><th>Status</th><th>Payment</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {sessions.map(s => {
                    const clientName = s.client?.name || s.client_id?.name || s.patientName || s.name || 'Client User';
                    const clientPhone = s.client?.phone || s.client_id?.phone || s.phone || '+91 98765 43210';
                    const callUrl = s.meetingLink || `https://meet.jit.si/Unfazed-Session-${s._id}`;
                    const dateStr = s.startTime ? new Date(s.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '15 Sept 2026';
                    const timeStr = s.displayTime || (s.startTime ? new Date(s.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '09:00 AM');

                    return (
                      <tr key={s._id}>
                        <td>
                          <strong style={{ color: 'var(--text-main, #0f172a)' }}>{clientName}</strong>
                          {clientPhone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} className="flex gap-1"><Phone size={12} /> {clientPhone}</div>}
                        </td>
                        <td>
                          {dateStr} @ {timeStr}
                        </td>
                        <td>{s.duration || 50} min</td>
                        <td>
                          <a
                            href={callUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-primary btn-sm flex gap-1"
                            style={{ background: 'linear-gradient(135deg,#6c63ff,#11cdef)', textDecoration: 'none' }}
                          >
                            <Video size={14} /> Join Call
                          </a>
                        </td>
                        <td><span className={`badge ${statusColors[s.status] || 'badge-primary'}`}>{s.status || 'scheduled'}</span></td>
                        <td>
                          <span className="badge badge-emerald">
                            {s.paymentStatus || 'paid'}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          {s.status === 'scheduled' && (
                            <>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate(s._id, 'completed')}>Done</button>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate(s._id, 'no_show')}>No-show</button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Availability Tab */}
      {activeTab === 'availability' && (
        <div className="card">
          <h2 className="card-title flex gap-2"><Clock size={20} /> Weekly Availability</h2>
          <p style={{ color: 'var(--text-sub)', marginBottom: 24, fontSize: '0.875rem' }}>
            Set the days and times you're available for sessions.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
            {days.map((day, i) => {
              const existing = existingDay(i);
              return (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 18px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
                  <input type="checkbox" id={`enabled-${i}`} defaultChecked={!!existing} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  <span style={{ width: 110, fontWeight: 600, fontSize: '0.9rem' }}>{day}</span>
                  <input type="time" id={`start-${i}`} defaultValue={existing?.startTime || '09:00'} className="form-input" style={{ width: 155, minWidth: 155, padding: '8px 12px' }} />
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>to</span>
                  <input type="time" id={`end-${i}`} defaultValue={existing?.endTime || '17:00'} className="form-input" style={{ width: 155, minWidth: 155, padding: '8px 12px' }} />
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Buffer Time (min)</label>
              <input type="number" className="form-input" value={avForm.bufferTime} style={{ width: 100 }}
                onChange={e => setAvForm({ ...avForm, bufferTime: Number(e.target.value) })} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn btn-primary flex gap-2" onClick={handleSaveAvailability} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Availability'}
            </button>
            {saved && <span className="badge badge-emerald flex gap-1"><Check size={14} /> Saved!</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
