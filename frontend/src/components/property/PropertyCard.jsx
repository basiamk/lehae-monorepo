import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PropertyCard = ({ property, onFavoriteToggle }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    id,
    area,
    district,
    rental_amount,
    is_favorited,
    images,
    landlord_username,
    status,
    description,
  } = property;

  const handleClick = () => id && navigate(`/properties/${id}`);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (id) onFavoriteToggle(id, is_favorited);
  };

  const imageUrl = images?.[0]?.image_url || 'https://via.placeholder.com/600x400?text=Lehae+Property';

  return (
    <motion.div
      className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
    >
      {/* Image with overlay */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={imageUrl}
          alt={`${area}, ${district}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-4 right-4 p-3 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all shadow-md"
        >
          <Heart
            className={`w-6 h-6 transition-all ${
              is_favorited ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'
            }`}
          />
        </button>

        {/* Status Badge */}
        <span className="absolute top-4 left-4 px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-800 shadow-sm">
          {t(status)}
        </span>
      </div>

      {/* Details */}
      <div className="p-6">
        <h3 className="text-2xl font-heading font-bold text-secondary mb-2 truncate">
          {area}, {district}
        </h3>

        <p className="text-gray-600 mb-4 line-clamp-2">{description || t('Modern rental in prime location')}</p>

        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold text-primary">
            M {rental_amount.toLocaleString()}
            <span className="text-lg font-normal text-gray-600"> / {t('month')}</span>
          </p>

          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-medium">{district}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>{t('Landlord')}: {landlord_username || 'Private'}</span>
          {property.is_approved && (
            <span className="text-green-600 font-medium">✓ {t('Verified')}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyCard;