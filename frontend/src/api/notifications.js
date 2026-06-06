import api from './client.js';

export const getNotifications = () => api.get('/api/notifications');
export const markNotificationRead = (id) => api.patch(`/api/notifications/${id}/read`);
export const markAllRead = () => api.patch('/api/notifications/read-all');
