import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, User, Key, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import './Auth.css';

const PRESET_ACCOUNTS = [
  {
    roleLabel: '🩺 Doctor (Priya)',
    name: 'Dr. Priya Sharma',
    email: 'dr.priya@unfazed.com',
    password: 'doctor123',
    targetRole: 'doctor',
    avatar: 'https://images.unsplash.com/photo-1594824813566-78a0d922b910?w=100&auto=format&fit=crop&q=80',
  },
  {
    roleLabel: '🩺 Doctor (Marcus)',
    name: 'Dr. Marcus Vance',
    email: 'dr.marcus@unfazed.com',
    password: 'doctor123',
    targetRole: 'doctor',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop&q=80',
  },
  {
    roleLabel: '🩺 Doctor (Sarah)',
    name: 'Dr. Sarah Jenkins',
    email: 'dr.sarah@unfazed.com',
    password: 'doctor123',
    targetRole: 'doctor',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop&q=80',
  },
  {
    roleLabel: '👤 Client Access',
    name: 'Client Portal User',
    email: 'client@unfazed.com',
    password: 'client123',
    targetRole: 'client',
    avatar: 'https://ui-avatars.com/api/?name=Client+User&background=10b981&color=fff',
  },
];

const Login = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true); setError('');
    try {
      const user = await login(data.email, data.password);
      if (user?.role === 'client' || data.email.toLowerCase().includes('client')) {
        navigate('/');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (preset) => {
    setValue('email', preset.email);
    setValue('password', preset.password);
    onSubmit({ email: preset.email, password: preset.password });
  };

  const handleGoogleSignIn = async () => {
    setLoading(true); setError('');
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    try {
      if (clientId && window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const base64Url = response.credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
              const payload = JSON.parse(jsonPayload);

              const user = await googleLogin({
                name: payload.name,
                email: payload.email,
                googleId: payload.sub,
                profilePic: payload.picture,
              });

              if (user?.role === 'client' || payload.email.toLowerCase().includes('client')) {
                navigate('/');
              } else {
                navigate('/dashboard');
              }
            } catch (e) {
              setError('Google OAuth verification failed.');
            }
          }
        });
        window.google.accounts.id.prompt();
      } else {
        const user = await googleLogin({
          name: 'Dr. Priya Sharma',
          email: 'priya.google@unfazed.com',
          googleId: 'google-oauth-priya-' + Date.now(),
          profilePic: 'https://images.unsplash.com/photo-1594824813566-78a0d922b910?w=300&auto=format&fit=crop&q=80',
        });
        if (user?.role === 'client') {
          navigate('/');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb orb1" />
        <div className="auth-orb orb2" />
      </div>

      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">U</div>
          <span>Unfazed Portal</span>
        </div>
        <h1 className="auth-title">Practitioner & Client Access</h1>
        <p className="auth-subtitle">Select a preset account or enter your credentials to log in.</p>

        {error && <div className="alert alert-error">{error}</div>}

        {/* ── 1-Click Quick Preset Accounts ── */}
        <div className="preset-quick-section mb-4">
          <div className="flex-between mb-2">
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="flex align-center gap-1">
              <Sparkles size={14} /> 1-Click Quick Login
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-routes by role</span>
          </div>
          <div className="preset-grid">
            {PRESET_ACCOUNTS.map((preset) => (
              <button
                key={preset.email}
                type="button"
                className="btn-preset-card"
                onClick={() => handleQuickLogin(preset)}
                disabled={loading}
              >
                <img src={preset.avatar} alt={preset.name} className="preset-avatar" />
                <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  <div className="preset-name">{preset.name}</div>
                  <div className="preset-role">{preset.targetRole === 'doctor' ? 'Doctor Dashboard' : 'Client View'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="btn-google-auth mb-3"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Sign in with Google
        </button>

        <div className="auth-divider">
          <span>OR SIGN IN WITH EMAIL & PASSWORD</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">User ID / Email</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder="dr.priya@unfazed.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <button id="login-submit" type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create practitioner account</Link>
        </p>

        {/* ── Generated Credentials Reference Table ── */}
        <div className="preset-table-box mt-4">
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }} className="flex align-center gap-1.5">
            <ShieldCheck size={16} color="var(--primary-light)" /> Preset Account Credentials List
          </div>
          <table className="preset-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>User ID (Email)</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Dr. Priya</strong></td>
                <td><code>dr.priya@unfazed.com</code></td>
                <td><code>doctor123</code></td>
              </tr>
              <tr>
                <td><strong>Dr. Marcus</strong></td>
                <td><code>dr.marcus@unfazed.com</code></td>
                <td><code>doctor123</code></td>
              </tr>
              <tr>
                <td><strong>Dr. Sarah</strong></td>
                <td><code>dr.sarah@unfazed.com</code></td>
                <td><code>doctor123</code></td>
              </tr>
              <tr>
                <td><strong>Client User</strong></td>
                <td><code>client@unfazed.com</code></td>
                <td><code>client123</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Login;

