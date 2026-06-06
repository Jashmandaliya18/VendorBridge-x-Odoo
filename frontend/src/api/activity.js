import api from './client.js';

export const getActivityLogs = (params) => api.get('/api/activity', { params });
