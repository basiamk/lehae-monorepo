import axiosInstance from '../utils/axios.js';

export const propertyAPI = {
  getProperties: async (filters = {}) => {
    try {
      console.log('Sending filters:', filters);
      const response = await axiosInstance.get('/api/properties/', {
        params: {
          id: filters.id || undefined,
          district: filters.district || undefined,
          area: filters.area || undefined,
          min_amount: filters.minPrice || undefined,
          max_amount: filters.maxPrice || undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          landlord: filters.landlord || undefined,
        },
      });
      console.log('API Response:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  },
  updateProperty: async (propertyId, data) => {
    try {
      console.log('Updating property:', { propertyId, data });
      const response = await axiosInstance.put(`/api/properties/${propertyId}/`, data);
      console.log('Update Property Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update Property Error:', error.response?.data || error.message);
      throw error;
    }
  },
  deleteProperty: async (propertyId) => {
    try {
      console.log('Deleting property:', propertyId);
      const response = await axiosInstance.delete(`/api/properties/${propertyId}/`);
      console.log('Delete Property Response:', response.status);
      return response.data;
    } catch (error) {
      console.error('Delete Property Error:', error.response?.data || error.message);
      throw error;
    }
  },
  uploadPropertyImage: async (formData) => {
    try {
      console.log('Uploading property image');
      const response = await axiosInstance.post('/api/property-images/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Upload Image Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Upload Image Error:', error.response?.data || error.message);
      throw error;
    }
  },
  deletePropertyImage: async (imageId) => {
    try {
      console.log('Deleting property image:', imageId);
      const response = await axiosInstance.delete(`/api/property-images/${imageId}/`);
      console.log('Delete Image Response:', response.status);
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
      console.log('Add Favorite Response:', response.data);
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
      console.log('Remove Favorite Response:', response.status);
      return response.data;
    } catch (error) {
      console.error('Remove Favorite Error:', error.response?.data || error.message);
      throw error;
    }
  },
  getFavorites: async () => {
    try {
      const response = await axiosInstance.get('/api/favorites/');
      console.log('Favorites Response:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Get Favorites Error:', error.response?.data || error.message);
      throw error;
    }
  },

  getUsers: async () => {
  try {
    const response = await axiosInstance.get('/api/users/');
    console.log('Users Response:', response.data);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Get Users Error:', error.response?.data || error.message);
    throw error;
  }
},
verifyUser: async (userId) => {
  try {
    const response = await axiosInstance.put(`/api/users/${userId}/verify/`, { profile: { is_verified: true } });
    console.log('Verify User Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Verify User Error:', error.response?.data || error.message);
    throw error;
  }
},
banUser: async (userId) => {
  try {
    const response = await axiosInstance.delete(`/api/users/${userId}/`);
    console.log('Ban User Response:', response.status);
    return response.data;
  } catch (error) {
    console.error('Ban User Error:', error.response?.data || error.message);
    throw error;
  }
},
getReports: async () => {
  try {
    const response = await axiosInstance.get('/api/reports/');
    console.log('Reports Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get Reports Error:', error.response?.data || error.message);
    throw error;
  }
},
};