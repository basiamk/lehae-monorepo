import React, { useState } from 'react';
import axiosInstance from '../../utils/axios';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    is_landlord: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        profile: {
          is_landlord: formData.is_landlord,
        },
      };
      console.log('Registration Payload:', JSON.stringify(payload, null, 2));
      const response = await axiosInstance.post('/api/register/', JSON.stringify(payload));
      console.log('Registration Response:', response.data);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setSuccess('Registration successful! Please log in.');
      setFormData({ username: '', email: '', password: '', confirm_password: '', is_landlord: false });
    } catch (err) {
      console.error('Registration Error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        url: err.config?.url,
      });
      setError(JSON.stringify(err.response?.data, null, 2) || 'Registration failed. Check console for details.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md"><pre>{error}</pre></div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_landlord"
              checked={formData.is_landlord}
              onChange={handleChange}
              className="mr-2"
            />
            Register as Landlord
          </label>
        </div>
        <button type="submit" className="w-full btn-primary">
          Register
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;