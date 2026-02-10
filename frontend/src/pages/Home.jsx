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
        console.log('Sending filters:', { limit: 6 });
        const response = await axiosInstance.get('/api/properties/', { params: { limit: 6 } });
        console.log('Featured Properties Fetched:', JSON.stringify(response.data, null, 2));
        const data = Array.isArray(response.data) ? response.data : response.data.results || [];
        if (!Array.isArray(data)) {
          console.error('Expected array, received:', data);
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
        console.log('Mapped Featured Properties:', JSON.stringify(mappedProperties, null, 2));
        setFeaturedProperties(mappedProperties);
        const areas = [...new Set(data.map(p => p.area))].slice(0, 5);
        const districts = [...new Set(data.map(p => p.district))].slice(0, 5);
        setSuggestions({ areas, districts });
      } catch (err) {
        console.error('Fetch Featured Properties Error:', err.response?.data || err.message);
        setError(t('Failed to fetch featured properties: ') + (err.response?.data?.detail || err.message));
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
    if (!propertyId) {
      console.error('Property ID is undefined');
      setError(t('Cannot toggle favorite: Invalid property'));
      return;
    }
    try {
      console.log(`Toggling favorite for property ${propertyId}: ${isFavorited ? 'Remove' : 'Add'}`);
      if (isFavorited) {
        await axiosInstance.delete('/api/favorites/', { data: { property: propertyId } });
      } else {
        await axiosInstance.post('/api/favorites/', { property: propertyId });
      }
      const response = await axiosInstance.get('/api/properties/', { params: { limit: 6 } });
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
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
    } catch (err) {
      console.error('Favorite Toggle Error:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError(t('Please log in to manage favorites'));
        navigate('/login');
      } else {
        setError(t('Failed to update favorite: ') + (err.response?.data?.detail || err.message));
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Hero Section */}
      <motion.section
        className="relative h-screen flex items-center justify-center bg-gradient-radial from-blue-100/20 to-gray-800/20 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-30"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1
            className="text-5xl md:text-7xl font-heading font-bold text-gray-800 mb-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {t('Find Your Sanctuary with Lehae')}
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-gray-800 mb-8 max-w-2xl mx-auto"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {t('Discover verified, premium properties tailored to your lifestyle')}
          </motion.p>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/properties')}
              className="bg-blue-500 text-white hover:bg-red-500 hover:text-gray-800"
            >
              {t('Explore Now')}
            </Button>
          </motion.div>
        </div>
        <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </motion.section>

      {/* Search Bar with Suggestions */}
      <section className="container mx-auto px-4 py-12 -mt-24 relative z-20">
        <motion.div
          className="bg-white rounded-2xl shadow-md p-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-heading font-bold text-gray-800 mb-6">{t('Search Your Dream Home')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                name="area"
                placeholder={t('Area (e.g., Thabong)')}
                value={searchFilters.area}
                onChange={handleSearchChange}
                className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
              {searchFilters.area && suggestions.areas.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white rounded-lg shadow-md mt-2 p-2 z-50">
                  {suggestions.areas.map((area) => (
                    <div
                      key={area}
                      className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                      onClick={() => setSearchFilters({ ...searchFilters, area })}
                    >
                      {area}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                name="district"
                placeholder={t('District (e.g., Mokhotlong)')}
                value={searchFilters.district}
                onChange={handleSearchChange}
                className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
              {searchFilters.district && suggestions.districts.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white rounded-lg shadow-md mt-2 p-2 z-50">
                  {suggestions.districts.map((district) => (
                    <div
                      key={district}
                      className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                      onClick={() => setSearchFilters({ ...searchFilters, district })}
                    >
                      {district}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <select
                name="status"
                value={searchFilters.status}
                onChange={handleSearchChange}
                className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 appearance-none"
              >
                <option value="">{t('All Statuses')}</option>
                <option value="occupied">{t('Occupied')}</option>
                <option value="vacant">{t('Vacant')}</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSearch}
            className="mt-6 w-full md:w-auto bg-blue-500 text-white hover:bg-red-500 hover:text-gray-800"
          >
            {t('Search Now')}
          </Button>
        </motion.div>
      </section>

      {/* Featured Listings Carousel */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-heading font-bold text-gray-800 mb-8 text-center">{t('Featured Listings')}</h2>
        {error && (
          <p className="text-red-600 text-lg mb-6 text-center">{error}</p>
        )}
        {featuredProperties.length === 0 ? (
          <p className="text-gray-600 text-lg text-center">{t('No featured properties available')}</p>
        ) : (
          <div className="relative">
            <div className="overflow-hidden">
              <motion.div
                className="flex"
                animate={{ x: `-${currentIndex * (100 / Math.min(featuredProperties.length, 3))}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                style={{ width: `${featuredProperties.length * (100 / Math.min(featuredProperties.length, 3))}%` }}
              >
                {featuredProperties.map((property) => (
                  <div
                    key={property.id}
                    className={`flex-none ${featuredProperties.length >= 3 ? 'w-1/3' : featuredProperties.length === 2 ? 'w-1/2' : 'w-full'} px-2`}
                  >
                    <PropertyCard
                      property={property}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  </div>
                ))}
              </motion.div>
            </div>
            {featuredProperties.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className={`w-6 h-6 ${currentIndex === 0 ? 'text-gray-400' : 'text-gray-800'}`} />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  disabled={currentIndex >= Math.ceil(featuredProperties.length / 3) - 1}
                >
                  <ChevronRight className={`w-6 h-6 ${currentIndex >= Math.ceil(featuredProperties.length / 3) - 1 ? 'text-gray-400' : 'text-gray-800'}`} />
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="relative bg-[url('/wave.svg')] bg-cover bg-center py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-gray-800 mb-12 text-center">{t('How It Works')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: 1, title: t('Search'), desc: t('Browse verified properties with ease') },
              { step: 2, title: t('Connect'), desc: t('Contact landlords directly') },
              { step: 3, title: t('Move In'), desc: t('Secure your new home quickly') },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="bg-white rounded-2xl shadow-md p-8"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="w-16 h-16 bg-blue-100/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-blue-500 text-2xl font-bold">{item.step}</span>
                </div>
                <h3 className="text-xl font-heading font-bold text-gray-800 mb-2 text-center">{item.title}</h3>
                <p className="text-gray-600 text-center">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-heading font-bold text-gray-800 mb-8 text-center">{t('What Our Users Say')}</h2>
        <motion.div
          className="relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            animate={{ x: `-${(featuredProperties.length % 2) * 50}%` }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="flex"
          >
            {[
              { quote: t('Lehae transformed my home search with verified listings!'), author: 'Thabo M.' },
              { quote: t('As a landlord, Lehae’s platform is a game-changer.'), author: 'Lerato K.' },
            ].map((item, index) => (
              <div key={index} className="min-w-[300px] mx-4">
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <p className="text-gray-600 italic mb-4">{item.quote}</p>
                  <p className="text-gray-800 font-heading font-bold">— {item.author}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Call to Action */}
      <motion.section
        className="bg-gradient-radial from-blue-100/20 to-gray-800/20 py-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            className="text-3xl font-heading font-bold text-gray-800 mb-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t('Ready to Begin Your Journey?')}
          </motion.h2>
          <motion.p
            className="text-lg text-gray-800 mb-8 max-w-xl mx-auto"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {t('Join Lehae and find your perfect home today')}
          </motion.p>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-blue-500 text-white hover:bg-red-500 hover:text-gray-800"
            >
              {t('Sign Up Now')}
            </Button>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;