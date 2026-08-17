import api from './api.js';

const generate = (dto) => api.post('/response/generate', dto);
const responseService = { generate };
export default responseService;
