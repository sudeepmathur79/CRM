import axios from 'axios';

const BASE = '/api/dev';

function headers() {
  const token = sessionStorage.getItem('devToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const devApi = {
  login: (secret) =>
    axios.post(`${BASE}/auth`, { secret }).then(r => { sessionStorage.setItem('devToken', r.data.token); return r.data; }),

  logout: () => sessionStorage.removeItem('devToken'),

  isLoggedIn: () => !!sessionStorage.getItem('devToken'),

  getItems: () => axios.get(`${BASE}/items`, { headers: headers() }).then(r => r.data),

  createItem: (data) => axios.post(`${BASE}/items`, data, { headers: headers() }).then(r => r.data),

  updateItem: (id, data) => axios.patch(`${BASE}/items/${id}`, data, { headers: headers() }).then(r => r.data),

  deleteItem: (id) => axios.delete(`${BASE}/items/${id}`, { headers: headers() }).then(r => r.data),

  aiPrioritise: () => axios.post(`${BASE}/ai-prioritise`, {}, { headers: headers() }).then(r => r.data),

  aiChat: (messages) => axios.post(`${BASE}/ai-chat`, { messages }, { headers: headers() }).then(r => r.data),

  buildItem: (id) => axios.post(`${BASE}/build/${id}`, {}, { headers: headers() }).then(r => r.data),

  getStats: () => axios.get(`${BASE}/stats`, { headers: headers() }).then(r => r.data),

  // Returns an EventSource. Caller attaches .onmessage / .addEventListener handlers.
  takeover: () => {
    const token = sessionStorage.getItem('devToken');
    return new EventSource(`${BASE}/takeover?token=${encodeURIComponent(token)}`);
  },
};
