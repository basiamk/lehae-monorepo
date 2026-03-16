import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import LanguageSwitcher from '../LanguageSwitcher';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosInstance from '../../utils/axios';
import { Menu, X, ChevronRight } from 'lucide-react';

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
    window.addEventListener('popstate', fetchUnreadCount);
    window.addEventListener('messages-updated', fetchUnreadCount);
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', fetchUnreadCount);
      window.removeEventListener('messages-updated', fetchUnreadCount);
    };
  }, [isAuthenticated, user, location.pathname]);

  const navLinks = [
    { path: '/',           label: t('home') },
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
  const close = () => setIsMobileMenuOpen(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');

        .lehae-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
        }
        .lehae-nav.scrolled {
          background: rgba(250,247,243,0.97);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #ede8e0;
          box-shadow: 0 2px 20px rgba(0,0,0,0.06);
        }
        .lehae-nav.top {
          background: rgba(250,247,243,0.88);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(237,232,224,0.5);
        }
        .nav-inner {
          max-width: 1280px; margin: 0 auto;
          padding: 0 20px; height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px;
        }

        /* Brand */
        .nav-brand {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 700;
          color: #1c1a17; text-decoration: none;
          display: flex; align-items: center; gap: 8px;
          flex-shrink: 0;
        }
        .nav-brand img { height: 32px; width: 32px; object-fit: contain; }
        .nav-brand-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #d4a96a; flex-shrink: 0;
        }

        /* Desktop links — hidden on mobile */
        .nav-links-desktop {
          display: none;
          align-items: center; gap: 2px;
          flex: 1; justify-content: center;
        }
        .nav-link {
          position: relative; padding: 7px 12px;
          font-size: 14px; font-weight: 500;
          color: #7a7060; text-decoration: none;
          border-radius: 10px;
          transition: color 0.18s, background 0.18s;
          display: flex; align-items: center; gap: 5px;
          white-space: nowrap;
        }
        .nav-link:hover { color: #1c1a17; background: rgba(28,26,23,0.05); }
        .nav-link.active { color: #1c1a17; }
        .nav-underline {
          position: absolute; bottom: 3px; left: 12px; right: 12px;
          height: 2px; border-radius: 1px; background: #d4a96a;
        }
        .nav-badge {
          background: #ef4444; color: #fff;
          font-size: 10px; font-weight: 700;
          border-radius: 100px; padding: 1px 5px;
          min-width: 16px; text-align: center; line-height: 15px;
        }

        /* Right side of navbar */
        .nav-right {
          display: flex; align-items: center; gap: 8px;
          flex-shrink: 0;
        }

        /* Desktop auth — hidden on mobile */
        .nav-auth-desktop { display: none; align-items: center; gap: 8px; }
        .nav-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg, #d4a96a, #c4a882);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; color: #fff;
          text-decoration: none;
          border: 2px solid rgba(212,169,106,0.3);
          transition: transform 0.15s;
        }
        .nav-avatar:hover { transform: scale(1.05); }
        .nav-logout {
          font-size: 13px; color: #9c9080; background: none; border: none;
          cursor: pointer; padding: 6px 10px; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          transition: color 0.15s, background 0.15s;
        }
        .nav-logout:hover { color: #1c1a17; background: rgba(28,26,23,0.05); }

        /* Hamburger — always visible */
        .nav-hamburger {
          width: 38px; height: 38px; border-radius: 10px;
          background: none; border: 1px solid #ede8e0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #5a5248;
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .nav-hamburger:hover { background: #f5f0e8; }

        /* Mobile drawer */
        .mobile-drawer { position: fixed; inset: 0; z-index: 200; }
        .mobile-backdrop {
          position: absolute; inset: 0;
          background: rgba(28,26,23,0.45);
        }
        .mobile-panel {
          position: absolute; top: 0; right: 0; bottom: 0;
          width: min(300px, 85vw);
          background: #faf7f3;
          display: flex; flex-direction: column;
          overflow-y: auto;
        }
        .mobile-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 20px 16px;
          border-bottom: 1px solid #ede8e0;
        }
        .mobile-nav-link {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px;
          font-size: 15px; font-weight: 500;
          color: #5a5248; text-decoration: none;
          transition: all 0.15s;
          border-bottom: 1px solid #f5f0e8;
        }
        .mobile-nav-link:last-child { border-bottom: none; }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          background: #fff; color: #1c1a17;
        }
        .mobile-nav-link.active { color: #1c1a17; font-weight: 600; }
        .mobile-section-label {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #c4bdb4; padding: 16px 20px 6px;
        }
        .mobile-auth-btn {
          margin: 0 16px 10px;
          display: flex; align-items: center; justify-content: center;
          padding: 13px; border-radius: 12px;
          font-size: 14px; font-weight: 500; cursor: pointer;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .mobile-auth-btn-outline {
          background: transparent; color: #5a5248;
          border: 1px solid #ede8e0;
        }
        .mobile-auth-btn-outline:hover { background: #fff; }
        .mobile-auth-btn-filled {
          background: #1c1a17; color: #fff;
          border: none;
        }
        .mobile-auth-btn-filled:hover { background: #2c2a27; }
        .mobile-lang-row {
          padding: 16px 20px;
          border-top: 1px solid #ede8e0;
          margin-top: auto;
        }

        /* Desktop breakpoint */
        @media (min-width: 768px) {
          .nav-links-desktop { display: flex; }
          .nav-auth-desktop  { display: flex; }
          .nav-hamburger     { display: none; }
          .nav-inner         { padding: 0 24px; height: 68px; }
          .nav-brand         { font-size: 22px; }
          .nav-brand img     { height: 36px; width: 36px; }
        }
      `}</style>

      <nav className={`lehae-nav ${scrolled ? 'scrolled' : 'top'}`}>
        <div className="nav-inner">

          {/* Brand */}
          <Link to="/" className="nav-brand" onClick={close}>
            <img src="/logo.png" alt="Lehae" onError={e => { e.target.style.display='none'; }} />
            <span>Lehae</span>
            <span className="nav-brand-dot" />
          </Link>

          {/* Desktop centre links */}
          <div className="nav-links-desktop">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} className={`nav-link ${isActive(link.path) ? 'active' : ''}`}>
                {link.label}
                {link.badge > 0 && <span className="nav-badge">{link.badge > 9 ? '9+' : link.badge}</span>}
                {isActive(link.path) && <motion.div layoutId="nav-underline" className="nav-underline" />}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="nav-right">
            {/* Language switcher — always visible */}
            <LanguageSwitcher />

            {/* Desktop auth */}
            <div className="nav-auth-desktop">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="nav-avatar" title={user?.username}>
                    {(user?.username || 'U')[0].toUpperCase()}
                  </Link>
                  <button className="nav-logout" onClick={logout}>{t('logout')}</button>
                </>
              ) : (
                <>
                  <Link to="/login"><Button variant="outline" size="sm">{t('login')}</Button></Link>
                  <Link to="/register"><Button variant="primary" size="sm">{t('register')}</Button></Link>
                </>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button className="nav-hamburger" onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu">
              <Menu size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="mobile-drawer">
            <motion.div
              className="mobile-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.div
              className="mobile-panel"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            >
              {/* Header */}
              <div className="mobile-header">
                <span style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#1c1a17' }}>
                  Menu
                </span>
                <button onClick={close}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#7a7060', padding:4 }}>
                  <X size={20} />
                </button>
              </div>

              {/* Nav links */}
              <div style={{ paddingTop: 8 }}>
                <p className="mobile-section-label">Navigate</p>
                {navLinks.map(link => (
                  <Link key={link.path} to={link.path}
                    className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                    onClick={close}>
                    <span>{link.label}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      {link.badge > 0 && <span className="nav-badge">{link.badge > 9 ? '9+' : link.badge}</span>}
                      <ChevronRight size={14} style={{ color:'#c4bdb4' }}/>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Auth section */}
              <div style={{ paddingTop: 8 }}>
                {isAuthenticated ? (
                  <>
                    <p className="mobile-section-label">Account</p>
                    <Link to="/profile" className="mobile-nav-link" onClick={close}>
                      <span>Profile</span>
                      <ChevronRight size={14} style={{ color:'#c4bdb4' }}/>
                    </Link>
                    <button onClick={() => { logout(); close(); }}
                      className="mobile-nav-link"
                      style={{ width:'100%', background:'none', border:'none', cursor:'pointer',
                        fontFamily:"'DM Sans',sans-serif", textAlign:'left', color:'#ef4444' }}>
                      {t('logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mobile-section-label">Get started</p>
                    <div style={{ padding:'8px 0 16px' }}>
                      <Link to="/login" className="mobile-auth-btn mobile-auth-btn-outline" onClick={close}>
                        {t('login')}
                      </Link>
                      <Link to="/register" className="mobile-auth-btn mobile-auth-btn-filled" onClick={close}>
                        {t('register')}
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Language at bottom */}
              <div className="mobile-lang-row">
                <p className="mobile-section-label" style={{ padding:0, marginBottom:10 }}>Language</p>
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