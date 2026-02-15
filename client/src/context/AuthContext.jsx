import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await api.get('/api/auth/me');
        const userPhone = localStorage.getItem('userPhone');
        const userData = { ...response.data.user, phoneNumber: userPhone };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('userPhone');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, role = 'PATIENT', phoneNumber = '') => {
    try {
      setError('');
      setLoading(true);
      const endpoint = role === 'DOCTOR' ? '/api/auth/doctor/login' : '/api/auth/patient/login';
      const response = await api.post(endpoint, { email, password, phoneNumber });
      const { token, user } = response.data;
      
      const userWithPhone = { ...user, phoneNumber };
      
      localStorage.setItem('token', token);
      localStorage.setItem('userPhone', phoneNumber);
      localStorage.setItem('user', JSON.stringify(userWithPhone));
      setUser(userWithPhone);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password, role = 'PATIENT', additionalData = {}) => {
    try {
      setError('');
      setLoading(true);
      const endpoint = role === 'DOCTOR' ? '/api/auth/doctor/signup' : '/api/auth/patient/signup';
      const response = await api.post(endpoint, { name, email, password, ...additionalData });
      const { token, user } = response.data;
      
      const userWithPhone = { ...user, phoneNumber: additionalData.phoneNumber };
      
      localStorage.setItem('token', token);
      localStorage.setItem('userPhone', additionalData.phoneNumber || '');
      localStorage.setItem('user', JSON.stringify(userWithPhone));
      setUser(userWithPhone);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('user');
    setUser(null);
    setError('');
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};