import axios from './axios';

export const registerUser = (userData) => axios.post('/auth/register', userData);
export const loginUser = (credentials) => axios.post('/auth/login', credentials);
export const getCurrentUser = () => axios.get('/auth/me');
export const getPolygons = () => axios.get('/map/polygons');

// Add other API calls as needed