import api from './api.js';

const getOverview        = () => api.get('/analytics/overview');
const getMoodTrend       = (params = {}) => api.get('/analytics/mood-trend', { params });
const getEmotionFrequency= (params = {}) => api.get('/analytics/emotions', { params });
const getWeeklySummary   = () => api.get('/analytics/weekly');
const getMonthlySummary  = () => api.get('/analytics/monthly');
const getJournalHistory  = (params = {}) => api.get('/analytics/journal-history', { params });

const analyticsService = {
  getOverview, getMoodTrend, getEmotionFrequency,
  getWeeklySummary, getMonthlySummary, getJournalHistory,
};
export default analyticsService;
