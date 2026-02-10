import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin, Bed, Bath, Ruler } from 'lucide-react';
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

  const handleClick = () => {
    if (id) {
      navigate(`/properties/${id}`);
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (id) {
      onFavoriteToggle(id, is_favorited);
    }
  };

  const imageUrl = images && images.length > 0 ? images[0].image_url : 'https://via.placeholder.com/400x300';

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md overflow-hidden cursor-pointer relative z-0"
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
    >
      <div className="relative">
        <img
          src={imageUrl}
          alt={description}
          className="w-full h-48 object-cover"
        />
        <button
          onClick={handleFavoriteClick}
          className="absolute top-4 right-4 p-2 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition"
        >
          <Heart
            className={`w-6 h-6 ${is_favorited ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
          />
        </button>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-heading font-bold text-gray-800 truncate">
          {area}, {district}
        </h3>
        <p className="text-gray-600 mt-1 truncate">{description}</p>
        <p className="text-primary font-bold mt-2">
          {t('M')} {rental_amount.toLocaleString()} / {t('month')}
        </p>
        <div className="flex items-center gap-4 mt-4 text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{district}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm capitalize">{status}</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">{t('Landlord')}: {landlord_username}</p>
      </div>
    </motion.div>
  );
};

export default PropertyCard;