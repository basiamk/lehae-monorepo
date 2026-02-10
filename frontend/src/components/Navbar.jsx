// src/components/Navbar.jsx
import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

function Navbar() {
  const { t, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('access_token');
  const username = localStorage.getItem('username') || 'Guest';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  console.log('Navbar: username from localStorage:', username);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    navigate('/properties');
    setIsMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-blue-600 text-white p-4 sticky top-0 z-50 shadow-md"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/properties" className="text-2xl font-bold flex items-center space-x-2">
          <img src="/logo.png" alt="Lehae Logo" className="h-8" />
          <span>Lehae</span>
        </Link>
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
        <div className={`md:flex items-center space-x-6 ${isMenuOpen ? 'block absolute top-16 left-0 w-full bg-blue-600 p-4' : 'hidden md:block'}`}>
          <Link to="/properties" className="block hover:underline py-2">{t.properties}</Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="block hover:underline py-2">{t.dashboard}</Link>
              <Link to="/favorites" className="block hover:underline py-2">{t.favorites}</Link>
              <Link to="/profile" className="block hover:underline py-2">{t.profile}</Link>
            </>
          )}
          <button onClick={toggleLanguage} className="block hover:underline py-2">
            {t.language === 'English' ? 'Sesotho' : 'English'}
          </button>
          {isAuthenticated ? (
            <div className="flex items-center space-x-4 py-2">
              <span className="text-sm flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  {username.charAt(0).toUpperCase()}
                </div>
                <span>Welcome, {username}</span>
              </span>
              <button onClick={handleLogout} className="hover:underline">
                {t.logout}
              </button>
            </div>
          ) : (
            <div className="flex space-x-4 py-2">
              <Link to="/login" className="hover:underline">{t.login}</Link>
              <Link to="/register" className="hover:underline">{t.register}</Link>
            </div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;