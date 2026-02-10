import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { favoritesAPI, propertyAPI } from '../lib/api.js';
import PropertyCard from '../components/property/PropertyCard.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const Favorites = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const data = await favoritesAPI.getFavorites();
        console.log('Raw Favorites Response:', JSON.stringify(data, null, 2));
        
        let mappedFavorites = [];
        if (data.some(item => item.property_detail && item.property_detail.id)) {
          // API returns nested property objects
          const invalidItems = data.filter(item => !item.property_detail || !item.property_detail.id);
          if (invalidItems.length > 0) {
            console.warn('Invalid Favorite Items:', JSON.stringify(invalidItems, null, 2));
          }
          mappedFavorites = data
            .filter(item => item.property_detail && item.property_detail.id && Number.isInteger(item.property_detail.id))
            .map(item => ({
              id: item.property_detail.id,
              area: item.property_detail.area || 'Unknown',
              district: item.property_detail.district || 'Unknown',
              landlord_username: item.property_detail.landlord_username || 'Unknown',
              rental_amount: item.property_detail.rental_amount || 0,
              deposit: item.property_detail.deposit || null,
              viewing_fee: item.property_detail.viewing_fee || null,
              status: item.property_detail.status || 'unknown',
              description: item.property_detail.description || '',
              image_url: item.property_detail.image_url || '/placeholder-property.jpg',
              is_favorited: true
            }));
        } else {
          // API returns property IDs; fetch details
          const invalidItems = data.filter(item => !item.property || !Number.isInteger(item.property));
          if (invalidItems.length > 0) {
            console.warn('Invalid Favorite Items:', JSON.stringify(invalidItems, null, 2));
          }
          const propertyIds = data
            .filter(item => Number.isInteger(item.property))
            .map(item => item.property);
          if (propertyIds.length > 0) {
            const properties = await Promise.all(
              propertyIds.map(async (id) => {
                try {
                  console.log(`Fetching property ID: ${id}`);
                  const response = await propertyAPI.getProperties({ id });
                  return response[0] || null;
                } catch (err) {
                  console.error(`Error fetching property ${id}:`, err.response?.data || err.message);
                  return null;
                }
              })
            );
            mappedFavorites = properties
              .filter(prop => prop && prop.id)
              .map(prop => ({
                id: prop.id,
                area: prop.area || 'Unknown',
                district: prop.district || 'Unknown',
                landlord_username: prop.landlord_username || 'Unknown',
                rental_amount: prop.rental_amount || 0,
                deposit: prop.deposit || null,
                viewing_fee: prop.viewing_fee || null,
                status: prop.status || 'unknown',
                description: prop.description || '',
                image_url: prop.image_url || '/placeholder-property.jpg',
                is_favorited: true
              }));
          }
        }
        console.log('Mapped Favorites:', JSON.stringify(mappedFavorites, null, 2));
        setFavorites(mappedFavorites);
        setError('');
      } catch (err) {
        console.error('Fetch Favorites Error:', err.response?.data || err);
        if (err.response?.status === 401) {
          setError(t('Please log in to view favorites'));
          navigate('/login');
        } else {
          setError(t('Failed to load favorites'));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [t, navigate]);

  const handleFavoriteToggle = async (propertyId, isFavorited) => {
    try {
      if (!propertyId || !Number.isInteger(propertyId)) {
        console.error('Invalid property ID:', propertyId);
        setError(t('Cannot toggle favorite: Invalid property'));
        return;
      }
      if (isFavorited) {
        console.log(`Removing favorite for property ID: ${propertyId}`);
        await favoritesAPI.removeFavorite(propertyId);
        setFavorites(favorites.filter(fav => fav.id !== propertyId));
      } else {
        console.log(`Adding favorite for property ID: ${propertyId}`);
        const response = await favoritesAPI.addFavorite(propertyId);
        if (response.message === 'Already favorited') {
          console.log('Property already favorited, no action needed');
          return;
        }
        const newFavorite = {
          id: propertyId,
          area: response.property_detail?.area || 'Unknown',
          district: response.property_detail?.district || 'Unknown',
          landlord_username: response.property_detail?.landlord_username || 'Unknown',
          rental_amount: response.property_detail?.rental_amount || 0,
          deposit: response.property_detail?.deposit || null,
          viewing_fee: response.property_detail?.viewing_fee || null,
          status: response.property_detail?.status || 'unknown',
          description: response.property_detail?.description || '',
          image_url: response.property_detail?.image_url || '/placeholder-property.jpg',
          is_favorited: true
        };
        setFavorites([...favorites, newFavorite]);
      }
    } catch (err) {
      console.error('Favorite Toggle Error:', err.response?.data || err);
      if (err.response?.status === 401) {
        setError(t('Please log in to manage favorites'));
        navigate('/login');
      } else {
        setError(t('Failed to update favorite'));
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          {t('refresh')}
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('Favorite Properties')}</h1>
      {favorites.length === 0 ? (
        <p className="text-gray-500">{t('No favorite properties found')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;