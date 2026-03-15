import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios.js';
import PropertyFilter from '../components/property/PropertyFilter.jsx';
import PropertyCard from '../components/property/PropertyCard.jsx';
import SkeletonGrid from '../components/common/SkeletonCard.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext.jsx';
import { SlidersHorizontal, ArrowRight } from 'lucide-react';

const PropertyList = () => {
  const { t }      = useLanguage();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filters, setFilters]       = useState({});

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setFilters({
      area:     params.get('area')     || '',
      district: params.get('district') || '',
      status:   params.get('status')   || 'all',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
    });
  }, [location.search]);

  useEffect(() => { fetchProperties(); }, [filters, user]);

  const fetchProperties = async () => {
    try {
      setLoading(true); setError('');
      const params = { ...filters };
      // Tenants only see approved listings.
      // Landlords see all (so they can preview their own pending listings).
      // Admins see all.
      if (!user?.is_staff && !user?.is_landlord) {
        params.is_approved = 'true';
      }
      const response = await axiosInstance.get('/api/properties/', { params });
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setProperties(data);
    } catch {
      setError(t('failed_to_load_properties'));
      setProperties([]);
    } finally { setLoading(false); }
  };

  const handleFavoriteToggle = async (propertyId, isFavorited) => {
    try {
      if (isFavorited) await axiosInstance.delete('/api/favorites/', { data: { property: propertyId } });
      else             await axiosInstance.post('/api/favorites/', { property: propertyId });
      fetchProperties();
    } catch { setError(t('failed_to_update_favorite')); }
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    navigate(`/properties?${new URLSearchParams(newFilters).toString()}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');`}</style>

      <div style={{ background:'#1c1a17', paddingTop:48, paddingBottom:48 }}>
        <div className="max-w-7xl mx-auto px-6">
          <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#d4a96a',marginBottom:8}}>
            All listings
          </p>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:700,color:'#fff'}}>
            {t('explore_properties')}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-20">
              <PropertyFilter onFilter={handleFilter} initialFilters={filters} />
            </div>
          </div>

          <div className="lg:col-span-8 xl:col-span-9">
            {error && (
              <div className="mb-6 p-4 rounded-xl text-sm" style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626'}}>
                {error}
              </div>
            )}

            {loading ? (
              <SkeletonGrid count={6} />
            ) : properties.length === 0 ? (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}
                className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-neutral-200">
                <div style={{width:56,height:56,borderRadius:16,background:'#faf7f3',border:'1px solid #ede8e0',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
                  <SlidersHorizontal size={22} style={{color:'#c4bdb4'}} />
                </div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17',marginBottom:6}}>
                  No properties found
                </h3>
                <p style={{fontSize:13,color:'#9c9080',marginBottom:20}}>{t('no_properties_found')}</p>
                <button onClick={() => { setFilters({}); navigate('/properties'); }}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'10px 20px',borderRadius:10,background:'#1c1a17',color:'#fff',border:'none',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                  {t('clear_filters_and_try_again')} <ArrowRight size={13}/>
                </button>
              </motion.div>
            ) : (
              <>
                <p style={{fontSize:13,color:'#9c9080',marginBottom:16}}>
                  {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {properties.map((property, i) => (
                    <motion.div key={property.id}
                      initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
                      <PropertyCard property={property} onFavoriteToggle={handleFavoriteToggle} />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyList;