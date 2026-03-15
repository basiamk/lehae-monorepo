import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

// No AnimatePresence, no exit animations.
// Exit animations with mode="wait" unmount the old page before mounting
// the new one — this causes useEffect fetches to fire on unmounting
// components, cancels in-flight API calls, and leaves blank pages.
// Each page handles its own fade-in independently.

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Navbar />
      <main className="flex-grow pt-[68px]">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;