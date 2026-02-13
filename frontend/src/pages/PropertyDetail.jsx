import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import Button from '../components/common/Button.jsx';
import { Heart, Share2, MapPin, Home, DollarSign, ShieldCheck } from 'lucide-react';

const PropertyDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/properties/${id}/`);
        setProperty(response.data);
        setError('');
      } catch (err) {
        setError(t('Failed to load property details'));
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id, t]);

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen flex items-center justify-center" />;

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-lg mx-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{error || t('Property not found')}</h2>
          <Link to="/properties">
            <Button variant="primary" size="lg">{t('Browse Properties')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = property.images?.length > 0 ? property.images : [{ image_url: property.image_url }];
  const mainImage = images[currentImage]?.image_url;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-neutral-50 pb-20"
    >
      {/* Image Gallery */}
      <section className="relative">
        <div className="h-[70vh] md:h-[85vh] bg-black relative overflow-hidden">
          <motion.img
            key={currentImage}
            src={mainImage}
            alt={`${property.area} - ${property.district}`}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
              {currentImage + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute -bottom-16 left-0 right-0 z-10">
            <div className="container mx-auto px-4">
              <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`flex-none snap-center w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden border-4 transition-all ${
                      currentImage === idx ? 'border-primary scale-105' : 'border-white/50'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-24 md:pt-32">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 -mt-20 relative z-10"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
              <div>
                <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-secondary mb-3">
                  {property.area}, {property.district}
                </h1>
                <p className="text-xl text-gray-600 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {property.district}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <p className="text-4xl md:text-5xl font-bold text-primary">
                  M {property.rental_amount.toLocaleString()}
                  <span className="text-xl md:text-2xl font-normal text-gray-600"> / {t('month')}</span>
                </p>
                <div className="flex gap-3">
                  <button className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                    <Heart className="w-6 h-6 text-gray-600 hover:text-red-500" />
                  </button>
                  <button className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                    <Share2 className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-neutral-50 p-6 rounded-2xl text-center">
                <DollarSign className="w-10 h-10 mx-auto mb-3 text-primary" />
                <p className="text-sm text-gray-600">{t('Rental')}</p>
                <p className="text-xl font-bold text-secondary">M {property.rental_amount.toLocaleString()}</p>
              </div>
              <div className="bg-neutral-50 p-6 rounded-2xl text-center">
                <Home className="w-10 h-10 mx-auto mb-3 text-primary" />
                <p className="text-sm text-gray-600">{t('Status')}</p>
                <p className="text-xl font-bold text-secondary capitalize">{t(property.status)}</p>
              </div>
              <div className="bg-neutral-50 p-6 rounded-2xl text-center">
                {property.is_approved && (
                  <>
                    <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-green-500" />
                    <p className="text-sm text-gray-600">{t('Verified')}</p>
                    <p className="text-xl font-bold text-green-600">{t('Yes')}</p>
                  </>
                )}
              </div>
              <div className="bg-neutral-50 p-6 rounded-2xl text-center">
                <p className="text-sm text-gray-600">{t('Landlord')}</p>
                <p className="text-xl font-bold text-secondary">{property.landlord_username || 'Private'}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-secondary mb-6">
                {t('About this property')}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                {property.description || t('A beautiful property in a prime location, perfect for comfortable living. Contact the landlord for more details.')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                size="lg"
                className="py-6 px-12 text-xl bg-primary hover:bg-primary-dark"
              >
                {t('Contact Landlord')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="py-6 px-12 text-xl border-2 border-gray-300 hover:bg-gray-50"
              >
                {t('Add to Favorites')}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyDetail;