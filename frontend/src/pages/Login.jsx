import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.usernameOrEmail || !formData.password) {
      setError(t('Please provide both username/email and password'));
      return;
    }
    setLoading(true);
    try {
      console.log('Submitting login:', { usernameOrEmail: formData.usernameOrEmail });
      await login(formData.usernameOrEmail, formData.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login Error:', err);
      const errorMsg = err.error || err.detail || err.non_field_errors?.[0] || t('Invalid username or password');
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
        <h2 className="text-3xl font-heading font-bold text-gray-800 mb-6 text-center">{t('Login to Lehae')}</h2>
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
            <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-gray-600">
              {t('Username or Email')}
            </label>
            <input
              type="text"
              name="usernameOrEmail"
              id="usernameOrEmail"
              value={formData.usernameOrEmail}
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
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full bg-blue-500 text-white hover:bg-red-500 hover:text-gray-800"
          >
            {loading ? t('Logging in...') : t('Login')}
          </Button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          {t('Not a member?')}{' '}
          <a href="/register" className="text-blue-500 hover:text-red-500 font-medium">
            {t('Register now')}
          </a>
        </p>
      </div>
    </motion.div>
  );
};

export default Login;