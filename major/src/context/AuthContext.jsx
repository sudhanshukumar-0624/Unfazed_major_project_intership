import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('therapist');
    const token = localStorage.getItem('token');
    if (stored && token) {
      setTherapist(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('therapist', JSON.stringify(data));
    setTherapist(data);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('therapist', JSON.stringify(data));
    setTherapist(data);
    return data;
  };

  const googleLogin = async (googleData) => {
    const payload = typeof googleData === 'string'
      ? { email: googleData, name: 'Dr. Priya Sharma', googleId: 'google-oauth-priya' }
      : { name: 'Dr. Priya Sharma', email: 'priyasharma@unfazed.com', ...googleData };

    const { data } = await api.post('/auth/google', payload);
    localStorage.setItem('token', data.token);
    localStorage.setItem('therapist', JSON.stringify(data));
    setTherapist(data);
    return data;
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
