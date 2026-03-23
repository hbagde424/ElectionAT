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
    } else {
      // Remove Authorization header if no token exists
      delete config.headers['Authorization'];
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
    if (error.response && error.response.status === 401) {
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

