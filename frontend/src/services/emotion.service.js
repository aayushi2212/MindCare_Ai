import api from './api.js';

// Backend endpoint: POST /emotion/analyze
// Response: { data: { emotion (string), confidence, secondaryEmotion, colour, icon, isUncertain } }
const analyze = (text) => api.post('/emotion/analyze', { text });

const emotionService = { analyze };
export default emotionService;
