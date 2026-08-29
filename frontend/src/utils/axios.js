import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On 401 — try to refresh the token, then retry the original request.
// FIX: skip this entirely for the login endpoint itself. A 401 from
// /api/token/ just means "wrong username or password" — it is not an
// expired session, so there is nothing to refresh and no reason to
// force a full page navigation back to /login (which was wiping out
// whatever the user had typed and looked like a jarring page "blink").
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isLoginRequest = original?.url?.includes('/api/token/') && !original.url.includes('refresh');

    if (error.response?.status === 401 && !original._retry && !isLoginRequest) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('No refresh token');
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/token/refresh/`,
          { refresh }
        );
        const newAccess = res.data.access;
        localStorage.setItem('access_token', newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return axiosInstance(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;