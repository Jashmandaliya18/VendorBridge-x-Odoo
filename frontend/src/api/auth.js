import api from './client.js';

export const loginUser = (data) => api.post('/api/auth/login', data);
export const registerUser = (data) => api.post('/api/auth/register', data);
export const getMe = () => api.get('/api/auth/me');
export const forgotPassword = (email) => api.post('/api/auth/forgot-password', { email });
export const updateProfile = (data) => api.put('/api/auth/me', data);
