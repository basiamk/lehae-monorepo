import axiosInstance from '../utils/axios.js';

// ── Helper: handles both paginated {count,results:[]} and plain array responses
// This is needed because pagination was added to the backend (PAGE_SIZE=20)
const extractList = (data) =>
  Array.isArray(data) ? data :
  (data && Array.isArray(data.results)) ? data.results : [];

export const propertyAPI = {
  getProperties: async (filters = {}) => {
    try {
      const response = await axiosInstance.get('/api/properties/', {
        params: {
          id:         filters.id        || undefined,
          district:   filters.district  || undefined,
          area:       filters.area      || undefined,
          min_amount: filters.minPrice  || undefined,
          max_amount: filters.maxPrice  || undefined,
          status:     filters.status !== 'all' ? filters.status : undefined,
          landlord:   filters.landlord  || undefined,
        },
      });
      // FIX: handle paginated response
      return extractList(response.data);
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  updateProperty: async (propertyId, data) => {
    try {
      // FIX: use PATCH not PUT — allows partial updates (e.g. is_approved only)
      const response = await axiosInstance.patch(`/api/properties/${propertyId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Update Property Error:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteProperty: async (propertyId) => {
    try {
      const response = await axiosInstance.delete(`/api/properties/${propertyId}/`);
      return response.data;
    } catch (error) {
      console.error('Delete Property Error:', error.response?.data || error.message);
      throw error;
    }
  },

  uploadPropertyImage: async (formData) => {
    try {
      const response = await axiosInstance.post('/api/property-images/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Upload Image Error:', error.response?.data || error.message);
      throw error;
    }
  },

  deletePropertyImage: async (imageId) => {
    try {
      const response = await axiosInstance.delete(`/api/property-images/${imageId}/`);
      return response.data;
    } catch (error) {
      console.error('Delete Image Error:', error.response?.data || error.message);
      throw error;
    }
  },
};

export const favoritesAPI = {
  addFavorite: async (propertyId) => {
    try {
      if (!propertyId) throw new Error('Property ID is required');
      const response = await axiosInstance.post('/api/favorites/', { property: propertyId });
      return response.data;
    } catch (error) {
      console.error('Add Favorite Error:', error.response?.data || error.message);
      throw error;
    }
  },

  removeFavorite: async (propertyId) => {
    try {
      if (!propertyId) throw new Error('Property ID is required');
      const response = await axiosInstance.delete('/api/favorites/', {
        data: { property: propertyId },
      });
      return response.data;
    } catch (error) {
      console.error('Remove Favorite Error:', error.response?.data || error.message);
      throw error;
    }
  },

  getFavorites: async () => {
    try {
      const response = await axiosInstance.get('/api/favorites/');
      // FIX: handle paginated response
      return extractList(response.data);
    } catch (error) {
      console.error('Get Favorites Error:', error.response?.data || error.message);
      throw error;
    }
  },

  getUsers: async () => {
    try {
      const response = await axiosInstance.get('/api/users/');
      // FIX: handle paginated response
      return extractList(response.data);
    } catch (error) {
      console.error('Get Users Error:', error.response?.data || error.message);
      throw error;
    }
  },

  verifyUser: async (userId) => {
    try {
      // FIX: new UserVerificationView only accepts {is_verified: true}
      const response = await axiosInstance.put(`/api/users/${userId}/verify/`, {
        is_verified: true,
      });
      return response.data;
    } catch (error) {
      console.error('Verify User Error:', error.response?.data || error.message);
      throw error;
    }
  },

  banUser: async (userId) => {
    try {
      const response = await axiosInstance.delete(`/api/users/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('Ban User Error:', error.response?.data || error.message);
      throw error;
    }
  },

  getReports: async () => {
    try {
      const response = await axiosInstance.get('/api/reports/');
      // Reports returns a plain object (not a list) — no extractList needed
      return response.data;
    } catch (error) {
      console.error('Get Reports Error:', error.response?.data || error.message);
      throw error;
    }
  },
};