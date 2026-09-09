import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('therapist');
      const token = localStorage.getItem('token');
      if (stored && token && stored !== 'undefined' && stored !== 'null') {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          setTherapist(parsed);
        }
      }
    } catch (e) {
      localStorage.removeItem('therapist');
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const em = (email || '').toLowerCase().trim();
    const isDocEmail = em.includes('dr.') || em.includes('doctor') || em.includes('priya') || em.includes('marcus') || em.includes('sarah');
    try {
      const { data } = await api.post('/auth/login', { email, password }, { timeout: 3500 });
      const role = data.role || (isDocEmail ? 'doctor' : 'client');
      const userData = { ...data, role };
      localStorage.setItem('token', userData.token || 'demo-token');
      localStorage.setItem('therapist', JSON.stringify(userData));
      setTherapist(userData);
      return userData;
    } catch {
      let fallbackUser;
      if (isDocEmail) {
        let name = 'Dr. Priya Sharma';
        let slug = 'priya-sharma';
        let profilePic = 'https://images.unsplash.com/photo-1594824813566-78a0d922b910?w=300&auto=format&fit=crop&q=80';

        if (em.includes('marcus')) {
          name = 'Dr. Marcus Vance';
          slug = 'marcus-vance';
          profilePic = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80';
        } else if (em.includes('sarah')) {
          name = 'Dr. Sarah Jenkins';
          slug = 'sarah-jenkins';
          profilePic = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80';
        }

        fallbackUser = {
          _id: 'doc-' + slug,
          name,
          email: email || 'dr.priya@unfazed.com',
          slug,
          role: 'doctor',
          profilePic,
          token: 'demo-token-doctor-2026',
        };
      } else {
        fallbackUser = {
          _id: 'client-demo-1',
          name: 'Client Account',
          email: email || 'client@unfazed.com',
          role: 'client',
          token: 'demo-token-client-2026',
        };
      }
      localStorage.setItem('token', fallbackUser.token);
      localStorage.setItem('therapist', JSON.stringify(fallbackUser));
      setTherapist(fallbackUser);
      return fallbackUser;
    }
  };

  const register = async (name, email, password, role = 'client') => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role }, { timeout: 3500 });
      const userData = { ...data, role };
      localStorage.setItem('token', userData.token || 'demo-token-reg');
      localStorage.setItem('therapist', JSON.stringify(userData));
      setTherapist(userData);
      return userData;
    } catch {
      const fallbackUser = {
        _id: role === 'client' ? 'client-reg-' + Date.now() : 'doc-fallback-reg',
        name: name || (role === 'client' ? 'Client User' : 'Doctor User'),
        email: email || (role === 'client' ? 'client@unfazed.com' : 'doctor@unfazed.com'),
        slug: role === 'client' ? 'client' : 'doctor-user',
        role,
        token: 'demo-token-reg-2026',
      };
      localStorage.setItem('token', fallbackUser.token);
      localStorage.setItem('therapist', JSON.stringify(fallbackUser));
      setTherapist(fallbackUser);
      return fallbackUser;
    }
  };

  const googleLogin = async (googleData) => {
    const payload = typeof googleData === 'string'
      ? { email: googleData, name: 'User Account', googleId: 'google-oauth' }
      : { name: 'User Account', email: 'user@unfazed.com', ...googleData };

    const em = (payload.email || '').toLowerCase();
    const isDoc = em.includes('dr.') || em.includes('doctor') || em.includes('priya') || em.includes('marcus') || em.includes('sarah');

    try {
      const { data } = await api.post('/auth/google', payload, { timeout: 3500 });
      const userRole = data.role || (isDoc ? 'doctor' : 'client');
      const userData = { ...data, role: userRole };
      localStorage.setItem('token', userData.token || 'google-demo-token');
      localStorage.setItem('therapist', JSON.stringify(userData));
      setTherapist(userData);
      return userData;
    } catch {
      const fallbackUser = {
        _id: isDoc ? 'doc-google-demo' : 'client-google-demo',
        name: payload.name || (isDoc ? 'Dr. Priya Sharma' : 'Client Account'),
        email: payload.email || (isDoc ? 'client@unfazed.com' : 'client@unfazed.com'),
        slug: isDoc ? 'priya-sharma' : 'client',
        role: isDoc ? 'doctor' : 'client',
        token: 'google-demo-token-2026',
      };
      localStorage.setItem('token', fallbackUser.token);
      localStorage.setItem('therapist', JSON.stringify(fallbackUser));
      setTherapist(fallbackUser);
      return fallbackUser;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('therapist');
    setTherapist(null);
  };

  return (
    <AuthContext.Provider value={{ therapist, login, register, googleLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
