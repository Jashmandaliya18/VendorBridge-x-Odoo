import api from './client.js';

export const getPurchaseOrders = (params) => api.get('/api/purchase-orders', { params });
export const createPO = (data) => api.post('/api/purchase-orders', data);
export const getPO = (id) => api.get(`/api/purchase-orders/${id}`);
export const updatePOStatus = (id, status) => api.patch(`/api/purchase-orders/${id}/status`, { status });
export const downloadPOPdf = (id) => api.get(`/api/purchase-orders/${id}/pdf`, { responseType: 'blob' });
export const sendPOEmail = (id, data) => api.post(`/api/purchase-orders/${id}/send-email`, data);
