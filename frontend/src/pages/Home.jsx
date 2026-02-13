import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios.js';
import Button from '../components/common/Button.jsx';
import PropertyCard from '../components/property/PropertyCard.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    area: '',
    district: '',
    status: '',
  });
  const [suggestions, setSuggestions] = useState({ areas: [], districts: [] });
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axiosInstance.get('/api/properties/', { params: { limit: 6 } });
        const data = Array.isArray(response.data) ? response.data : response.data.results || [];
        if (!Array.isArray(data)) {
          setError(t('Unexpected response format for featured properties'));
          setFeaturedProperties([]);
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
            ? item.images 
            : item.image_url 
              ? [{ image_url: item.image_url }] 
              : [],
          landlord_username: item.landlord_username || 'Unknown',
          deposit: item.deposit != null ? item.deposit : null,
          viewing_fee: item.viewing_fee != null ? item.viewing_fee : null,
          status: item.status || 'unknown',
          description: item.description || 'No description available',
        }));
        setFeaturedProperties(mappedProperties);
        const areas = [...new Set(data.map(p => p.area))].slice(0, 5);
        const districts = [...new Set(data.map(p => p.district))].slice(0, 5);
        setSuggestions({ areas, districts });
      } catch (err) {
        setError(t('Failed to fetch featured properties'));
        setFeaturedProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedProperties();
  }, [t]);

  const handleSearchChange = (e) => {
    setSearchFilters({ ...searchFilters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    const query = new URLSearchParams(searchFilters).toString();
    navigate(`/properties?${query}`);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? Math.ceil(featuredProperties.length / 3) - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === Math.ceil(featuredProperties.length / 3) - 1 ? 0 : prev + 1));
  };

  const handleFavoriteToggle = async (propertyId, isFavorited) => {
    // Your existing favorite toggle logic remains unchanged
    // ... (omitted for brevity - keep your original code here)
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Hero Section - Airbnb-inspired large hero */}
      <motion.section
        className="relative h-[90vh] min-h-[700px] flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        {/* Background with overlay */}
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-heading font-extrabold mb-6 tracking-tight drop-shadow-lg"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {t('Find Your Perfect Home in Lesotho')}
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl lg:text-3xl mb-10 max-w-4xl mx-auto drop-shadow-md"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            {t('Discover verified rentals, connect directly with landlords, and secure your future today.')}
          </motion.p>

          {/* Hero Search Bar */}
          <motion.div
            className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <input
                  type="text"
                  name="area"
                  placeholder={t('Area (e.g., Thabong)')}
                  value={searchFilters.area}
                  onChange={handleSearchChange}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 text-lg"
                />
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="district"
                  placeholder={t('District (e.g., Mokhotlong)')}
                  value={searchFilters.district}
                  onChange={handleSearchChange}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 text-lg"
                />
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
              </div>

              <div className="relative">
                <select
                  name="status"
                  value={searchFilters.status}
                  onChange={handleSearchChange}
                  className="w-full px-6 py-4 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 text-lg appearance-none"
                >
                  <option value="">{t('All Statuses')}</option>
                  <option value="vacant">{t('Vacant')}</option>
                  <option value="occupied">{t('Occupied')}</option>
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleSearch}
              className="mt-6 w-full md:w-auto px-12 py-4 text-xl bg-primary hover:bg-primary-dark"
            >
              {t('Search Properties')}
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Listings - Enhanced Carousel */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-secondary mb-12 text-center">
            {t('Featured Homes')}
          </h2>

          {loading ? (
            <LoadingSpinner size="lg" className="mx-auto" />
          ) : error ? (
            <p className="text-red-600 text-center text-xl">{error}</p>
          ) : featuredProperties.length === 0 ? (
            <p className="text-gray-600 text-center text-xl">{t('No featured properties available')}</p>
          ) : (
            <div className="relative">
              <div className="overflow-hidden">
                <motion.div
                  className="flex"
                  animate={{ x: `-${currentIndex * (100 / 3)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ width: `${(featuredProperties.length / 3) * 100}%` }}
                >
                  {featuredProperties.map((property) => (
                    <div key={property.id} className="flex-none w-1/3 px-4">
                      <PropertyCard property={property} onFavoriteToggle={handleFavoriteToggle} />
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Carousel Controls */}
              <button
                onClick={handlePrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 p-4 rounded-full shadow-lg hover:bg-white transition-all disabled:opacity-50"
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-8 h-8 text-gray-800" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 p-4 rounded-full shadow-lg hover:bg-white transition-all disabled:opacity-50"
                disabled={currentIndex >= Math.ceil(featuredProperties.length / 3) - 1}
              >
                <ChevronRight className="w-8 h-8 text-gray-800" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* How It Works - Keep but modernize styling */}
      <section className="py-20 bg-gradient-to-b from-white to-neutral-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-secondary mb-16 text-center">
            {t('How It Works')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: 1, title: t('Search'), desc: t('Browse verified properties with ease') },
              { step: 2, title: t('Connect'), desc: t('Contact landlords directly') },
              { step: 3, title: t('Move In'), desc: t('Secure your new home quickly') },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="bg-white rounded-3xl shadow-xl p-10 text-center hover:shadow-2xl transition-shadow"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="text-2xl font-heading font-bold text-secondary mb-4">{item.title}</h3>
                <p className="text-lg text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <motion.section
        className="py-24 bg-gradient-to-r from-primary to-primary-dark text-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl font-heading font-bold mb-8">
            {t('Ready to Find Your Home?')}
          </h2>
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto">
            {t('Join thousands of happy renters and landlords in Lesotho today.')}
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/register')}
            className="text-2xl px-12 py-6 bg-white text-primary hover:bg-gray-100"
          >
            {t('Get Started Now')}
          </Button>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;