import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Facebook, Instagram, Mail, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand & Description */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-3">
              <img src="/logo-white.png" alt="Lehae" className="h-10 w-auto" /> {/* Use white logo variant if you have one */}
              <span className="text-2xl font-heading font-bold">Lehae</span>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your trusted platform for finding and renting premium properties across Lesotho. Verified listings, direct landlord connections, and secure experience.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Navigation</h3>
            <ul className="space-y-4 text-gray-300">
              <li><Link to="/properties" className="hover:text-accent transition-colors">Properties</Link></li>
              <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/how-it-works" className="hover:text-accent transition-colors">How It Works</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Legal</h3>
            <ul className="space-y-4 text-gray-300">
              <li><Link to="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-accent transition-colors">Terms of Service</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-accent transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Get in Touch</h3>
            <div className="space-y-4 text-gray-300">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5" />
                <a href="mailto:info@lehae.com" className="hover:text-accent transition-colors">info@lehae.com</a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5" />
                <a href="tel:+266694349760" className="hover:text-accent transition-colors">+266 69 434 9760</a>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="text-sm font-medium mb-4">Follow Us</h4>
              <div className="flex space-x-6">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                  <Twitter className="w-6 h-6" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                  <Facebook className="w-6 h-6" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                  <Instagram className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>© {currentYear} Lehae. All rights reserved.</p>
          <p className="mt-2">Made with ❤️ in Maseru, Lesotho</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;