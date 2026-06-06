import api from './client.js';

export const getReportSummary = (params) => api.get('/api/reports/summary', { params });
export const getSummary = getReportSummary;
export const getSpendingTrend = () => api.get('/api/reports/spending-trend');
export const getVendorPerformance = () => api.get('/api/reports/vendor-performance');
export const exportReport = (format) => api.get('/api/reports/export', { params: { format }, responseType: 'blob' });
