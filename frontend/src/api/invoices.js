import api from './client.js';

export const getInvoices = (params) => api.get('/api/invoices', { params });
export const createInvoice = (data) => api.post('/api/invoices', data);
export const getInvoice = (id) => api.get(`/api/invoices/${id}`);
export const downloadInvoicePdf = (id) => api.get(`/api/invoices/${id}/pdf`, { responseType: 'blob' });
export const sendInvoiceEmail = (id, data) => api.post(`/api/invoices/${id}/send-email`, data);
export const markInvoicePaid = (id) => api.patch(`/api/invoices/${id}/mark-paid`);
