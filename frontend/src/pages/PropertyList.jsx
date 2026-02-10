import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios.js';
import PropertyFilter from '../components/property/PropertyFilter.jsx';
import PropertyCard from '../components/property/PropertyCard.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const PropertyList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching properties with filters:', filters);
      const token = localStorage.getItem('access_token');
      console.log('Access token:', token ? 'Present' : 'Missing');

      const response = await axiosInstance.get('/api/properties/', { params: filters });
      console.log('API Response:', JSON.stringify(response.data, null, 2));

      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      if (!Array.isArray(data)) {
        console.error('Expected array, received:', data);
        setError(t('Unexpected response format from server'));
        setProperties([]);
        return;
      }

      const mappedProperties = data.map(item => ({
        id: item.id || null,
        area: item.area || 'Unknown',
        district: item.district || 'Unknown',
        rental_amount: item.rental_amount || 0,
        is_approved: item.is_approved || false,
        is_favorited: item.is_favorited || false,
        images: Array.isArray(item.images) && item.images.length > 0 
          ? item.images.map(img => ({
              id: img.id,
              image_url: img.image_url || `${axiosInstance.defaults.baseURL}/media/${img.image?.name?.split('/').pop() || 'default.jpg'}`,
              uploaded_at: img.uploaded_at,
            }))
          : item.image_url
            ? [{ image_url: item.image_url || `${axiosInstance.defaults.baseURL}/media/${item.image?.name?.split('/').pop() || 'default.jpg'}` }]
            : [{ image_url: `${axiosInstance.defaults.baseURL}/media/default.jpg` }],
        landlord_username: item.landlord_username || 'Unknown',
        deposit: item.deposit != null ? item.deposit : null,
        viewing_fee: item.viewing_fee != null ? item.viewing_fee : null,
        status: item.status || 'unknown',
        description: item.description || 'No description available',
      }));

      console.log('Mapped properties:', JSON.stringify(mappedProperties, null, 2));
      setProperties(mappedProperties);
    } catch (err) {
      console.error('Fetch Properties Error:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError(t('Please log in to view properties'));
        navigate('/login');
      } else {
        setError(t('Failed to load properties: ') + (err.response?.data?.detail || err.message));
      }
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (propertyId, isFavorited) => {
    if (!propertyId) {
      console.error('Property ID is undefined');
      setError(t('Cannot toggle favorite: Invalid property'));
      return;
    }

    try {
      console.log(`Toggling favorite for property ${propertyId}: ${isFavorited ? 'Remove' : 'Add'}`);
      if (isFavorited) {
        await axiosInstance.delete('/api/favorites/', { data: { property: propertyId } });
      } else {
        await axiosInstance.post('/api/favorites/', { property: propertyId });
      }
      await fetchProperties(); // Refresh properties to update is_favorited
    } catch (err) {
      console.error('Favorite Toggle Error:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError(t('Please log in to manage favorites'));
        navigate('/login');
      } else {
        setError(t('Failed to update favorite: ') + (err.response?.data?.detail || err.message));
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="container mx-auto px-4 py-16 bg-neutral-50"
    >
      <h1 className="text-4xl md:text-5xl font-heading font-bold text-secondary mb-12">
        {t('Explore Properties')}
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative">
        <motion.div
          className="lg:col-span-2 bg-white rounded-2xl shadow-neumorphic p-8 sticky top-4 z-10"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <PropertyFilter onFilter={setFilters} />
        </motion.div>
        <div className="lg:col-span-3 z-0">
          {error && (
            <motion.div
              className="mb-8 p-4 bg-red-50 text-red-600 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {error}
            </motion.div>
          )}
          {properties.length === 0 ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-neutral-600 text-lg">{t('No properties found matching your criteria')}</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyList;