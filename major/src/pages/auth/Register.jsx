import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { User, Stethoscope } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const { register: registerAuth, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'client' ? 'client' : 'client';
  
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true); setError('');
    try {
      const user = await registerAuth(data.name, data.email, data.password, role);
      if (role === 'client' || user?.role === 'client') {
        navigate('/');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true); setError('');
    try {
      const user = await googleLogin({
        name: role === 'client' ? 'Client User' : 'New Doctor Practitioner',
        email: `${role}.${Date.now()}@unfazed.com`,
        googleId: 'google-oauth-reg-' + Date.now(),
        role,
      });
      if (role === 'client' || user?.role === 'client') {
        navigate('/');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google Sign-Up failed.');
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

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">U</div>
          <span>Unfazed Portal</span>
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Register as a Client or Doctor Practitioner</p>

        {error && <div className="alert alert-error">{error}</div>}

        {/* ── Role Selector ── */}
        <div className="flex gap-2 mb-4" style={{ background: 'var(--bg-subtle, #1e293b)', padding: 4, borderRadius: 12 }}>
          <button
            type="button"
            className={`btn w-full flex-center gap-1.5 ${role === 'client' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '8px 12px' }}
            onClick={() => setRole('client')}
          >
            <User size={16} /> Client Account
          </button>
          <button
            type="button"
            className={`btn w-full flex-center gap-1.5 ${role === 'doctor' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '8px 12px' }}
            onClick={() => setRole('doctor')}
          >
            <Stethoscope size={16} /> Doctor Account
          </button>
        </div>

        <button
          type="button"
          className="btn-google-auth mb-3"
          onClick={handleGoogleSignUp}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Sign up with Google
        </button>

        <div className="auth-divider">
          <span>OR REGISTER WITH EMAIL</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              id="reg-name"
              className="form-input"
              type="text"
              placeholder={role === 'client' ? 'Aarav Mehta' : 'Dr. Priya Sharma'}
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="reg-email"
              className="form-input"
              type="email"
              placeholder={role === 'client' ? 'client@unfazed.com' : 'dr.priya@unfazed.com'}
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="reg-password"
              className="form-input"
              type="password"
              placeholder="Min 6 characters"
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <button id="reg-submit" type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? 'Creating account...' : `Register as ${role === 'client' ? 'Client' : 'Doctor'}`}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
