import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope, Search, MapPin, Moon, Sun, Bell, Calendar, Video, Star,
  Clock, CheckCircle2, UserCheck, ChevronLeft, ChevronRight,
  LayoutDashboard, MessageSquare, FileText, Settings, Award, GraduationCap, ShieldCheck,
  PhoneCall, Mail, HelpCircle, Lock, X, ExternalLink, Sparkles
} from 'lucide-react';
import api from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import './DoctorsDirectory.css';

const SPECIALTIES = [
  'All Specialties', 'Psychology', 'CBT Therapy', 'Pediatrics',
  'Cardiology', 'Traumatology', 'Anesthesiology', 'Ophthalmology',
  'General Diagnosis', 'Neuro Surgery'
];

const MOCK_REVIEWS = [
  { name: 'Courtney Henry', rating: 5, time: '2 mins ago', comment: 'Extremely thoughtful and compassionate therapist. Helped me manage my anxiety with practical CBT techniques.' },
  { name: 'Cameron Williamson', rating: 5, time: '1 hour ago', comment: 'Punctual and very easy to talk to. The 1-on-1 video call feature worked smoothly!' },
  { name: 'Jane Cooper', rating: 5, time: '1 day ago', comment: 'Highly professional care. Saved me hours of travel time.' },
];

const DEFAULT_DOCTORS = [
  {
    _id: 'doc-fallback-1',
    name: 'Dr. Marcus Vance',
    slug: 'marcus-vance',
    profilePic: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
    specializations: ['Psychology', 'CBT Therapy'],
    experienceYears: 12,
    education: 'PhD in Clinical Psychology, UCLA',
    certificate: 'Certified CBT Specialist, APA',
    symptoms: 'Anxiety & Panic Attacks, Stress, Depression, Sleep Disorders',
    languages: ['English', 'Spanish'],
  },
  {
    _id: 'doc-fallback-2',
    name: 'Dr. Priya Sharma',
    slug: 'priya-sharma',
    profilePic: 'https://images.unsplash.com/photo-1594824813566-78a0d922b910?w=300&auto=format&fit=crop&q=80',
    specializations: ['CBT Therapy', 'General Diagnosis'],
    experienceYears: 9,
    education: 'MD Psychiatry, Johns Hopkins',
    certificate: 'Board Certified Psychiatrist',
    symptoms: 'Burnout, ADHD, Relationship Issues, Bipolar Disorder',
    languages: ['English', 'Hindi'],
  },
  {
    _id: 'doc-fallback-3',
    name: 'Dr. Sarah Jenkins',
    slug: 'sarah-jenkins',
    profilePic: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80',
    specializations: ['Pediatrics', 'Psychology'],
    experienceYears: 14,
    education: 'PsyD Child & Adolescent Psychology',
    certificate: 'Pediatric Mental Health Fellow',
    symptoms: 'Child Behavioral Health, Adolescent Anxiety, Family Counseling',
    languages: ['English'],
  }
];

const DoctorsDirectory = () => {
  const { therapist: authUser, logout } = useAuth();
  const [doctors, setDoctors] = useState(DEFAULT_DOCTORS);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(DEFAULT_DOCTORS[0]);
  
  // Active Sidebar Navigation Tab ('directory', 'consultations', 'support', 'privacy')
  const [activeTab, setActiveTab] = useState('directory');
  const [clientAppointments, setClientAppointments] = useState([]);
  
  // Theme & Notifications State
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark-theme'));
  const [showNotif, setShowNotif] = useState(false);

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

  // Search & Filter State
  const [searchDoc, setSearchDoc] = useState('');
  const [location, setLocation] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('All Specialties');

  // Calendar & Slot selection state
  const [selectedDate, setSelectedDate] = useState('2026-06-14');
  const [selectedSlot, setSelectedSlot] = useState('12:00 PM');
  
  const navigate = useNavigate();

  useEffect(() => {
    let stored = [];
    try {
      const raw = localStorage.getItem('client_appointments');
      if (raw && raw !== 'undefined' && raw !== 'null') {
        stored = JSON.parse(raw);
      }
    } catch (e) {
      stored = [];
    }
    if (!Array.isArray(stored) || stored.length === 0) {
      setClientAppointments([
        {
          _id: 'session-demo-default',
          doctorName: 'Dr. Priya Sharma',
          doctorPic: 'https://images.unsplash.com/photo-1594824813566-78a0d922b910?w=300&auto=format&fit=crop&q=80',
          specialization: 'CBT Therapy & Anxiety Specialist',
          date: '2026-09-15',
          time: '09:00 AM - 09:50 AM',
          patientName: authUser?.name || 'Client User',
          meetingLink: 'https://meet.jit.si/Unfazed-Session-ClientDemo',
          status: 'Confirmed & Paid',
          amount: 1500,
        }
      ]);
    } else {
      setClientAppointments(stored);
    }
  }, [activeTab, authUser]);

  useEffect(() => {
    api.get('/therapist/directory/all', { timeout: 3500 })
      .then(r => {
        const rawDocs = (Array.isArray(r.data) && r.data.length > 0) ? r.data : DEFAULT_DOCTORS;
        // Deduplicate doctors by name
        const uniqueDocs = rawDocs.reduce((acc, current) => {
          const normName = (current.name || '').toLowerCase().trim();
          if (!acc.some(item => (item.name || '').toLowerCase().trim() === normName)) {
            acc.push(current);
          }
          return acc;
        }, []);
        setDoctors(uniqueDocs);
        if (!selectedDoctor) setSelectedDoctor(uniqueDocs[0]);
      })
      .catch(err => {
        console.error('Failed to load therapists, using defaults:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredDoctors = doctors.filter(doc => {
    const nameStr = doc.name || '';
    const specs = doc.specializations || [];
    const matchName = nameStr.toLowerCase().includes(searchDoc.toLowerCase()) ||
      specs.some(s => s.toLowerCase().includes(searchDoc.toLowerCase()));
    const matchSpec = activeSpecialty === 'All Specialties' ||
      specs.some(s => s.toLowerCase().includes(activeSpecialty.toLowerCase()));
    return matchName && matchSpec;
  });

  const timeSlots = [
    '11:00 AM', '11:30 AM', '12:00 PM', '01:00 PM',
    '01:30 PM', '03:00 PM', '03:30 PM', '04:30 PM',
    '05:00 PM', '05:30 PM', '06:00 PM'
  ];

  return (
    <div className="client-app-layout">
      {/* ── Left Navigation Sidebar (Navy Pill Bar) ── */}
      <aside className="client-sidebar">
        <div className="client-logo">
          <div className="client-logo-icon" onClick={() => setActiveTab('directory')} style={{ cursor: 'pointer' }}>
            <Stethoscope size={22} color="#fff" />
          </div>
        </div>

        <nav className="client-nav">
          <div
            className={`nav-pill ${activeTab === 'directory' ? 'active' : ''}`}
            title="Find & Book Doctors"
            onClick={() => setActiveTab('directory')}
          >
            <Stethoscope size={20} />
          </div>
          <div
            className={`nav-pill ${activeTab === 'consultations' ? 'active' : ''}`}
            title="My Consultations & Bookings"
            onClick={() => setActiveTab('consultations')}
          >
            <Calendar size={20} />
          </div>
          <div
            className={`nav-pill ${activeTab === 'support' ? 'active' : ''}`}
            title="Client Support & Help"
            onClick={() => setActiveTab('support')}
          >
            <MessageSquare size={20} />
          </div>
          <div
            className={`nav-pill ${activeTab === 'privacy' ? 'active' : ''}`}
            title="Patient Privacy & Security"
            onClick={() => setActiveTab('privacy')}
          >
            <ShieldCheck size={20} />
          </div>
        </nav>

        <div className="client-sidebar-bottom">
          <Link to="/login" title="Doctor & Practitioner Portal Sign In" className="doctor-portal-pill">
            <UserCheck size={20} color="#fff" />
          </Link>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="client-main-area">
        
        {/* Top Header Bar */}
        <header className="client-header">
          <div className="search-bar-container">
            <div className="search-field">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Find doctors, conditions..."
                value={searchDoc}
                onChange={e => setSearchDoc(e.target.value)}
              />
            </div>
            <div className="divider-line" />
            <div className="search-field">
              <MapPin size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Location (e.g. Mumbai, Online)"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
            <button className="btn-search-navy">Search</button>
          </div>

          <div className="header-right" style={{ position: 'relative' }}>
            <div className="header-icon-btn" onClick={toggleDarkTheme} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} style={{ cursor: 'pointer' }}>
              {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} />}
            </div>
            <div className="header-icon-btn" onClick={() => setShowNotif(!showNotif)} title="Notifications" style={{ cursor: 'pointer', position: 'relative' }}>
              <Bell size={18} />
              <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
            </div>
            {authUser ? (
              <div className="flex gap-2 align-center">
                <button
                  className="btn btn-secondary btn-sm flex gap-1.5 align-center"
                  style={{ borderRadius: 20, fontSize: '0.85rem' }}
                  onClick={() => setActiveTab('consultations')}
                  title="My Consultations & Appointment History"
                >
                  <User size={14} color="var(--primary-light)" /> {authUser.name || 'Client Account'}
                </button>
                <button
                  className="btn btn-neutral btn-sm"
                  style={{ borderRadius: 20, fontSize: '0.8rem' }}
                  onClick={logout}
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-secondary btn-sm" style={{ borderRadius: 20 }}>
                Sign In / Account
              </Link>
            )}

            {/* Notifications Popover Drawer */}
            {showNotif && (
              <div className="card" style={{ position: 'absolute', top: 50, right: 0, width: 320, zIndex: 100, padding: 16, boxShadow: 'var(--shadow-md)' }}>
                <div className="flex-between mb-2">
                  <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
                  <span className="text-muted" style={{ fontSize: '0.75rem', cursor: 'pointer' }} onClick={() => setShowNotif(false)}>Close</span>
                </div>
                <div className="flex-column gap-2">
                  <div style={{ padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 8, fontSize: '0.8rem' }}>
                    <strong style={{ display: 'block', color: 'var(--accent-indigo)' }}>Session Reminder 📅</strong>
                    Your 1-on-1 video call with Dr. Priya Sharma is scheduled for Sept 15.
                  </div>
                  <div style={{ padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 8, fontSize: '0.8rem' }}>
                    <strong style={{ display: 'block', color: 'var(--emerald-icon)' }}>Payment Verified ✅</strong>
                    ₹1,500 session payment confirmed via Razorpay.
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <h1 className="page-title-heading">Book Appointment</h1>

        {/* ── Specialty Category Bar (Image 1 top pills) ── */}
        <div className="specialty-pills-bar">
          {SPECIALTIES.map(spec => (
            <button
              key={spec}
              className={`spec-pill ${activeSpecialty === spec ? 'active' : ''}`}
              onClick={() => setActiveSpecialty(spec)}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* ── 3-Column Interactive Layout ── */}
        {loading ? (
          <div className="flex-center" style={{ padding: 80 }}><div className="spinner" /></div>
        ) : (
          <div className="booking-layout-grid">

            {/* COLUMN 1: Choose Doctor List */}
            <div className="column-doctor-list">
              <h2 className="column-title">Choose Doctor</h2>
              <div className="doctor-cards-scroll">
                {filteredDoctors.map(doc => {
                  const dpUrl = doc.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=6366f1&color=fff&size=200`;
                  const isSelected = selectedDoctor?._id === doc._id;
                  return (
                    <div
                      key={doc._id}
                      className={`doc-item-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedDoctor(doc)}
                    >
                      <div className="doc-item-header">
                        <img src={dpUrl} alt={doc.name} className="doc-item-dp" />
                        <div>
                          <h3 className="doc-item-name">{doc.name}</h3>
                          <p className="doc-item-sub">Specialist | 10+ years exp</p>
                          <span className="badge badge-primary">{doc.specializations?.[0] || 'Psychology'}</span>
                        </div>
                      </div>
                      <button
                        className="btn-book-card-navy"
                        onClick={(e) => {
                          e.stopPropagation();
                          const doctorSlug = doc.slug || (doc.name ? doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'priya-sharma');
                          navigate(`/${doctorSlug}`);
                        }}
                      >
                        Book an appointment
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: Selected Doctor Detail Inspector */}
            {selectedDoctor && (
              <div className="column-doctor-detail card">
                <div className="detail-header">
                  <img
                    src={selectedDoctor.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoctor.name)}&background=6366f1&color=fff&size=200`}
                    alt={selectedDoctor.name}
                    className="detail-dp"
                  />
                  <div className="detail-title-box">
                    <h2 className="detail-name">{selectedDoctor.name}</h2>
                    <p className="detail-sub">Specialist | 12 years experience</p>
                    <span className="badge badge-emerald" style={{ marginTop: 4 }}>
                      <CheckCircle2 size={12} style={{ marginRight: 3 }} /> {selectedDoctor.specializations?.[0] || 'Psychology'}
                    </span>
                  </div>
                  <button
                    className="btn-navy-lg"
                    onClick={() => {
                      const selSlug = selectedDoctor.slug || (selectedDoctor.name ? selectedDoctor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'priya-sharma');
                      navigate(`/${selSlug}`);
                    }}
                  >
                    Book an appointment
                  </button>
                </div>

                {/* Education & Certificates */}
                <div className="detail-section-row">
                  <div>
                    <span className="section-label flex gap-1"><GraduationCap size={14} /> Education</span>
                    <p className="section-value">{selectedDoctor.education || 'PhD in Clinical Psychology, UCLA'}</p>
                  </div>
                  <div>
                    <span className="section-label flex gap-1"><Award size={14} /> Certificate</span>
                    <p className="section-value">{selectedDoctor.certificate || 'Certified CBT Specialist, APA'}</p>
                  </div>
                </div>

                {/* Availability Today */}
                <div className="detail-section">
                  <span className="section-label flex gap-1"><Video size={14} /> Available Today</span>
                  <div className="tags-row mt-2">
                    <span className="badge badge-primary flex gap-1"><Video size={12} /> Online 1-on-1 Video Consultation</span>
                    <span className="badge badge-neutral flex gap-1"><MapPin size={12} /> Clinic Consultation Available</span>
                  </div>
                  <p className="schedule-hours mt-2 flex gap-1"><Clock size={14} /> Monday - Saturday &nbsp; 10:00 - 12:00 | 14:00 - 20:00</p>
                </div>

                {/* Symptoms */}
                <div className="detail-section">
                  <span className="section-label flex gap-1"><ShieldCheck size={14} /> Symptoms Treated</span>
                  <p className="section-value mt-1">{selectedDoctor.symptoms || 'Anxiety & Panic Attacks, Stress, Depression, Sleep Disorders'}</p>
                </div>

                {/* Specialty Procedures Tags */}
                <div className="detail-section">
                  <span className="section-label flex gap-1"><Stethoscope size={14} /> Specialty Procedures</span>
                  <div className="tags-row mt-2">
                    {['Cognitive Behavioral Therapy (CBT)', 'Family & Couples Therapy', 'Supportive Psychotherapy', 'Mindfulness-Based Stress Reduction (MBSR)'].map(tag => (
                      <span key={tag} className="tag-pill-navy">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Reviews */}
                <div className="detail-section">
                  <span className="section-label flex gap-1"><Star size={14} /> Client Reviews</span>
                  <div className="reviews-list mt-3">
                    {MOCK_REVIEWS.map((rev, idx) => (
                      <div key={idx} className="review-item">
                        <div className="review-header">
                          <span className="reviewer-name">{rev.name}</span>
                          <span className="review-stars flex gap-1"><Star size={12} fill="#f59e0b" color="#f59e0b" /><Star size={12} fill="#f59e0b" color="#f59e0b" /><Star size={12} fill="#f59e0b" color="#f59e0b" /><Star size={12} fill="#f59e0b" color="#f59e0b" /><Star size={12} fill="#f59e0b" color="#f59e0b" /></span>
                          <span className="review-time">{rev.time}</span>
                        </div>
                        <p className="review-text">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* COLUMN 3: Interactive Calendar & Visit Hours Picker */}
            <div className="column-calendar-picker">
              {/* Calendar Widget */}
              <div className="card calendar-card">
                <div className="flex-between mb-3">
                  <h3 className="card-title flex gap-2" style={{ margin: 0 }}><Calendar size={18} /> Calendar</h3>
                  <span className="text-muted" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>View All ›</span>
                </div>
                <div className="calendar-header-month">
                  <span>June 2026</span>
                  <div className="calendar-nav-btns flex gap-2">
                    <ChevronLeft size={16} /> <ChevronRight size={16} />
                  </div>
                </div>
                <div className="calendar-grid-days">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d} className="cal-day-head">{d}</span>)}
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                    <div
                      key={day}
                      className={`cal-date-cell ${day === 14 || day === 22 ? 'highlighted' : ''}`}
                      onClick={() => setSelectedDate(`2026-06-${day < 10 ? '0' + day : day}`)}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>

              {/* Visit Hours Widget */}
              <div className="card visit-hours-card mt-4">
                <div className="flex-between mb-3">
                  <h3 className="card-title flex gap-2" style={{ margin: 0 }}><Clock size={18} /> Visit Hours</h3>
                  <span className="text-muted" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>View All ›</span>
                </div>

                <div className="visit-hours-grid">
                  {timeSlots.map(slot => (
                    <button
                      key={slot}
                      className={`slot-time-btn ${selectedSlot === slot ? 'active' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>

                <button
                  className="btn-navy-full mt-4"
                  onClick={() => selectedDoctor && navigate(`/${selectedDoctor.slug}`)}
                >
                  Book an appointment
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ── 📅 MODAL 1: My Consultations & Bookings ── */}
      {activeTab === 'consultations' && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex-between mb-3">
              <h2 className="flex gap-2 align-center" style={{ fontSize: '1.4rem', color: 'var(--text-main)', margin: 0 }}>
                <Calendar size={22} color="var(--accent-indigo)" /> My Appointment History
              </h2>
              <button className="header-icon-btn" onClick={() => setActiveTab('directory')}><X size={18} /></button>
            </div>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 20 }}>
              View all your past & upcoming booked consultations with our specialist doctors.
            </p>

            {clientAppointments.length === 0 ? (
              <div className="card text-center mb-4" style={{ padding: 30 }}>
                <p className="text-muted mb-3">No booked appointments found yet.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('directory')}>
                  Browse Doctors & Book
                </button>
              </div>
            ) : (
              <div className="flex-column gap-3 mb-4">
                {clientAppointments.map((appt, i) => (
                  <div key={appt._id || i} className="card" style={{ padding: 16, border: '1px solid var(--border-light, #cbd5e1)' }}>
                    <div className="flex-between mb-2">
                      <span className="badge badge-emerald flex gap-1"><CheckCircle2 size={12} /> {appt.status || 'Confirmed & Paid'}</span>
                      <span className="text-muted" style={{ fontSize: '0.78rem' }}>Fee: <strong>₹{appt.amount || 1500}</strong></span>
                    </div>

                    <div className="flex gap-3 align-center mt-2">
                      <img
                        src={appt.doctorPic || 'https://images.unsplash.com/photo-1594824813566-78a0d922b910?w=300&auto=format&fit=crop&q=80'}
                        alt={appt.doctorName}
                        style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-main)' }}>{appt.doctorName || 'Dr. Priya Sharma'}</h3>
                        <span className="text-muted" style={{ fontSize: '0.825rem' }}>{appt.specialization || 'Mental Health Specialist'}</span>
                      </div>
                    </div>

                    <div className="detail-section-row mt-3" style={{ background: 'var(--bg-subtle, #f8fafc)', padding: 10, borderRadius: 8 }}>
                      <div>
                        <span className="section-label flex gap-1"><Calendar size={13} /> Date</span>
                        <p className="section-value" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{appt.date}</p>
                      </div>
                      <div>
                        <span className="section-label flex gap-1"><Clock size={13} /> Time Slot</span>
                        <p className="section-value" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{appt.time}</p>
                      </div>
                    </div>

                    <a
                      href={appt.meetingLink || 'https://meet.jit.si/Unfazed-Session-ClientDemo'}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-navy-full mt-3 flex-center gap-2"
                      style={{ textDecoration: 'none', display: 'flex' }}
                    >
                      <Video size={18} /> Join 1-on-1 Video Session
                    </a>
                  </div>
                ))}
              </div>
            )}

            <button className="btn btn-secondary w-full" onClick={() => setActiveTab('directory')}>
              Back to Doctor Directory
            </button>
          </div>
        </div>
      )}

      {/* ── 💬 MODAL 2: Client Support & Help ── */}
      {activeTab === 'support' && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="flex-between mb-3">
              <h2 className="flex gap-2 align-center" style={{ fontSize: '1.4rem', color: '#0f172a', margin: 0 }}>
                <MessageSquare size={22} color="var(--accent-indigo)" /> Client Support & Help
              </h2>
              <button className="header-icon-btn" onClick={() => setActiveTab('directory')}><X size={18} /></button>
            </div>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 20 }}>
              Our dedicated care team is available 24/7 to assist with your bookings and video sessions.
            </p>

            <div className="flex-column gap-3 mb-4">
              <div className="card flex-between" style={{ padding: 16 }}>
                <div className="flex gap-3 align-center">
                  <PhoneCall size={22} color="var(--emerald-icon)" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>24/7 Helpline</strong>
                    <span className="text-muted" style={{ fontSize: '0.825rem' }}>+91 1800-UNFAZED (Toll Free)</span>
                  </div>
                </div>
                <a href="tel:1800863293" className="btn btn-sm btn-secondary">Call Now</a>
              </div>

              <div className="card flex-between" style={{ padding: 16 }}>
                <div className="flex gap-3 align-center">
                  <Mail size={22} color="var(--accent-indigo)" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>Email Support</strong>
                    <span className="text-muted" style={{ fontSize: '0.825rem' }}>support@unfazed.com</span>
                  </div>
                </div>
                <a href="mailto:support@unfazed.com" className="btn btn-sm btn-secondary">Send Email</a>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', marginBottom: 10 }}>Frequently Asked Questions</h4>
            <div className="flex-column gap-2 mb-4">
              <div className="card" style={{ padding: 14 }}>
                <strong style={{ fontSize: '0.875rem' }}>How do I join my 1-on-1 video call?</strong>
                <p className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>Click on "My Consultations" in your sidebar or check your booking confirmation email to launch the secure video room.</p>
              </div>
              <div className="card" style={{ padding: 14 }}>
                <strong style={{ fontSize: '0.875rem' }}>Can I reschedule my appointment?</strong>
                <p className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>Yes, appointments can be rescheduled up to 4 hours prior to the session start time.</p>
              </div>
            </div>

            <button className="btn btn-primary w-full" onClick={() => setActiveTab('directory')}>
              Got It
            </button>
          </div>
        </div>
      )}

      {/* ── 🛡️ MODAL 3: Patient Privacy & Security ── */}
      {activeTab === 'privacy' && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="flex-between mb-3">
              <h2 className="flex gap-2 align-center" style={{ fontSize: '1.4rem', color: '#0f172a', margin: 0 }}>
                <ShieldCheck size={22} color="var(--emerald-icon)" /> Patient Privacy & Security
              </h2>
              <button className="header-icon-btn" onClick={() => setActiveTab('directory')}><X size={18} /></button>
            </div>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 20 }}>
              Your mental health journey is protected by state-of-the-art medical security protocols.
            </p>

            <div className="flex-column gap-3 mb-4">
              <div className="card flex gap-3 align-center" style={{ padding: 16 }}>
                <Lock size={26} color="var(--accent-indigo)" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>256-Bit SSL Data Encryption</strong>
                  <p className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>All personal details and session records are encrypted in transit and at rest.</p>
                </div>
              </div>

              <div className="card flex gap-3 align-center" style={{ padding: 16 }}>
                <Video size={26} color="var(--emerald-icon)" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>100% Confidential Video Calls</strong>
                  <p className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>Video calls stream peer-to-peer and are never recorded or stored on any server.</p>
                </div>
              </div>

              <div className="card flex gap-3 align-center" style={{ padding: 16 }}>
                <Award size={26} color="var(--amber-icon)" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>HIPAA & GDPR Standards</strong>
                  <p className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>Fully compliant with global healthcare data protection frameworks.</p>
                </div>
              </div>
            </div>

            <button className="btn btn-primary w-full" onClick={() => setActiveTab('directory')}>
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorsDirectory;
