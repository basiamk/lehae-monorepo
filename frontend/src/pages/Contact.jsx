import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ tenant_name: '', tenant_email: '', message: '', property_id: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/contact/', formData);
      setSuccess(t('Message sent successfully!'));
    } catch (err) {
      setError(t('Failed to send message'));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">{t('Contact')}</h2>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {success && <div className="mb-4 text-green-600">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">{t('Name')}</label>
          <input
            type="text"
            name="tenant_name"
            value={formData.tenant_name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">{t('Email')}</label>
          <input
            type="email"
            name="tenant_email"
            value={formData.tenant_email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">{t('Property ID')}</label>
          <input
            type="text"
            name="property_id"
            value={formData.property_id}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">{t('Message')}</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="4"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">
          {t('Send')}
        </button>
      </form>
    </div>
  );
};

export default Contact;