import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    isLandlord: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError(t('Passwords do not match'));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError(t('Invalid email format'));
      return;
    }
    setLoading(true);
    try {
      console.log('Submitting registration:', formData);
      await register(formData.username, formData.email, formData.password, formData.isLandlord);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration Error:', err);
      const errorMsg = err.username?.[0] || 
                       err.email?.[0] || 
                       err.password?.[0] || 
                       err.non_field_errors?.[0] || 
                       err.error || 
                       t('Registration failed');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4"
    >
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-3xl font-heading font-bold text-gray-800 mb-6 text-center">{t('Join Lehae')}</h2>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg"
          >
            {error}
          </motion.div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-600">
              {t('Username')}
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="mt-1 w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-600">
              {t('Email')}
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-600">
              {t('Password')}
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600">
              {t('Confirm Password')}
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="mt-1 w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isLandlord"
              id="isLandlord"
              checked={formData.isLandlord}
              onChange={handleChange}
              className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isLandlord" className="ml-2 text-sm font-medium text-gray-600">
              {t('Register as Landlord')}
            </label>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full bg-blue-500 text-white hover:bg-red-500 hover:text-gray-800"
          >
            {loading ? t('Registering...') : t('Register')}
          </Button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          {t('Already a member?')}{' '}
          <a href="/login" className="text-blue-500 hover:text-red-500 font-medium">
            {t('Login now')}
          </a>
        </p>
      </div>
    </motion.div>
  );
};

export default Register;