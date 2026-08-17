import api from './api.js';

// POST /chat → created() → { data: { conversation } }
const createConversation = (title = '') => api.post('/chat', { title });

// GET /chat → paginated() → { data: [], pagination: {} }
const listConversations = (params = {}) => api.get('/chat', { params });

// GET /chat/:id → success() → { data: { conversation } }
const getConversation = (id) => api.get(`/chat/${id}`);

// GET /chat/:id/messages → paginated() → { data: [], pagination: {} }
const getMessages = (id, params = {}) => api.get(`/chat/${id}/messages`, { params });

// POST /chat/:id/send → full pipeline → { data: { userMessage, aiMessage, emotion } }
const sendAndProcess = (id, content) => api.post(`/chat/${id}/send`, { content });

// POST /chat/:id/messages → save raw message (used for edge cases only)
const sendMessage = (id, dto) => api.post(`/chat/${id}/messages`, dto);

const renameConversation = (id, title) => api.patch(`/chat/${id}`, { title });
const deleteConversation = (id) => api.delete(`/chat/${id}`);

const chatService = {
  createConversation, listConversations, getConversation,
  getMessages, sendAndProcess, sendMessage,
  renameConversation, deleteConversation,
};
export default chatService;
