import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import Layout from './components/layout/Layout.jsx';
import LoadingSpinner from './components/common/LoadingSpinner.jsx';

const Home           = lazy(() => import('./pages/Home.jsx'));
const PropertyList   = lazy(() => import('./pages/PropertyList.jsx'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail.jsx'));
const Dashboard      = lazy(() => import('./pages/Dashboard.jsx'));
const Favorites      = lazy(() => import('./pages/Favorites.jsx'));
const Login          = lazy(() => import('./pages/Login.jsx'));
const Register       = lazy(() => import('./pages/Register.jsx'));
const Profile        = lazy(() => import('./pages/Profile.jsx'));
const AddProperty    = lazy(() => import('./pages/AddProperty.jsx'));
const ManageListings = lazy(() => import('./pages/ManageListings.jsx'));
const Reports        = lazy(() => import('./pages/Reports.jsx'));
const Contact        = lazy(() => import('./pages/Contact.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const Messages       = lazy(() => import('./pages/Messages.jsx'));
const SavedSearches   = lazy(() => import('./pages/SavedSearches.jsx'));
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword   = lazy(() => import('./pages/ResetPassword.jsx'));
const TenantApplications = lazy(() => import('./pages/TenantApplications.jsx'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public */}
          <Route path="/"                element={<Home />} />
          <Route path="/properties"      element={<PropertyList />} />
          <Route path="/properties/:id"  element={<PropertyDetail />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />

          {/* Protected */}
          <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/favorites"       element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/profile"         element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/add-property"    element={<ProtectedRoute><AddProperty /></ProtectedRoute>} />
          <Route path="/manage-listings" element={<ProtectedRoute><ManageListings /></ProtectedRoute>} />
          <Route path="/reports"         element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/contact"         element={<ProtectedRoute><Contact /></ProtectedRoute>} />
          <Route path="/admin"           element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/messages"        element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/saved-searches"  element={<ProtectedRoute><SavedSearches /></ProtectedRoute>} />
          <Route path="/forgot-password"   element={<ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
          <Route path="/my-applications"   element={<ProtectedRoute><TenantApplications /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;