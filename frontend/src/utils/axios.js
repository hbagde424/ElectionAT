import axios from 'axios';

const axiosServices = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || 'https://myhostmanager.co.in/backend/api',
  withCredentials: true,
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0',
  }
});

// ==============================|| AXIOS - FOR MOCK SERVICES ||============================== //

axiosServices.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem('serviceToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
      // Debug log to verify token is being added (only for visits endpoint to reduce noise)
      if (config.url && config.url.includes('/visits')) {
        console.log('[Axios Interceptor] Token added to request:', config.url);
        console.log('[Axios Interceptor] Token preview:', accessToken.substring(0, 20) + '...');
      }
    } else {
      // Remove Authorization header if no token exists
      delete config.headers['Authorization'];
      if (config.url && config.url.includes('/visits')) {
        console.warn('[Axios Interceptor] No token found in localStorage for request:', config.url);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosServices.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only log errors for visits endpoint to reduce console noise
    const isVisitsRequest = error.config?.url?.includes('/visits');

    if (error.response && error.response.status === 401) {
      if (isVisitsRequest) {
        console.error('[Axios Interceptor] 401 Unauthorized error for:', error.config?.url);
        console.error('[Axios Interceptor] Error response:', error.response.data);

        // Check if token exists
        const token = localStorage.getItem('serviceToken');
        if (!token) {
          console.warn('[Axios Interceptor] No token in localStorage - redirecting to login');
        } else {
          console.warn('[Axios Interceptor] Token exists but request was rejected');
          console.warn('[Axios Interceptor] Possible causes:');
          console.warn('  1. Token expired - try logging in again');
          console.warn('  2. JWT_SECRET mismatch between frontend and backend');
          console.warn('  3. User account disabled or deleted');
          console.warn('  4. Token format issue');
        }
      }

      // Only redirect if not already on login page
      if (!window.location.href.includes('/login')) {
        // Don't redirect immediately - let user see the error first
        // window.location.pathname = '/election/login';
      }
    }

    // Return error without throwing to prevent console spam
    return Promise.reject((error.response && error.response.data) || 'Wrong Services');
  }
);

export default axiosServices;

export const fetcher = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosServices.get(url, { ...config });

  return res.data;
};

export const fetcherPost = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosServices.post(url, { ...config });

  return res.data;
};

