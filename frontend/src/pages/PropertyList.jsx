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
      const response = await axiosInstance.get('/api/properties/', { params: filters });
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      if (!Array.isArray(data)) {
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

      setProperties(mappedProperties);
    } catch (err) {
      if (err.response?.status === 401) {
        setError(t('Please log in to view properties'));
        navigate('/login');
      } else {
        setError(t('Failed to load properties'));
      }
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (propertyId, isFavorited) => {
    if (!propertyId) return;
    try {
      if (isFavorited) {
        await axiosInstance.delete('/api/favorites/', { data: { property: propertyId } });
      } else {
        await axiosInstance.post('/api/favorites/', { property: propertyId });
      }
      await fetchProperties();
    } catch (err) {
      if (err.response?.status === 401) {
        setError(t('Please log in to manage favorites'));
        navigate('/login');
      } else {
        setError(t('Failed to update favorite'));
      }
    }
  };

  if (loading) return <LoadingSpinner className="min-h-screen flex items-center justify-center" />;

  return (
    <div className="min-h-screen bg-neutral-50 pt-20 md:pt-24">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-heading font-bold text-secondary mb-10 text-center md:text-left"
        >
          {t('Explore Properties')}
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Filter - sidebar on desktop, collapsible on mobile */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 z-10">
              <PropertyFilter onFilter={setFilters} />
            </div>
          </div>

          {/* Listings */}
          <div className="lg:col-span-8 xl:col-span-9">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8 p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-center"
              >
                {error}
              </motion.div>
            )}

            {properties.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-white rounded-2xl shadow-sm"
              >
                <p className="text-xl text-gray-600 mb-6">{t('No properties found matching your criteria')}</p>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setFilters({})}
                >
                  {t('Clear Filters')}
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
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
      </div>
    </div>
  );
};

export default PropertyList;