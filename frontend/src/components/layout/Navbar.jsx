import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import LanguageSwitcher from '../LanguageSwitcher';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axios';
import { MessageCircle, Menu, X, ChevronDown, User, Bell } from 'lucide-react';

const Navbar = () => {
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) { setUnreadCount(0); return; }
    try {
      const response = await axiosInstance.get('/api/messages/');
      const unread = response.data.filter(
        msg => !msg.is_read && msg.receiver_username?.toLowerCase() === user?.username?.toLowerCase()
      ).length;
      setUnreadCount(unread);
    } catch { setUnreadCount(0); }
  };

  useEffect(() => {
    fetchUnreadCount();
    const handleMessagesUpdated = () => fetchUnreadCount();
    window.addEventListener('popstate', fetchUnreadCount);
    window.addEventListener('messages-updated', handleMessagesUpdated);
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', fetchUnreadCount);
      window.removeEventListener('messages-updated', handleMessagesUpdated);
    };
  }, [isAuthenticated, user, location.pathname]);

  const navLinks = [
    { path: '/', label: t('home') },
    { path: '/properties', label: t('properties') },
    ...(isAuthenticated ? [
      { path: '/dashboard',      label: t('dashboard') },
      { path: '/favorites',      label: t('favorites') },
      { path: '/messages',       label: t('messages'), badge: unreadCount },
      { path: '/saved-searches', label: 'Alerts' },
      ...(!user?.is_landlord && !user?.is_staff ? [{ path: '/my-applications', label: 'Applications' }] : []),
      ...(user?.is_staff ? [{ path: '/admin', label: 'Admin' }] : []),
    ] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .lehae-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.3s ease;
        }
        .lehae-nav.scrolled {
          background: rgba(250,247,243,0.96);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #ede8e0;
          box-shadow: 0 2px 20px rgba(0,0,0,0.06);
        }
        .lehae-nav.top {
          background: rgba(250,247,243,0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(237,232,224,0.5);
        }
        .nav-inner {
          max-width: 1280px; margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .nav-brand {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 700;
          color: #1c1a17; text-decoration: none;
          display: flex; align-items: center; gap: 10px;
          letter-spacing: -0.02em;
        }
        .nav-brand-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #d4a96a;
          flex-shrink: 0;
        }
        .nav-links {
          display: flex; align-items: center; gap: 4px;
        }
        .nav-link {
          position: relative;
          padding: 7px 14px;
          font-size: 14px; font-weight: 500;
          color: #7a7060; text-decoration: none;
          border-radius: 10px;
          transition: color 0.18s, background 0.18s;
          display: flex; align-items: center; gap: 6px;
        }
        .nav-link:hover { color: #1c1a17; background: rgba(28,26,23,0.05); }
        .nav-link.active { color: #1c1a17; }
        .nav-underline {
          position: absolute; bottom: 3px; left: 14px; right: 14px;
          height: 2px; border-radius: 1px;
          background: #d4a96a;
        }
        .nav-badge {
          background: #ef4444; color: #fff;
          font-size: 10px; font-weight: 700;
          border-radius: 100px; padding: 1px 6px;
          min-width: 18px; text-align: center;
          line-height: 16px; height: 16px;
        }
        .nav-actions {
          display: flex; align-items: center; gap: 10px;
        }
        .nav-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg, #d4a96a, #c4a882);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; color: #fff;
          text-decoration: none; cursor: pointer;
          transition: transform 0.15s;
          border: 2px solid rgba(212,169,106,0.3);
        }
        .nav-avatar:hover { transform: scale(1.05); }
        .nav-logout {
          font-size: 13px; color: #9c9080; background: none; border: none;
          cursor: pointer; padding: 6px 10px; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          transition: color 0.15s, background 0.15s;
        }
        .nav-logout:hover { color: #1c1a17; background: rgba(28,26,23,0.05); }
        .nav-hamburger {
          width: 38px; height: 38px; border-radius: 10px;
          background: none; border: 1px solid #ede8e0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #5a5248;
          transition: background 0.15s;
        }
        .nav-hamburger:hover { background: #f5f0e8; }
        /* Mobile drawer */
        .mobile-drawer {
          position: fixed; inset: 0; z-index: 200;
        }
        .mobile-backdrop {
          position: absolute; inset: 0;
          background: rgba(28,26,23,0.4);
        }
        .mobile-panel {
          position: absolute; top: 0; right: 0; bottom: 0;
          width: min(320px, 90vw);
          background: #faf7f3;
          padding: 24px;
          display: flex; flex-direction: column;
          overflow-y: auto;
        }
        .mobile-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 32px;
        }
        .mobile-nav-link {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 16px; border-radius: 12px;
          font-size: 15px; font-weight: 500;
          color: #5a5248; text-decoration: none;
          transition: all 0.15s; margin-bottom: 4px;
        }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          background: #fff; color: #1c1a17;
        }
        .mobile-divider { height: 1px; background: #ede8e0; margin: 16px 0; }
      `}</style>

      <nav className={`lehae-nav ${scrolled ? 'scrolled' : 'top'}`}>
        <div className="nav-inner">
          {/* Brand */}
          <Link to="/" className="nav-brand">
            <img src="/logo.png" alt="Lehae" style={{ height: 36 }} onError={e => { e.target.style.display='none'; }} />
            <span>Lehae</span>
            <span className="nav-brand-dot" />
          </Link>

          {/* Desktop links */}
          <div className="nav-links hidden md:flex">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} className={`nav-link ${isActive(link.path) ? 'active' : ''}`}>
                {link.label}
                {link.badge > 0 && <span className="nav-badge">{link.badge > 9 ? '9+' : link.badge}</span>}
                {isActive(link.path) && (
                  <motion.div layoutId="nav-underline" className="nav-underline" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="nav-actions hidden md:flex">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="nav-avatar" title={user?.name || user?.username}>
                  {(user?.name || user?.username || 'U')[0].toUpperCase()}
                </Link>
                <button className="nav-logout" onClick={logout}>{t('logout')}</button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">{t('login')}</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">{t('register')}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="nav-hamburger md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={18} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="mobile-drawer">
            <motion.div
              className="mobile-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              className="mobile-panel"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            >
              <div className="mobile-header">
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#1c1a17' }}>
                  Menu
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a7060', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>{link.label}</span>
                  {link.badge > 0 && <span className="nav-badge">{link.badge > 9 ? '9+' : link.badge}</span>}
                </Link>
              ))}

              <div className="mobile-divider" />

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="mobile-nav-link"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('profile')}
                  </Link>
                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="mobile-nav-link"
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('login')}
                  </Link>
                  <Link to="/register" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                    {t('register')}
                  </Link>
                </>
              )}

              <div className="mobile-divider" />
              <div style={{ paddingLeft: 16 }}>
                <LanguageSwitcher />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;