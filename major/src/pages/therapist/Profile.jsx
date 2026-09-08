import { useState } from 'react';
import { User, Link, Copy, Save, Check, Image, Globe, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosInstance';

const Profile = () => {
  const { therapist } = useAuth();
  const [form, setForm] = useState({
    name: therapist?.name || '',
    profilePic: therapist?.profilePic || '',
    bio: therapist?.bio || '',
    phone: therapist?.phone || '',
    specializations: therapist?.specializations?.join(', ') || '',
    languages: therapist?.languages?.join(', ') || '',
    ogTitle: therapist?.ogTitle || '',
    ogDescription: therapist?.ogDescription || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.put('/therapist/profile', {
        ...form,
        specializations: form.specializations.split(',').map(s => s.trim()).filter(Boolean),
        languages: form.languages.split(',').map(s => s.trim()).filter(Boolean),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const brandedLink = `${window.location.origin}/${therapist?.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(brandedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 700 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-subtitle">Update your therapist profile and branded booking link</p>
        </div>
      </div>

      {/* Branded Link Card */}
      <div className="card mb-4" style={{ background: 'var(--purple-soft)', border: '1px solid #c7d2fe' }}>
        <h3 style={{ marginBottom: 8, fontSize: '0.9rem', color: 'var(--accent-indigo)' }} className="flex gap-2">
          <Link size={16} /> Your Branded Public Link
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <code style={{ background: '#ffffff', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', flex: 1, border: '1px solid var(--border-light)' }}>
            {brandedLink}
          </code>
          <button className="btn btn-secondary btn-sm flex gap-1" onClick={handleCopyLink}>
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: 8 }}>
          Share this link with clients for instant online booking.
        </p>
      </div>

      {/* Profile Form */}
      <div className="card">
        <h3 className="card-title flex gap-2"><User size={20} /> Edit Profile</h3>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label flex gap-1"><Image size={14} /> Profile Photo (DP Image URL)</label>
            <input className="form-input" placeholder="https://example.com/doctor-photo.jpg" value={form.profilePic} onChange={e => setForm({...form, profilePic: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-input" rows={3} placeholder="Tell clients about yourself..."
              value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Specializations <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma separated)</span></label>
              <input className="form-input" placeholder="Anxiety, CBT, Depression" value={form.specializations}
                onChange={e => setForm({...form, specializations: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label flex gap-1"><Globe size={14} /> Languages <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(comma separated)</span></label>
              <input className="form-input" placeholder="English, Hindi" value={form.languages}
                onChange={e => setForm({...form, languages: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label flex gap-1"><Phone size={14} /> Phone</label>
            <input className="form-input" placeholder="9876543210" value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Page Title (SEO / Open Graph)</label>
            <input className="form-input" placeholder="Dr. Priya Sharma — Therapist in Mumbai"
              value={form.ogTitle} onChange={e => setForm({...form, ogTitle: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Page Description</label>
            <textarea className="form-input" rows={2} placeholder="Book an online session..."
              value={form.ogDescription} onChange={e => setForm({...form, ogDescription: e.target.value})} style={{ resize: 'vertical' }} />
          </div>
          <div className="flex gap-3" style={{ alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary flex gap-2" disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
            {saved && <span className="badge badge-emerald flex gap-1"><Check size={14} /> Profile saved!</span>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
