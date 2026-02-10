import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axios.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const register = async (username, email, password, is_landlord) => {
    try {
      const response = await axiosInstance.post('/api/register/', {
        username,
        email,
        password,
        profile: { is_landlord, is_verified: false },
      });
      console.log('Registration Response:', response.data);
      const userData = response.data.user || { username, email, is_landlord };
      setUser(userData);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      return response.data;
    } catch (error) {
      console.error('Registration Error:', error.response?.data || error.message);
      throw error.response?.data || { error: 'Registration failed' };
    }
  };

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await axiosInstance.post('/api/token/', { username: usernameOrEmail, password });
      console.log('Login Response:', response.data);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      // Fetch user profile to get full user data
      const profileResponse = await axiosInstance.get('/api/profile/');
      const userData = profileResponse.data || { username: usernameOrEmail, is_landlord: false };
      setUser(userData);
      console.log('Set User:', userData);
      return userData;
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
      throw error.response?.data || { error: 'Invalid username or password' };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    console.log('Logged out, tokens cleared');
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      axiosInstance.get('/api/profile/')
        .then((response) => {
          console.log('Profile Fetched:', response.data);
          setUser(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Profile Fetch Error:', error.response?.data || error.message);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const isAuthenticated = !!user;

  const value = { user, loading, isAuthenticated, register, login, logout };

  return (
    <AuthContext.Provider value={value}>
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