import api from './client.js';

export const getApprovals = (params) => api.get('/api/approvals', { params });
export const getPendingApprovals = () => api.get('/api/approvals/pending');
export const getApproval = (id) => api.get(`/api/approvals/${id}`);
export const approveRequest = (id, remarks) => api.post(`/api/approvals/${id}/approve`, { remarks });
export const rejectRequest = (id, remarks) => api.post(`/api/approvals/${id}/reject`, { remarks });
