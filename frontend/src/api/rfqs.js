import api from './client.js';

export const getRFQs = (params) => api.get('/api/rfqs', { params });
export const createRFQ = (data) => api.post('/api/rfqs', data);
export const getRFQ = (id) => api.get(`/api/rfqs/${id}`);
export const updateRFQ = (id, data) => api.put(`/api/rfqs/${id}`, data);
export const publishRFQ = (id) => api.patch(`/api/rfqs/${id}/publish`);
export const uploadRFQAttachment = (id, formData) => api.post(`/api/rfqs/${id}/attachments`, formData);
export const getRFQQuotations = (rfqId) => api.get(`/api/rfqs/${rfqId}/quotations`);
export const addRFQVendors = (id, data) => api.patch(`/api/rfqs/${id}/vendors`, data);
export const deleteRFQ = (id) => api.delete(`/api/rfqs/${id}`);
export const closeRFQ = (id) => api.patch(`/api/rfqs/${id}/close`);
