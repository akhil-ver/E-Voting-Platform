import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const res = await axiosClient.post('/auth/login', { username, password });
      if (res.success && res.data) {
        const authData = res.data;
        setToken(authData.token);
        setUser(authData);
        localStorage.setItem('token', authData.token);
        localStorage.setItem('user', JSON.stringify(authData));
        return { success: true, data: authData };
      }
      throw new Error(res.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyRecord = async (electionId, aadhaarLast4) => {
    return axiosClient.post('/auth/verify-record', { electionId, aadhaarLast4 });
  };

  const register = async (electionId, aadhaarLast4, password) => {
    setIsLoading(true);
    try {
      const res = await axiosClient.post('/auth/register', { electionId, aadhaarLast4, password });
      if (res.success && res.data) {
        const authData = res.data;
        setToken(authData.token);
        setUser(authData);
        localStorage.setItem('token', authData.token);
        localStorage.setItem('user', JSON.stringify(authData));
        return { success: true, data: authData };
      }
      throw new Error(res.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isVoter = user?.role === 'USER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        isVoter,
        login,
        verifyRecord,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
