import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

let refreshPromise = null;

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshPromise) {
        const rt = localStorage.getItem('refreshToken');
        if (!rt) { window.location.href = '/login'; return Promise.reject(err); }
        refreshPromise = axios.post('/api/auth/refresh', { refreshToken: rt })
          .then(r => { localStorage.setItem('accessToken', r.data.accessToken); return r.data.accessToken; })
          .catch(() => { localStorage.clear(); window.location.href = '/login'; })
          .finally(() => { refreshPromise = null; });
      }
      const token = await refreshPromise;
      if (token) { original.headers.Authorization = `Bearer ${token}`; return api(original); }
    }
    return Promise.reject(err);
  }
);

export default api;

export const configApi = {
  get: () => api.get('/config'),
};

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  register: (data) => api.post('/auth/register', data),
  setup: (data) => api.post('/auth/setup', data),
  me: () => api.get('/auth/me'),
  googleLogin: (data) => api.post('/auth/google', data),
  verify2FALogin: (data) => api.post('/auth/2fa/verify-login', data),
  setup2FA: () => api.post('/auth/2fa/setup'),
  enable2FA: (data) => api.post('/auth/2fa/enable', data),
  disable2FA: (data) => api.post('/auth/2fa/disable', data),
};

export const leadsApi = {
  list: (params) => api.get('/leads', { params }),
  get: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  bulk: (data) => api.post('/leads/bulk', data),
  activities: (id) => api.get(`/leads/${id}/activities`),
  getNotes: (id) => api.get(`/leads/${id}/notes`),
  addNote: (id, content) => api.post(`/leads/${id}/notes`, { content, type: 'manual' }),
  deleteNote: (leadId, noteId) => api.delete(`/leads/${leadId}/notes/${noteId}`),
  score: (id) => api.post(`/leads/${id}/score`),
};

export const recordingsApi = {
  list: (leadId) => api.get('/recordings', leadId ? { params: { leadId } } : undefined),
  upload: (leadId, formData) => api.post(`/recordings/upload/${leadId}`, formData),
  record: (leadId, formData) => api.post(`/recordings/record/${leadId}`, formData),
  delete: (id) => api.delete(`/recordings/${id}`),
  analyze: (id) => api.post(`/recordings/${id}/analyze`),
};

export const usersApi = {
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateMe: (data) => api.put('/users/me', data),
  delete: (id) => api.delete(`/users/${id}`),
  uploadAvatar: (formData) => api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const csvApi = {
  preview: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/csv/import?preview=true', fd);
  },
  import: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/csv/import?preview=false', fd);
  },
  export: (params) => api.get('/csv/export', { params, responseType: 'blob' }),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  charts: () => api.get('/dashboard/charts'),
  management: () => api.get('/dashboard/management'),
};

export const messagesApi = {
  list: () => api.get('/messages'),
  thread: (userId) => api.get(`/messages/${userId}`),
  send: (data) => api.post('/messages', data),
  unreadCount: () => api.get('/messages/unread-count'),
};

export const tagsApi = {
  list: () => api.get('/tags'),
  setLeadTags: (leadId, tagNames) => api.post(`/tags/lead/${leadId}`, { tagNames }),
};

export const voiceDraftsApi = {
  list: () => api.get('/voice-drafts'),
  create: (content) => api.post('/voice-drafts', { content }),
  resolve: (id, leadId) => api.post(`/voice-drafts/${id}/resolve`, { leadId }),
  dismiss: (id) => api.delete(`/voice-drafts/${id}`),
};

export const orgApi = {
  get: () => api.get('/org'),
  disableDemo: () => api.post('/org/demo/disable'),
};

export const agentsApi = {
  list: () => api.get('/agents'),
  get: (id) => api.get(`/agents/${id}`),
  create: (data) => api.post('/agents', data),
  update: (id, data) => api.put(`/agents/${id}`, data),
  delete: (id) => api.delete(`/agents/${id}`),
  run: (id, leadId) => api.post(`/agents/${id}/run`, { leadId }),
  runs: (id) => api.get(`/agents/${id}/runs`),
};
