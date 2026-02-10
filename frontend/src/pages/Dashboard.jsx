import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/dashboard/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        setStats(response.data.stats);
        setRecentActivity(response.data.recentActivity);
        setLoading(false);
      } catch (error) {
        console.error('Dashboard Error:', error);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleAddProperty = () => {
    navigate('/add-property');
  };

  const handleManageListings = () => {
    navigate('/manage-listings');
  };

  const handleViewReports = () => {
    navigate('/reports');
  };

  const handleContact = () => {
    navigate('/contact');
  };

  if (loading) {
    return <div className="text-center py-8">{t('Loading...')}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('Dashboard')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.id} className="bg-white p-6 rounded-lg shadow">
            <div className={`w-10 h-10 rounded-full ${stat.iconBg} flex items-center justify-center mb-4`}>
              <span className="material-icons">{stat.icon}</span>
            </div>
            <h3 className="text-lg font-semibold">{t(stat.label)}</h3>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.trend}</p>
          </div>
        ))}
      </div>
      {user.is_landlord && (
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={handleAddProperty}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            {t('Add Property')}
          </button>
          <button
            onClick={handleManageListings}
            className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
          >
            {t('Manage Listings')}
          </button>
          <button
            onClick={handleViewReports}
            className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600"
          >
            {t('View Reports')}
          </button>
          <button
            onClick={handleContact}
            className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
          >
            {t('Contact')}
          </button>
        </div>
      )}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">{t('Recent Activity')}</h2>
        {recentActivity.length > 0 ? (
          <ul>
            {recentActivity.map((activity) => (
              <li key={activity.id} className="py-2 border-b last:border-b-0">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full ${activity.iconBg} flex items-center justify-center mr-3`}>
                    <span className="material-icons">{activity.icon}</span>
                  </div>
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">{t('No recent activity')}</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;