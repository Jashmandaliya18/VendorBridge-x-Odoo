import api from './client.js';

export const getVendors = (params) => api.get('/api/vendors', { params });
export const getVendorStats = () => api.get('/api/vendors/stats');
export const createVendor = (data) => api.post('/api/vendors', data);
export const getVendor = (id) => api.get(`/api/vendors/${id}`);
export const updateVendor = (id, data) => api.put(`/api/vendors/${id}`, data);
export const updateVendorStatus = (id, status) => api.patch(`/api/vendors/${id}/status`, { status });
export const deleteVendor = (id) => api.delete(`/api/vendors/${id}`);
