import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from "../contexts/AuthContext.jsx";
import { propertyAPI } from '../lib/api.js';
import Button from '../components/common/Button.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const ManageListings = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editProperty, setEditProperty] = useState(null);
  const [formData, setFormData] = useState({
    area: '',
    district: '',
    rental_amount: '',
    deposit: '',
    viewing_fee: '',
    status: 'vacant',
    description: '',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user?.is_landlord) {
      setLoading(false);
      setError(t('Only landlords can manage listings'));
      return;
    }
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const data = await propertyAPI.getProperties({ landlord: 'self' });
        console.log('Manage Listings Response:', data);
        setProperties(data);
        setError('');
      } catch (err) {
        console.error('Fetch Properties Error:', err.response?.data || err);
        setError(t('Failed to load listings'));
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, [isAuthenticated, user, t]);

  const handleEditClick = (property) => {
    setEditProperty(property.id);
    setFormData({
      area: property.area || '',
      district: property.district || '',
      rental_amount: property.rental_amount || '',
      deposit: property.deposit || '',
      viewing_fee: property.viewing_fee || '',
      status: property.status || 'vacant',
      description: property.description || '',
    });
    setImageFiles([]);
    setImageError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const validFormats = ['image/jpeg', 'image/png'];
    const newFiles = files.filter(file => validFormats.includes(file.type) && file.size <= 5 * 1024 * 1024);
    if (newFiles.length + (properties.find(p => p.id === editProperty)?.images.length || 0) > 3) {
      setImageError(t('Maximum 3 images allowed'));
      return;
    }
    setImageFiles(newFiles);
    setImageError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        ...formData,
        rental_amount: parseFloat(formData.rental_amount) || 0,
        deposit: formData.deposit ? parseFloat(formData.deposit) : null,
        viewing_fee: formData.viewing_fee ? parseFloat(formData.viewing_fee) : null,
      };
      console.log('Updating property with data:', updatedData);
      const response = await propertyAPI.updateProperty(editProperty, updatedData);
      console.log('Update Property Response:', response);

      // Upload images
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('property_id', editProperty);
        console.log(`Uploading image for property ${editProperty}`);
        const imageResponse = await propertyAPI.uploadPropertyImage(formData);
        console.log('Upload Image Response:', imageResponse);
      }

      // Refresh properties
      const updatedProperties = await propertyAPI.getProperties({ landlord: 'self' });
      setProperties(updatedProperties);
      setEditProperty(null);
      setImageFiles([]);
      setError('');
    } catch (err) {
      console.error('Update Property Error:', err.response?.data || err);
      setError(t('Failed to update property'));
    }
  };

  const handleDelete = async (propertyId) => {
    try {
      console.log(`Deleting property ${propertyId}`);
      await propertyAPI.deleteProperty(propertyId);
      setProperties(properties.filter(p => p.id !== propertyId));
    } catch (err) {
      console.error('Delete Property Error:', err.response?.data || err);
      setError(t('Failed to delete property'));
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      console.log(`Deleting image ${imageId}`);
      await propertyAPI.deletePropertyImage(imageId);
      const updatedProperties = await propertyAPI.getProperties({ landlord: 'self' });
      setProperties(updatedProperties);
      setError('');
    } catch (err) {
      console.error('Delete Image Error:', err.response?.data || err);
      setImageError(t('Failed to delete image'));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !editProperty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()}>{t('refresh')}</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('Manage Listings')}</h1>
      {properties.length > 0 ? (
        <div className="space-y-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white p-6 rounded-lg shadow">
              {editProperty === property.id ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">{t('Area')}</label>
                    <input
                      type="text"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">{t('District')}</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">{t('Rental Amount (LSL)')}</label>
                    <input
                      type="number"
                      name="rental_amount"
                      value={formData.rental_amount}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">{t('Deposit (LSL)')}</label>
                    <input
                      type="number"
                      name="deposit"
                      value={formData.deposit}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">{t('Viewing Fee (LSL)')}</label>
                    <input
                      type="number"
                      name="viewing_fee"
                      value={formData.viewing_fee}
                      onChange={handleInputChange}
                      className="input input-bordered w-full"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">{t('Status')}</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="select select-bordered w-full"
                    >
                      <option value="inactive">{t('Inactive')}</option>
                      <option value="vacant">{t('Vacant')}</option>
                      <option value="occupied">{t('Occupied')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">{t('Description')}</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="textarea textarea-bordered w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">{t('Images (Max 3, JPEG/PNG)')}</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      onChange={handleImageChange}
                      className="file-input file-input-bordered w-full"
                    />
                    {imageError && <p className="text-error text-sm mt-1">{imageError}</p>}
                    {property.images?.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {property.images.map((img) => (
                          <div key={img.id} className="relative">
                            <img src={img.image_url} alt={property.area} className="w-full h-24 object-cover rounded" />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(img.id)}
                              className="absolute top-0 right-0 btn btn-error btn-xs rounded-full"
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" variant="primary">{t('Save')}</Button>
                    <Button type="button" variant="secondary" onClick={() => setEditProperty(null)}>{t('Cancel')}</Button>
                  </div>
                </form>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold">{property.area}</h3>
                  <p className="text-gray-600">{property.district}</p>
                  <p className="text-lg font-bold">{property.rental_amount} LSL</p>
                  <p className="text-gray-600">{t('Deposit')}: {property.deposit ? `${property.deposit} LSL` : 'Not specified'}</p>
                  <p className="text-gray-600">{t('Viewing Fee')}: {property.viewing_fee ? `${property.viewing_fee} LSL` : 'Free'}</p>
                  <p className="text-sm text-gray-500">{t(property.status)}</p>
                  {property.images?.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {property.images.map((img) => (
                        <img key={img.id} src={img.image_url} alt={property.area} className="w-full h-24 object-cover rounded" />
                      ))}
                    </div>
                  ) : property.image_url ? (
                    <img src={property.image_url} alt={property.area} className="w-full h-48 object-cover rounded mt-2" />
                  ) : null}
                  <div className="flex space-x-2 mt-4">
                    <Button onClick={() => handleEditClick(property)} variant="primary">{t('Edit')}</Button>
                    <Button onClick={() => handleDelete(property.id)} variant="danger">{t('Delete')}</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">{t('No listings found')}</p>
      )}
    </div>
  );
};

export default ManageListings;