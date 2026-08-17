import api from './api.js';

const createEntry  = (dto) => api.post('/journal', dto);
const listEntries  = (params = {}) => api.get('/journal', { params });
const getEntry     = (id) => api.get(`/journal/${id}`);
const updateEntry  = (id, dto) => api.patch(`/journal/${id}`, dto);
const deleteEntry  = (id) => api.delete(`/journal/${id}`);

const journalService = { createEntry, listEntries, getEntry, updateEntry, deleteEntry };
export default journalService;
