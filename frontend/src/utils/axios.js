import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://lehae-backend.onrender.com', // Your Render URL
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added Authorization header:', config.headers.Authorization);
    } else {
      console.log('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.log('No refresh token available');
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        console.log('Attempting token refresh');
        const response = await axios.post('https://lehae-backend.onrender.com/api/token/refresh/', {
          refresh: refreshToken,
        });
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        console.log('Token refreshed successfully, new access token:', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;