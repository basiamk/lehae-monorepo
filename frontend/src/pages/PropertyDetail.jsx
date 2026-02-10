import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const PropertyDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/properties/${id}/`);
        console.log('Property Detail Response:', response.data);
        setProperty(response.data);
        setError('');
      } catch (err) {
        console.error('Fetch Property Error:', err.response?.data || err);
        setError(t('Failed to load property details'));
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, t]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-accent text-lg">{error}</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p className="text-neutral-600 text-lg">{t('Property not found')}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="container mx-auto px-4 py-16 bg-neutral-50"
    >
      <div className="relative">
        {property.images?.length > 0 ? (
          <motion.div
            className="relative h-[60vh] rounded-2xl overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={property.images[0].image_url}
              alt={property.area}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/50 to-transparent"></div>
          </motion.div>
        ) : property.image_url ? (
          <motion.div
            className="relative h-[60vh] rounded-2xl overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={property.image_url}
              alt={property.area}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/50 to-transparent"></div>
          </motion.div>
        ) : (
          <div className="h-[60vh] bg-neutral-100 rounded-2xl flex items-center justify-center">
            <span className="text-neutral-600 text-lg">{t('No Image')}</span>
          </div>
        )}
        <motion.div
          className="bg-white rounded-2xl shadow-neumorphic p-8 max-w-2xl mx-auto -mt-24 relative z-10"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-secondary mb-4 flex items-center">
            {property.area}
            {property.is_approved && (
              <span className="ml-3 bg-primary text-white text-sm font-semibold px-3 py-1 rounded-full">
                {t('Verified')}
              </span>
            )}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-neutral-600 mb-3">{t('District')}: <span className="font-medium text-secondary">{property.district}</span></p>
              <p className="text-neutral-600 mb-3">{t('Landlord')}: <span className="font-medium text-secondary">{property.landlord_username || 'Unknown'}</span></p>
              <p className="text-neutral-600 mb-3">{t('Rental Amount')}: <span className="font-medium text-primary">{property.rental_amount} LSL</span></p>
            </div>
            <div>
              <p className="text-neutral-600 mb-3">{t('Deposit')}: <span className="font-medium text-secondary">{property.deposit ? `${property.deposit} LSL` : 'Not specified'}</span></p>
              <p className="text-neutral-600 mb-3">{t('Viewing Fee')}: <span className="font-medium text-secondary">{property.viewing_fee ? `${property.viewing_fee} LSL` : 'Free'}</span></p>
              <p className="text-neutral-600 mb-3">{t('Status')}: <span className="font-medium text-secondary">{t(property.status)}</span></p>
            </div>
          </div>
          <p className="text-neutral-600">{t('Description')}: <span className="font-medium text-secondary">{property.description || 'No description available'}</span></p>
        </motion.div>
      </div>
      {property.images?.length > 1 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {property.images.slice(1).map((img) => (
            <img
              key={img.id}
              src={img.image_url}
              alt={property.area}
              className="w-full h-64 object-cover rounded-2xl shadow-neumorphic"
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PropertyDetail;