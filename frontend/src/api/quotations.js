import api from './client.js';

export const getQuotations = (params) => api.get('/api/quotations', { params });
export const createQuotation = (data) => api.post('/api/quotations', data);
export const updateQuotation = (id, data) => api.put(`/api/quotations/${id}`, data);
export const submitQuotation = (id) => api.patch(`/api/quotations/${id}/submit`);
export const selectQuotation = (id) => api.patch(`/api/quotations/${id}/select`);
export const rejectQuotation = (id) => api.patch(`/api/quotations/${id}/reject`);
