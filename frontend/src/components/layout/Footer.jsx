import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ fontFamily: "'DM Sans', sans-serif", background: '#1c1a17', color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .footer-link {
          color: #9c9080; text-decoration: none; font-size: 14px;
          transition: color 0.18s; display: inline-block;
        }
        .footer-link:hover { color: #d4a96a; }
        .footer-social {
          width: 38px; height: 38px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          color: #9c9080; text-decoration: none;
          transition: all 0.18s;
        }
        .footer-social:hover { border-color: #d4a96a; color: #d4a96a; background: rgba(212,169,106,0.08); }
        .footer-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 40px 0 28px; }
        .footer-col-title {
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: #5a5248; margin-bottom: 20px;
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 48 }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 20 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#fff' }}>Lehae</span>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d4a96a', flexShrink: 0 }} />
            </Link>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: '#7a7060', maxWidth: 220 }}>
              Your trusted platform for finding and renting premium properties across Lesotho.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-social">
                <Twitter size={15} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social">
                <Facebook size={15} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social">
                <Instagram size={15} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="footer-col-title">Explore</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link to="/properties" className="footer-link">Properties</Link>
              <Link to="/about" className="footer-link">About Us</Link>
              <Link to="/how-it-works" className="footer-link">How It Works</Link>
              <Link to="/contact" className="footer-link">Contact</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <p className="footer-col-title">Legal</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link to="/privacy" className="footer-link">Privacy Policy</Link>
              <Link to="/terms" className="footer-link">Terms of Service</Link>
              <Link to="/cookie-policy" className="footer-link">Cookie Policy</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="footer-col-title">Get in Touch</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <a href="mailto:trusthutsolutions@gmail.com" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Mail size={14} style={{ color: '#d4a96a', flexShrink: 0 }} />
                trusthutsolutions@gmail.com
              </a>
              <a href="tel:+26663091719" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Phone size={14} style={{ color: '#d4a96a', flexShrink: 0 }} />
                +266 6309 1719
              </a>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, color: '#7a7060' }}>
                <MapPin size={14} style={{ color: '#d4a96a', flexShrink: 0 }} />
                Maseru, Lesotho
              </span>
            </div>
          </div>
        </div>

        <div className="footer-divider" />
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 32, gap: 12 }}>
          <p style={{ fontSize: 13, color: '#5a5248' }}>© {currentYear} Lehae. All rights reserved.</p>
          <p style={{ fontSize: 13, color: '#5a5248' }}>Made with ♥ in Maseru, Lesotho</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;