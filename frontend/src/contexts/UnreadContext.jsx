import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import { useAuth } from './AuthContext';

const UnreadContext = createContext();

export const UnreadProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await axiosInstance.get('/api/messages/');
      const unread = response.data.filter(
        msg => !msg.is_read && msg.receiver_username === user?.username
      ).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to refresh unread count:', err);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    refreshUnread();

    const interval = setInterval(refreshUnread, 30000); // Backup refresh

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  return (
    <UnreadContext.Provider value={{ unreadCount, refreshUnread }}>
      {children}
    </UnreadContext.Provider>
  );
};

export const useUnread = () => useContext(UnreadContext);