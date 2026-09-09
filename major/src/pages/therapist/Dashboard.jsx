import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, FileText, IndianRupee, Users, Video, Bell, Settings,
  Clock, Activity, ChevronLeft, ChevronRight, CheckCircle2, UserCheck, Inbox, Sparkles,
  Moon, Sun, X, ShieldCheck
} from 'lucide-react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const DEFAULT_ANALYTICS = {
  totalClients: 18,
  activeClients: 14,
  totalRevenue: 27000,
  netRevenue: 26460,
  noShowRate: '3.2%',
  totalSessions: 24,
  revenueTrend: [
    { _id: { month: 4, year: 2026 }, revenue: 1500000 },
    { _id: { month: 5, year: 2026 }, revenue: 2100000 },
    { _id: { month: 6, year: 2026 }, revenue: 2700000 },
  ],
  sessionBreakdown: [
    { _id: 'completed', count: 18 },
    { _id: 'scheduled', count: 5 },
    { _id: 'cancelled', count: 1 },
  ],
  clientGrowth: [
    { _id: { month: 4 }, newClients: 4 },
    { _id: { month: 5 }, newClients: 6 },
    { _id: { month: 6 }, newClients: 8 },
  ],
};

const DEFAULT_SESSIONS = [
  {
    _id: 'session-demo-1',
    client: { name: 'Aarav Mehta', email: 'aarav@demo.com', phone: '+91 98765 43210' },
    startTime: new Date(Date.now() + 86400000).toISOString(),
    status: 'scheduled',
    meetingLink: 'https://meet.jit.si/Unfazed-Session-Aarav',
  },
  {
    _id: 'session-demo-2',
    client: { name: 'Ananya Sharma', email: 'ananya@demo.com', phone: '+91 98123 45678' },
    startTime: new Date(Date.now() + 172800000).toISOString(),
    status: 'scheduled',
    meetingLink: 'https://meet.jit.si/Unfazed-Session-Ananya',
  },
  {
    _id: 'session-demo-3',
    client: { name: 'Rohan Verma', email: 'rohan@demo.com', phone: '+91 99887 76655' },
    startTime: new Date(Date.now() + 259200000).toISOString(),
    status: 'scheduled',
    meetingLink: 'https://meet.jit.si/Unfazed-Session-Rohan',
  }
];

const Dashboard = () => {
  const { therapist } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(DEFAULT_ANALYTICS);
  const [sessions, setSessions] = useState(DEFAULT_SESSIONS);
  const [loading, setLoading] = useState(false);

  // Theme, Notification & Settings State
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark-theme'));
  const [showNotif, setShowNotif] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [calDay, setCalDay] = useState(14);

  const toggleDarkTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const syncRealtimeBookings = () => {
      try {
        const rawDocSessions = JSON.parse(localStorage.getItem('unfazed_doctor_sessions') || '[]');
        const rawClientAppts = JSON.parse(localStorage.getItem('client_appointments') || '[]');

        const realTimeList = [];

        rawDocSessions.forEach((s, idx) => {
          const name = s.client?.name || 'Aarav Mehta';
          realTimeList.push({
            _id: s._id || ('realtime-doc-' + idx),
            client: { name, email: s.client?.email || 'client@unfazed.com' },
            patientName: name,
            startTime: s.startTime || new Date().toISOString(),
            status: s.status || 'scheduled',
            duration: 50,
            displayTime: s.timeDisplay || '09:00 AM - 09:50 AM',
            meetingLink: `https://meet.jit.si/Unfazed-Session-${Date.now()}`,
          });
        });

        rawClientAppts.forEach((c, idx) => {
          const name = c.patientName || 'Aarav Mehta';
          if (!realTimeList.some(item => item.patientName === name && item.displayTime === c.time)) {
            realTimeList.push({
              _id: c._id || ('realtime-client-' + idx),
              client: { name, email: c.patientEmail || 'client@unfazed.com' },
              patientName: name,
              startTime: new Date(`${c.date || new Date().toISOString().split('T')[0]}T09:00:00`).toISOString(),
              status: 'scheduled',
              duration: 50,
              displayTime: c.time || '09:00 AM - 09:50 AM',
              meetingLink: c.meetingLink || `https://meet.jit.si/Unfazed-Session-${Date.now()}`,
            });
          }
        });

        if (realTimeList.length > 0) {
          setSessions(realTimeList);
          setAnalytics(prev => ({
            ...prev,
            totalClients: 18 + realTimeList.length,
            activeClients: 14 + realTimeList.length,
            totalSessions: 24 + realTimeList.length,
          }));
        }
      } catch (e) {}
    };

    syncRealtimeBookings();

    const fetchData = async () => {
      try {
        const [analyticsRes, sessionsRes] = await Promise.all([
          api.get('/analytics', { timeout: 2500 }),
          api.get('/scheduling/sessions', { timeout: 2500 }),
        ]);
        if (analyticsRes.data && analyticsRes.data.totalClients !== undefined) {
          setAnalytics(analyticsRes.data);
        }
        if (Array.isArray(sessionsRes.data) && sessionsRes.data.length > 0) {
          const upcoming = sessionsRes.data
            .filter(s => new Date(s.startTime) > new Date() && s.status === 'scheduled')
            .slice(0, 5);
          if (upcoming.length > 0) setSessions(prev => [...upcoming, ...prev]);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    window.addEventListener('storage', syncRealtimeBookings);
    return () => window.removeEventListener('storage', syncRealtimeBookings);
  }, []);

  const doctorName = therapist?.name || 'Dr. Priya Sharma';
  const doctorDp = therapist?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorName)}&background=6366f1&color=fff&size=200`;
  const nextSession = sessions[0];

  return (
    <div className="medix-dashboard">
      {/* ── Top Bar Header ── */}
      <header className="medix-header flex-between mb-4">
        <div>
          <h1 className="medix-greeting flex gap-2 align-center">
            Good Morning, {doctorName} <Sparkles size={24} color="#6366f1" />
          </h1>
          <p className="medix-subtitle">Have a great and productive day filled with patient care success.</p>
        </div>

        <div className="medix-header-right" style={{ position: 'relative' }}>
          <div className="medix-icon-badge" onClick={toggleDarkTheme} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} style={{ cursor: 'pointer' }}>
            {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} />}
          </div>
          <div className="medix-icon-badge" onClick={() => setShowNotif(!showNotif)} title="Notifications" style={{ cursor: 'pointer', position: 'relative' }}>
            <Bell size={18} />
            <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
          </div>
          <div className="medix-icon-badge" onClick={() => setShowSettings(true)} title="Practice Settings" style={{ cursor: 'pointer' }}>
            <Settings size={18} />
          </div>

          <div className="medix-profile-pill" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <img src={doctorDp} alt={doctorName} className="medix-user-dp" />
            <div className="medix-user-meta">
              <span className="medix-user-name">{doctorName}</span>
              <span className="medix-user-role">Practitioner</span>
            </div>
          </div>

          {/* Notifications Popover */}
          {showNotif && (
            <div className="card" style={{ position: 'absolute', top: 50, right: 0, width: 320, zIndex: 100, padding: 16 }}>
              <div className="flex-between mb-2">
                <strong style={{ fontSize: '0.9rem' }}>Practice Notifications</strong>
                <span className="text-muted" style={{ fontSize: '0.75rem', cursor: 'pointer' }} onClick={() => setShowNotif(false)}>Close</span>
              </div>
              <div className="flex-column gap-2">
                <div style={{ padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 8, fontSize: '0.8rem' }}>
                  <strong style={{ display: 'block', color: 'var(--accent-indigo)' }}>New Booking Confirmed 📅</strong>
                  Client session scheduled for today.
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Stat Cards Bar ── */}
      <div className="medix-stats-grid mb-4">
        <div className="card stat-box">
          <div className="stat-icon-wrapper bg-indigo"><Users size={22} color="#6366f1" /></div>
          <div>
            <span className="stat-label">Total Patients</span>
            <h3 className="stat-value">{analytics.totalClients}</h3>
          </div>
        </div>

        <div className="card stat-box">
          <div className="stat-icon-wrapper bg-emerald"><UserCheck size={22} color="#10b981" /></div>
          <div>
            <span className="stat-label">Active Clients</span>
            <h3 className="stat-value">{analytics.activeClients}</h3>
          </div>
        </div>

        <div className="card stat-box">
          <div className="stat-icon-wrapper bg-amber"><Calendar size={22} color="#f59e0b" /></div>
          <div>
            <span className="stat-label">Total Sessions</span>
            <h3 className="stat-value">{analytics.totalSessions}</h3>
          </div>
        </div>

        <div className="card stat-box">
          <div className="stat-icon-wrapper bg-purple"><IndianRupee size={22} color="#a855f7" /></div>
          <div>
            <span className="stat-label">Net Practice Revenue</span>
            <h3 className="stat-value">₹{analytics.totalRevenue?.toLocaleString('en-IN')}</h3>
          </div>
        </div>
      </div>

      {/* ── Main Layout: 2 Columns ── */}
      <div className="medix-main-grid">
        
        {/* LEFT COLUMN: Patient Activity & Today's Patients */}
        <div className="medix-col-left">
          
          {/* Patient Weekly Activity Chart Card */}
          <div className="card mb-4">
            <div className="flex-between mb-3">
              <div>
                <h3 className="card-title flex gap-2" style={{ margin: 0 }}><Activity size={18} /> Your Patients Overview</h3>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>Weekly patient consultation trends</p>
              </div>
              <span className="badge badge-primary">This Week</span>
            </div>
            <div className="chart-placeholder-bar">
              <div className="chart-bar-item" style={{ height: '40%' }}><span>Sun</span></div>
              <div className="chart-bar-item" style={{ height: '60%' }}><span>Mon</span></div>
              <div className="chart-bar-item" style={{ height: '85%' }}><span>Tue</span></div>
              <div className="chart-bar-item" style={{ height: '50%' }}><span>Wed</span></div>
              <div className="chart-bar-item active" style={{ height: '95%' }}><span>Thu</span></div>
              <div className="chart-bar-item" style={{ height: '70%' }}><span>Fri</span></div>
              <div className="chart-bar-item" style={{ height: '45%' }}><span>Sat</span></div>
            </div>
          </div>

          {/* Today's Patients List Card */}
          <div className="card">
            <div className="flex-between mb-4">
              <h3 className="card-title flex gap-2" style={{ margin: 0 }}><Users size={18} /> Your Patients Today</h3>
              <Link to="/schedule" className="btn btn-secondary btn-sm flex gap-1">View All Schedule <ChevronRight size={14} /></Link>
            </div>

            {sessions.length === 0 ? (
              <div className="empty-state text-center" style={{ padding: 40 }}>
                <Inbox size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <p className="text-muted">No client sessions scheduled for today.</p>
              </div>
            ) : (
              <div className="medix-patients-list">
                {sessions.map(session => {
                  const clientName = session.client?.name || session.client_id?.name || session.patientName || 'Aarav Mehta';
                  const clientDp = `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=3b82f6&color=fff&size=100`;
                  const callUrl = session.meetingLink || `https://meet.jit.si/Unfazed-Session-${session._id}`;
                  const timeStr = session.displayTime || (session.startTime ? new Date(session.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '09:00 AM');

                  return (
                    <div key={session._id} className="patient-list-item flex-between">
                      <div className="patient-meta">
                        <img src={clientDp} alt={clientName} className="patient-dp" />
                        <div>
                          <h4 className="patient-name">{clientName}</h4>
                          <span className="patient-concern">Diagnosis: Anxiety & Stress Support</span>
                        </div>
                      </div>

                      <div className="patient-time-box">
                        <span className="patient-time flex gap-1"><Clock size={14} /> {timeStr}</span>
                        <a
                          href={callUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-navy-pill-sm flex gap-1"
                        >
                          <Video size={14} /> Join Video Call
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Mini Calendar & Patient Spotlight */}
        <div className="medix-col-right">
          
          {/* Mini Calendar Picker */}
          <div className="card mb-4 calendar-mini-card">
            <div className="flex-between mb-3">
              <h3 className="card-title flex gap-2" style={{ margin: 0 }}><Calendar size={18} />Calendar</h3>
              <div className="flex gap-2 align-center">
                <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>June 2026</span>
                <div className="flex gap-1">
                  <button className="header-icon-btn" style={{ width: 24, height: 24 }} onClick={() => setCalDay(prev => Math.max(1, prev - 1))} title="Previous Day"><ChevronLeft size={14} /></button>
                  <button className="header-icon-btn" style={{ width: 24, height: 24 }} onClick={() => setCalDay(prev => Math.min(30, prev + 1))} title="Next Day"><ChevronRight size={14} /></button>
                </div>
              </div>
            </div>
            <div className="mini-calendar-days">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d} className="mini-head">{d}</span>)}
              {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
                const isSelected = calDay === day;
                const hasSession = day === 4 || day === 12 || day === 15 || day === 22;
                return (
                  <div
                    key={day}
                    className={`mini-date ${isSelected ? 'active' : ''}`}
                    onClick={() => setCalDay(day)}
                    title={`June ${day}, 2026 ${hasSession ? '• Session Scheduled' : ''}`}
                  >
                    {day < 10 ? '0' + day : day}
                    {hasSession && !isSelected && <span className="mini-dot" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Patient Spotlight Card */}
          <div className="card spotlight-card">
            <span className="spotlight-badge flex gap-1"><UserCheck size={12} /> Next Appointment Spotlight</span>
            
            {nextSession ? (
              <div className="spotlight-content text-center mt-3">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(nextSession.client?.name || nextSession.client_id?.name || nextSession.patientName || 'Client')}&background=6366f1&color=fff&size=200`}
                  alt="Client Spotlight"
                  className="spotlight-dp"
                />
                <h3 className="spotlight-name">{nextSession.client?.name || nextSession.client_id?.name || nextSession.patientName || 'Aarav Mehta'}</h3>
                <span className="badge badge-primary mt-1">Anxiety & CBT Support</span>
                
                <div className="spotlight-info-box mt-3" style={{ textAlign: 'left' }}>
                  <p className="flex gap-1.5 align-center mb-1"><Calendar size={14} color="var(--accent-indigo)" /> Date: <strong>{new Date(nextSession.startTime).toLocaleDateString('en-IN')}</strong></p>
                  <p className="flex gap-1.5 align-center mb-1"><Clock size={14} color="var(--accent-indigo)" /> Time: <strong>{nextSession.displayTime || (nextSession.startTime ? new Date(nextSession.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '09:00 AM')}</strong></p>
                  <p className="flex gap-1.5 align-center"><Clock size={14} color="var(--emerald-icon)" /> Duration: <strong>{nextSession.duration || 50} Minutes</strong></p>
                </div>

                <a
                  href={nextSession.meetingLink || `https://meet.jit.si/Unfazed-Session-${nextSession._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-navy-full mt-4 flex-center gap-2"
                  style={{ textDecoration: 'none', display: 'flex' }}
                >
                  <Video size={18} /> Join 1-on-1 Video Session
                </a>
              </div>
            ) : (
              <div className="text-center" style={{ padding: '30px 10px' }}>
                <UserCheck size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
                <p className="text-muted">No upcoming appointments scheduled today.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="flex-between mb-3">
              <h3 className="flex gap-2 align-center" style={{ margin: 0, fontSize: '1.2rem' }}>
                <Settings size={20} color="var(--accent-indigo)" /> Practice Settings
              </h3>
              <button className="header-icon-btn" onClick={() => setShowSettings(false)}><X size={18} /></button>
            </div>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 20 }}>
              Manage your practitioner preferences, notifications, and profile details.
            </p>

            <div className="flex-column gap-3 mb-4">
              <div className="card flex-between" style={{ padding: 14, cursor: 'pointer' }} onClick={() => { setShowSettings(false); navigate('/profile'); }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', display: 'block' }}>Edit Practitioner Profile</strong>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>Update bio, specializations & DP</span>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>

              <div className="card flex-between" style={{ padding: 14, cursor: 'pointer' }} onClick={() => { setShowSettings(false); navigate('/schedule'); }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', display: 'block' }}>Manage Session Availability</strong>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>Configure weekly hours & buffer time</span>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>

              <div className="card flex-between" style={{ padding: 14 }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', display: 'block' }}>Dark Theme Mode</strong>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>Toggle light / dark visual appearance</span>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={toggleDarkTheme}>
                  {isDark ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>

            <button className="btn btn-primary w-full" onClick={() => setShowSettings(false)}>
              Close Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
