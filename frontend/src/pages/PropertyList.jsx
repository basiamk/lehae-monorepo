import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../utils/axios.js';
import PropertyFilter from '../components/property/PropertyFilter.jsx';
import PropertyCard from '../components/property/PropertyCard.jsx';
import SkeletonGrid from '../components/common/SkeletonCard.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext.jsx';
import { SlidersHorizontal, ArrowRight, X } from 'lucide-react';

const PropertyList = () => {
  const { t }    = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [properties, setProperties]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [filters, setFilters]           = useState({});
  const [showMobileFilter, setShowMobileFilter] = useState(false);

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
    setShowMobileFilter(false);
    navigate(`/properties?${new URLSearchParams(newFilters).toString()}`);
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'all').length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .pl-filter-sidebar { display: none; }
        .pl-filter-toggle { display: flex; }
        .pl-mobile-overlay { display: none; }
        @media (min-width: 1024px) {
          .pl-filter-sidebar { display: block; }
          .pl-filter-toggle { display: none; }
        }
        .pl-mobile-filter-panel {
          position: fixed; inset: 0; z-index: 150;
          display: flex; align-items: flex-end;
        }
        .pl-mobile-filter-backdrop {
          position: absolute; inset: 0;
          background: rgba(28,26,23,0.5);
        }
        .pl-mobile-filter-sheet {
          position: relative; z-index: 1;
          width: 100%; max-height: 90vh;
          background: #fff; border-radius: 20px 20px 0 0;
          overflow-y: auto; padding: 20px;
        }
      `}</style>

      {/* Header */}
      <div style={{ background:'#1c1a17', paddingTop:48, paddingBottom:48 }}>
        <div className="max-w-7xl mx-auto px-6">
          <p style={{fontSize:11,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:'#d4a96a',marginBottom:8}}>
            All listings
          </p>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:700,color:'#fff',marginBottom:16}}>
            {t('explore_properties')}
          </h1>

          {/* Mobile filter toggle button — shown in header on mobile */}
          <button className="pl-filter-toggle" onClick={() => setShowMobileFilter(true)}
            style={{alignItems:'center',gap:8,padding:'10px 18px',borderRadius:12,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            <SlidersHorizontal size={15}/>
            Filters
            {activeFilterCount > 0 && (
              <span style={{background:'#d4a96a',color:'#fff',borderRadius:100,fontSize:10,fontWeight:700,padding:'1px 7px'}}>{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Desktop sidebar filter */}
          <div className="pl-filter-sidebar lg:col-span-4 xl:col-span-3">
            <div className="sticky top-20">
              <PropertyFilter onFilter={handleFilter} initialFilters={filters} />
            </div>
          </div>

          {/* Property grid */}
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

      {/* Mobile filter bottom sheet */}
      <AnimatePresence>
        {showMobileFilter && (
          <div className="pl-mobile-filter-panel">
            <motion.div className="pl-mobile-filter-backdrop"
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={() => setShowMobileFilter(false)}
            />
            <motion.div className="pl-mobile-filter-sheet"
              initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}}
              transition={{type:'spring',damping:30,stiffness:300}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#1c1a17'}}>Filters</h3>
                <button onClick={() => setShowMobileFilter(false)}
                  style={{background:'none',border:'none',cursor:'pointer',color:'#9c9080',padding:4}}>
                  <X size={20}/>
                </button>
              </div>
              <PropertyFilter onFilter={handleFilter} initialFilters={filters} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PropertyList;