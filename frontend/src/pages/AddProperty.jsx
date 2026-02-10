import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios.js';

const AddProperty = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    area: '',
    district: '',
    rental_amount: '',
    deposit: '',
    viewing_fee: '',
    status: 'vacant',
    description: '',
    image: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData({ ...formData, image: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const data = new FormData();
      data.append('area', formData.area);
      data.append('district', formData.district);
      data.append('rental_amount', formData.rental_amount);
      data.append('deposit', formData.deposit);
      data.append('viewing_fee', formData.viewing_fee);
      data.append('status', formData.status);
      data.append('description', formData.description);
      if (formData.image) {
        data.append('image', formData.image);
      }
      const response = await axiosInstance.post('/api/properties/', data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Add Property Response:', response.data);
      setSuccess(t('Property added successfully!'));
      navigate('/dashboard');
    } catch (err) {
      console.error('Add Property Error:', err.response?.data || err);
      setError(err.response?.data?.error || t('Failed to add property'));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">{t('Add Property')}</h2>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">{success}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('Area')}</label>
          <input
            type="text"
            name="area"
            value={formData.area}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('District')}</label>
          <input
            type="text"
            name="district"
            value={formData.district}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('Rental Amount')}</label>
          <input
            type="number"
            name="rental_amount"
            value={formData.rental_amount}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('Deposit')}</label>
          <input
            type="number"
            name="deposit"
            value={formData.deposit}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('Viewing Fee')}</label>
          <input
            type="number"
            name="viewing_fee"
            value={formData.viewing_fee}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('Status')}</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="vacant">{t('Vacant')}</option>
            <option value="occupied">{t('Occupied')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('Description')}</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            rows="4"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('Image')}</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">
          {t('Add Property')}
        </button>
      </form>
    </div>
  );
};

export default AddProperty;