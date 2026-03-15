import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { favoritesAPI, propertyAPI } from '../lib/api.js';
import PropertyCard from '../components/property/PropertyCard.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { Heart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
        let mappedFavorites = [];
        if (data.some(item => item.property_detail && item.property_detail.id)) {
          mappedFavorites = data
            .filter(item => item.property_detail && item.property_detail.id && Number.isInteger(item.property_detail.id))
            .map(item => ({ ...item.property_detail, is_favorited: true }));
        } else {
          const propertyIds = data.filter(item => Number.isInteger(item.property)).map(item => item.property);
          if (propertyIds.length > 0) {
            const properties = await Promise.all(propertyIds.map(async (id) => {
              try { const response = await propertyAPI.getProperties({ id }); return response[0] || null; }
              catch { return null; }
            }));
            mappedFavorites = properties.filter(prop => prop && prop.id).map(prop => ({ ...prop, is_favorited: true }));
          }
        }
        setFavorites(mappedFavorites);
        setError('');
      } catch (err) {
        if (err.response?.status === 401) { setError(t('Please log in to view favorites')); navigate('/login'); }
        else setError(t('Failed to load favorites'));
      } finally { setLoading(false); }
    };
    fetchFavorites();
  }, [t, navigate]);

  const handleFavoriteToggle = async (propertyId, isFavorited) => {
    try {
      if (isFavorited) {
        await favoritesAPI.removeFavorite(propertyId);
        setFavorites(favorites.filter(fav => fav.id !== propertyId));
      } else {
        const response = await favoritesAPI.addFavorite(propertyId);
        if (response.message === 'Already favorited') return;
        setFavorites([...favorites, { ...response.property_detail, is_favorited: true }]);
      }
    } catch (err) {
      if (err.response?.status === 401) { setError(t('Please log in to manage favorites')); navigate('/login'); }
      else setError(t('Failed to update favorite'));
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-neutral-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');`}</style>

      {/* Header */}
      <div style={{ background:'#1c1a17', paddingTop:48, paddingBottom:48 }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center gap-4">
          <div style={{width:44,height:44,borderRadius:12,background:'rgba(212,169,106,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Heart size={20} style={{color:'#d4a96a'}} />
          </div>
          <div>
            <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#d4a96a',marginBottom:4}}>Saved</p>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:700,color:'#fff'}}>
              {t('Favorite Properties')}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm flex items-center justify-between"
            style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626'}}>
            {error}
            <button onClick={()=>window.location.reload()}
              style={{fontSize:12,color:'#dc2626',background:'none',border:'1px solid #fecaca',borderRadius:8,padding:'4px 10px',cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
              Retry
            </button>
          </div>
        )}

        {favorites.length === 0 ? (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div style={{width:72,height:72,borderRadius:20,background:'#fff',border:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
              <Heart size={28} style={{color:'#ede8e0'}} />
            </div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:'#1c1a17',marginBottom:8}}>
              No saved properties yet
            </h3>
            <p style={{fontSize:14,color:'#9c9080',marginBottom:24,maxWidth:280}}>
              {t('No favorite properties found')}
            </p>
            <button onClick={()=>navigate('/properties')}
              style={{display:'flex',alignItems:'center',gap:8,padding:'11px 24px',borderRadius:12,background:'#1c1a17',color:'#fff',border:'none',fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
              Browse Properties <ArrowRight size={15}/>
            </button>
          </motion.div>
        ) : (
          <>
            <p style={{fontSize:13,color:'#9c9080',marginBottom:20}}>{favorites.length} saved {favorites.length === 1 ? 'property' : 'properties'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((property, i) => (
                <motion.div key={property.id}
                  initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}}>
                  <PropertyCard property={property} onFavoriteToggle={handleFavoriteToggle} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Favorites;