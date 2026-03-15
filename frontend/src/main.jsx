import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import { UnreadProvider } from './contexts/UnreadContext.jsx';  // ← NEW
import './index.css';
import './i18n';

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(
  <Suspense fallback={<LoadingFallback />}>
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <UnreadProvider>  {/* ← NEW: wrap here */}
            <App />
          </UnreadProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </Suspense>
);