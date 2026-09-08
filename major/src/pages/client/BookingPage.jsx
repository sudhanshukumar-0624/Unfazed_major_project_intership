import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Calendar, Clock, User, Video, CreditCard, CheckCircle2,
  Globe, ShieldCheck, ArrowRight, ArrowLeft, Frown, Sparkles, FileText, IndianRupee
} from 'lucide-react';
import api from '../../api/axiosInstance';
import './BookingPage.css';

/* ── Load Razorpay script dynamically ── */
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const STEPS = ['Pick Date', 'Choose Slot', 'Your Info', 'Payment', 'Confirmed'];

const DEFAULT_DOCTOR_MAP = {
  'priya-sharma': {
    _id: 'doc-fallback-2',
    name: 'Dr. Priya Sharma',
    slug: 'priya-sharma',
    profilePic: 'https://images.unsplash.com/photo-1594824813566-78a0d922b910?w=300&auto=format&fit=crop&q=80',
    specializations: ['CBT Therapy', 'General Diagnosis', 'Psychology'],
    experienceYears: 12,
    education: 'MD Psychiatry, Johns Hopkins',
    certificate: 'Board Certified Psychiatrist',
    symptoms: 'Burnout, ADHD, Relationship Issues, Bipolar Disorder',
    languages: ['English', 'Hindi'],
  },
  'marcus-vance': {
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
  'sarah-jenkins': {
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
};

const BookingPage = () => {
  const { slug } = useParams();
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '' });
  const [booking, setBooking] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [bookedSession, setBookedSession] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [createdClientId, setCreatedClientId] = useState(null);

  const SESSION_PRICE = 1500;

  useEffect(() => {
    const slugKey = (slug || '').toLowerCase().trim();
    api.get(`/therapist/${slugKey}`)
      .then(r => {
        if (r.data && (r.data._id || r.data.name)) {
          setTherapist(r.data);
        } else {
          setTherapist(DEFAULT_DOCTOR_MAP[slugKey] || DEFAULT_DOCTOR_MAP['priya-sharma']);
        }
      })
      .catch(() => {
        setTherapist(DEFAULT_DOCTOR_MAP[slugKey] || DEFAULT_DOCTOR_MAP['priya-sharma']);
      })
      .finally(() => setLoading(false));
    loadRazorpayScript();
  }, [slug]);

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlotsLoading(true);
    try {
      const { data } = await api.get(`/scheduling/${therapist._id}/slots`, { params: { date } });
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
    setStep(3);
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setBooking(true);
    try {
      const clientRes = await api.post('/clients', {
        name: clientForm.name,
        email: clientForm.email,
        phone: clientForm.phone,
        therapist_id: therapist._id,
      });
      setCreatedClientId(clientRes.data._id);

      const startTime = new Date(`${selectedDate}T${selectedSlot.startTime}:00`).toISOString();
      const sessionRes = await api.post('/scheduling/book', {
        therapistId: therapist._id,
        clientId: clientRes.data._id,
        startTime,
        duration: 50,
        timezone: 'Asia/Kolkata',
      });
      setBookedSession(sessionRes.data);
      setStep(5);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not proceed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Razorpay failed to load. Please check your internet connection.');
        return;
      }

      const { data: order } = await api.post('/payments/create-order', {
        amount: SESSION_PRICE,
        therapistId: therapist._id,
        clientId: createdClientId,
        sessionId: bookedSession._id,
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'Unfazed',
        description: `Session with ${therapist.name}`,
        order_id: order.orderId,
        prefill: {
          name: clientForm.name,
          email: clientForm.email,
          contact: clientForm.phone,
        },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentDbId: order.paymentId,
            });
            setPaymentInfo({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              amount: SESSION_PRICE,
            });
            setStep(6);
          } catch {
            alert('Payment verification failed. Please contact support.');
          }
        },
        modal: { ondismiss: () => setPaymentLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      const msg = err.response?.data?.message || err.message || 'Payment failed. Please try again.';
      alert(`Payment Error: ${msg}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (error) return (
    <div className="booking-page flex-center" style={{ minHeight: '100vh' }}>
      <div className="card text-center" style={{ maxWidth: 400 }}>
        <Frown size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
        <h2>Doctor Not Found</h2>
        <p className="text-muted mt-4">This link may be incorrect or expired.</p>
      </div>
    </div>
  );

  return (
    <div className="booking-page">
      <div className="booking-container">

        {/* ── Therapist Card ── */}
        <div className="booking-profile-card">
          <img
            src={therapist.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(therapist.name)}&background=6366f1&color=fff&size=200`}
            alt={therapist.name}
            className="booking-avatar-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(therapist.name)}&background=6366f1&color=fff&size=200`;
            }}
          />
          <div style={{ flex: 1 }}>
            <h1 className="booking-name">{therapist.name}</h1>
            {therapist.bio && <p className="booking-bio">{therapist.bio}</p>}
            <div className="booking-tags">
              {therapist.specializations?.map(s => <span key={s} className="badge badge-primary">{s}</span>)}
              {therapist.languages?.map(l => <span key={l} className="badge badge-neutral flex gap-1"><Globe size={12} /> {l}</span>)}
            </div>
          </div>
          <div className="booking-price-badge">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per Session</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--emerald-icon)' }}>₹{SESSION_PRICE.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* ── Step Indicator (steps 2–5) ── */}
        {step >= 2 && step < 6 && (
          <div className="booking-steps">
            {STEPS.slice(0, 4).map((label, i) => (
              <div key={label} className={`booking-step ${step > i + 2 ? 'done' : step === i + 2 ? 'active' : ''}`}>
                <div className="step-circle">{step > i + 2 ? '✓' : i + 1}</div>
                <span className="step-label">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Step 1: Book CTA ── */}
        {step === 1 && (
          <div className="card booking-step-card text-center" style={{ padding: 40 }}>
            <Calendar size={48} color="var(--accent-indigo)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ marginBottom: 8, color: '#0f172a' }}>Book a 1-on-1 Video Session</h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              Choose a date and time that works for you. Secure payment via Razorpay.
            </p>
            <button className="btn btn-primary btn-lg flex-center gap-2" style={{ margin: '0 auto' }} onClick={() => setStep(2)}>
              Get Started <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ── Step 2: Pick Date ── */}
        {step === 2 && (
          <div className="card booking-step-card">
            <h2 className="card-title flex gap-2"><Calendar size={20} /> Select a Date</h2>
            <p className="text-muted" style={{ marginBottom: 20, fontSize: '0.875rem' }}>
              Choose a date to see available session slots.
            </p>
            <input
              type="date"
              className="form-input"
              min={today}
              value={selectedDate}
              onChange={e => handleDateChange(e.target.value)}
              style={{ maxWidth: 240 }}
            />
          </div>
        )}

        {/* ── Step 3: Pick Slot ── */}
        {step === 3 && (
          <div className="card booking-step-card">
            <div className="flex-between mb-4">
              <h2 className="card-title flex gap-2"><Clock size={20} /> Available Slots</h2>
              <button className="btn btn-secondary btn-sm flex gap-1" onClick={() => { setStep(2); setSelectedDate(''); }}>
                <ArrowLeft size={14} /> Date
              </button>
            </div>
            <p className="text-muted" style={{ marginBottom: 16, fontSize: '0.875rem' }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            {slotsLoading ? (
              <div className="flex-center" style={{ padding: 40 }}><div className="spinner" /></div>
            ) : slots.length === 0 ? (
              <div className="empty-state text-center" style={{ padding: 40 }}>
                <Clock size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <h3>No slots available</h3>
                <p>Try another date.</p>
                <button className="btn btn-secondary mt-4" onClick={() => { setStep(2); setSelectedDate(''); }}>Pick Another Date</button>
              </div>
            ) : (
              <div className="slots-grid">
                {slots.map((slot, i) => (
                  <button
                    key={i}
                    className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                    onClick={() => { setSelectedSlot(slot); setStep(4); }}
                  >
                    {slot.startTime}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Client Info ── */}
        {step === 4 && (
          <div className="card booking-step-card">
            <div className="flex-between mb-4">
              <h2 className="card-title flex gap-2"><User size={20} /> Your Details</h2>
              <button className="btn btn-secondary btn-sm flex gap-1" onClick={() => setStep(3)}>
                <ArrowLeft size={14} /> Slots
              </button>
            </div>

            <div className="booking-summary">
              <div className="summary-row"><span className="flex gap-1.5 align-center"><Calendar size={16} color="var(--accent-indigo)" /> Date</span><strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
              <div className="summary-row"><span className="flex gap-1.5 align-center"><Clock size={16} color="var(--accent-indigo)" /> Time</span><strong>{selectedSlot?.startTime} IST</strong></div>
              <div className="summary-row"><span className="flex gap-1.5 align-center"><IndianRupee size={16} color="var(--emerald-icon)" /> Amount</span><strong style={{ color: 'var(--emerald-icon)' }}>₹{SESSION_PRICE.toLocaleString('en-IN')}</strong></div>
            </div>

            <form onSubmit={handleInfoSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="Your full name" required
                  value={clientForm.name} onChange={e => setClientForm({ ...clientForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="your@email.com" required
                  value={clientForm.email} onChange={e => setClientForm({ ...clientForm, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="9876543210"
                  value={clientForm.phone} onChange={e => setClientForm({ ...clientForm, phone: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg w-full flex-center gap-2" disabled={booking}>
                {booking ? 'Processing...' : <>Continue to Payment <ArrowRight size={18} /></>}
              </button>
            </form>
          </div>
        )}

        {/* ── Step 5: Payment ── */}
        {step === 5 && (
          <div className="card booking-step-card text-center" style={{ padding: 32 }}>
            <CreditCard size={48} color="var(--accent-indigo)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ marginBottom: 8, color: '#0f172a' }}>Complete Payment</h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              Your slot is reserved. Complete payment via Razorpay to lock it in.
            </p>

            <div className="booking-summary" style={{ textAlign: 'left', marginBottom: 28 }}>
              <div className="summary-row"><span className="flex gap-1.5 align-center"><User size={16} color="var(--accent-indigo)" /> Name</span><strong>{clientForm.name}</strong></div>
              <div className="summary-row"><span className="flex gap-1.5 align-center"><Calendar size={16} color="var(--accent-indigo)" /> Date</span><strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
              <div className="summary-row"><span className="flex gap-1.5 align-center"><Clock size={16} color="var(--accent-indigo)" /> Time</span><strong>{selectedSlot?.startTime} IST</strong></div>
              <div className="summary-row" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12, marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }} className="flex gap-1.5 align-center"><IndianRupee size={16} color="var(--emerald-icon)" /> Total</span>
                <strong style={{ fontSize: '1.3rem', color: 'var(--emerald-icon)' }}>₹{SESSION_PRICE.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg w-full flex-center gap-2"
              onClick={handlePayment}
              disabled={paymentLoading}
            >
              <CreditCard size={20} />
              {paymentLoading ? 'Opening Payment...' : `Pay ₹${SESSION_PRICE.toLocaleString('en-IN')} via Razorpay`}
            </button>

            <div className="payment-trust">
              <span className="flex gap-1"><ShieldCheck size={14} /> 256-bit SSL secured</span>
              <span>•</span>
              <span>Powered by Razorpay</span>
              <span>•</span>
              <span>UPI / Cards / NetBanking</span>
            </div>
          </div>
        )}

        {/* ── Step 6: Confirmed ── */}
        {step === 6 && (
          <div className="card booking-step-card text-center" style={{ padding: 40 }}>
            <Sparkles size={48} color="var(--emerald-icon)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, color: '#0f172a' }}>Booking Confirmed!</h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              Your session with <strong style={{ color: '#0f172a' }}>{therapist.name}</strong> is confirmed and payment received.
            </p>

            <div className="confirmed-details">
              <div className="confirmed-row"><span className="flex gap-1.5 align-center"><User size={16} color="var(--accent-indigo)" /> Client</span><strong>{clientForm.name}</strong></div>
              <div className="confirmed-row"><span className="flex gap-1.5 align-center"><Calendar size={16} color="var(--accent-indigo)" /> Date</span><strong>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>
              <div className="confirmed-row"><span className="flex gap-1.5 align-center"><Clock size={16} color="var(--accent-indigo)" /> Time</span><strong>{selectedSlot?.startTime} IST</strong></div>
              <div className="confirmed-row"><span className="flex gap-1.5 align-center"><IndianRupee size={16} color="var(--emerald-icon)" /> Paid</span><strong style={{ color: 'var(--emerald-icon)' }}>₹{SESSION_PRICE.toLocaleString('en-IN')}</strong></div>
              {paymentInfo?.paymentId && (
                <div className="confirmed-row"><span className="flex gap-1.5 align-center"><FileText size={16} color="var(--text-muted)" /> Txn ID</span><code style={{ fontSize: '0.75rem' }}>{paymentInfo.paymentId}</code></div>
              )}
            </div>

            {/* Video Call Link for Client */}
            <div style={{ marginTop: 24, padding: 20, background: 'var(--purple-soft)', borderRadius: 'var(--radius-md)', border: '1px solid #c7d2fe' }}>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, color: '#0f172a' }} className="flex-center gap-2">
                <Video size={20} color="var(--accent-indigo)" /> Your 1-on-1 Video Call Room
              </p>
              <a
                href={bookedSession?.meetingLink || `https://meet.jit.si/Unfazed-Session-${bookedSession?._id || Date.now()}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-indigo btn-lg w-full flex-center gap-2"
                style={{ textDecoration: 'none' }}
              >
                <Video size={20} /> Join 1-on-1 Video Call
              </a>
            </div>

            <p className="text-muted" style={{ marginTop: 16, fontSize: '0.875rem' }}>
              A confirmation & video link email has been sent to <strong>{clientForm.email}</strong>
            </p>

            <button className="btn btn-secondary mt-4" onClick={() => {
              setStep(1); setSelectedDate(''); setSelectedSlot(null);
              setClientForm({ name: '', email: '', phone: '' });
              setBookedSession(null); setPaymentInfo(null);
            }}>
              Book Another Session
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookingPage;
