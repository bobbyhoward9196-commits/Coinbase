import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gts_user')) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gts_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me').then((r) => {
      setUser(r.data);
      localStorage.setItem('gts_user', JSON.stringify(r.data));
    }).catch(() => {
      localStorage.removeItem('gts_token');
      localStorage.removeItem('gts_user');
      setUser(null);
    }).finally(() => setLoading(false));
  }, []);

  const login = async (email, password, role) => {
    const { data } = await api.post('/auth/login', { email, password, role });
    // If OTP required (customer flow), do not set session yet — return the challenge
    if (data.otp_required) return { otp_required: true, email: data.email, masked_email: data.masked_email, message: data.message };
    localStorage.setItem('gts_token', data.token);
    localStorage.setItem('gts_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const verifyOtp = async (email, otp) => {
    const { data } = await api.post('/auth/verify-otp', { email, otp });
    localStorage.setItem('gts_token', data.token);
    localStorage.setItem('gts_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const resendOtp = async (email) => {
    const { data } = await api.post('/auth/resend-otp', { email });
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('gts_token', data.token);
    localStorage.setItem('gts_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('gts_token');
    localStorage.removeItem('gts_user');
    setUser(null);
  };

  const refresh = async () => {
    const { data } = await api.get('/auth/me');
    setUser(data);
    localStorage.setItem('gts_user', JSON.stringify(data));
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, resendOtp, register, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
